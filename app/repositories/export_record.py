import uuid
from datetime import date
from typing import Any

from sqlalchemy import case, func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.client import Client
from app.models.export_record import ExportRecord, ExportStatus, export_record_flags
from app.repositories.base import BaseRepository


class ExportRecordRepository(BaseRepository[ExportRecord]):
    model = ExportRecord

    def __init__(self, db: Session) -> None:
        super().__init__(db)

    def find_by_normalized_reference(
        self, normalized_ref: str, exclude_id: uuid.UUID | None = None
    ) -> ExportRecord | None:
        stmt = select(ExportRecord).where(
            func.lower(func.regexp_replace(ExportRecord.reference, "[^a-zA-Z0-9]", "", "g"))
            == normalized_ref.lower()
        )
        if exclude_id:
            stmt = stmt.where(ExportRecord.id != exclude_id)
        return self.db.scalar(stmt)

    def get_with_relations(self, record_id: uuid.UUID) -> ExportRecord | None:
        stmt = (
            select(ExportRecord)
            .where(ExportRecord.id == record_id)
            .options(
                joinedload(ExportRecord.client),
                joinedload(ExportRecord.collaborator),
                joinedload(ExportRecord.port),
                joinedload(ExportRecord.flagged_by),
            )
        )
        return self.db.scalar(stmt)

    def list_with_filters(
        self,
        *,
        current_user_id: uuid.UUID,
        is_admin: bool,
        client_id: uuid.UUID | None = None,
        status: ExportStatus | None = None,
        collaborator_id: uuid.UUID | None = None,
        search: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        ets_from: date | None = None,
        ets_to: date | None = None,
        offset: int = 0,
        limit: int = 20,
    ) -> list[ExportRecord]:
        stmt = select(ExportRecord).options(
            joinedload(ExportRecord.client),
            joinedload(ExportRecord.collaborator),
            joinedload(ExportRecord.port),
            joinedload(ExportRecord.flagged_by),
        )
        stmt = self._apply_filters(stmt, client_id, status, collaborator_id, search, date_from, date_to, ets_from, ets_to)
        stmt = self._apply_ordering(stmt, current_user_id, is_admin)
        stmt = stmt.offset(offset).limit(limit)
        return list(self.db.scalars(stmt).unique().all())

    def count_with_filters(
        self,
        *,
        client_id: uuid.UUID | None = None,
        status: ExportStatus | None = None,
        collaborator_id: uuid.UUID | None = None,
        search: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        ets_from: date | None = None,
        ets_to: date | None = None,
    ) -> int:
        stmt = select(func.count()).select_from(ExportRecord)
        stmt = self._apply_filters(stmt, client_id, status, collaborator_id, search, date_from, date_to, ets_from, ets_to)
        return self.db.scalar(stmt) or 0

    def _apply_filters(
        self,
        stmt: Any,
        client_id: Any,
        status: Any,
        collaborator_id: Any,
        search: str | None,
        date_from: date | None,
        date_to: date | None,
        ets_from: date | None = None,
        ets_to: date | None = None,
    ) -> Any:
        if search is not None:
            stmt = stmt.join(Client, ExportRecord.client_id == Client.id).where(
                or_(
                    Client.name.ilike(f"%{search}%"),
                    ExportRecord.reference.ilike(f"%{search}%"),
                )
            )
        if client_id is not None:
            stmt = stmt.where(ExportRecord.client_id == client_id)
        if status is not None:
            if isinstance(status, list):
                if status:
                    stmt = stmt.where(ExportRecord.status.in_(status))
            else:
                stmt = stmt.where(ExportRecord.status == status)
        if collaborator_id is not None:
            stmt = stmt.where(ExportRecord.collaborator_id == collaborator_id)
        if date_from is not None:
            stmt = stmt.where(ExportRecord.date >= date_from)
        if date_to is not None:
            stmt = stmt.where(ExportRecord.date <= date_to)
        if ets_from is not None:
            stmt = stmt.where(ExportRecord.ets >= ets_from)
        if ets_to is not None:
            stmt = stmt.where(ExportRecord.ets <= ets_to)
        return stmt

    def _apply_ordering(self, stmt: Any, current_user_id: uuid.UUID, is_admin: bool) -> Any:
        """
        Ordering rules:
        1. Flagged by current user (highest priority)
        2. Own records (for collaborators) / own un-flagged records
        3. Flagged by others (admin only)
        4. Rest
        """
        # Subquery: is flagged by current user?
        flagged_by_me = (
            select(export_record_flags.c.export_record_id)
            .where(export_record_flags.c.user_id == current_user_id)
            .scalar_subquery()
        )
        is_flagged_by_me = ExportRecord.id.in_(flagged_by_me)

        if is_admin:
            # Subquery: is flagged by anyone?
            flagged_by_anyone = (
                select(export_record_flags.c.export_record_id)
                .scalar_subquery()
            )
            is_flagged_by_anyone = ExportRecord.id.in_(flagged_by_anyone)

            sort_key = case(
                (is_flagged_by_me, 0),
                (ExportRecord.collaborator_id == current_user_id, 1),
                (is_flagged_by_anyone, 2),
                else_=3,
            )
        else:
            sort_key = case(
                (is_flagged_by_me, 0),
                else_=1,
            )

        return stmt.order_by(sort_key, ExportRecord.created_at.desc())

    def toggle_flag(self, record_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        """Toggle flag for user. Returns True if flagged, False if unflagged."""
        existing = self.db.execute(
            select(export_record_flags).where(
                export_record_flags.c.user_id == user_id,
                export_record_flags.c.export_record_id == record_id,
            )
        ).first()
        if existing:
            self.db.execute(
                export_record_flags.delete().where(
                    export_record_flags.c.user_id == user_id,
                    export_record_flags.c.export_record_id == record_id,
                )
            )
            self.db.flush()
            return False
        else:
            self.db.execute(
                export_record_flags.insert().values(user_id=user_id, export_record_id=record_id)
            )
            self.db.flush()
            return True
