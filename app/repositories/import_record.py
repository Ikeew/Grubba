import uuid
from datetime import date
from typing import Any

from sqlalchemy import case, func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.client import Client
from app.models.import_record import ImportRecord, ImportStatus, import_record_flags
from app.repositories.base import BaseRepository


class ImportRecordRepository(BaseRepository[ImportRecord]):
    model = ImportRecord

    def __init__(self, db: Session) -> None:
        super().__init__(db)

    def find_by_normalized_reference(
        self, normalized_ref: str, exclude_id: uuid.UUID | None = None
    ) -> ImportRecord | None:
        stmt = select(ImportRecord).where(
            func.lower(func.regexp_replace(ImportRecord.reference, "[^a-zA-Z0-9]", "", "g"))
            == normalized_ref.lower()
        )
        if exclude_id:
            stmt = stmt.where(ImportRecord.id != exclude_id)
        return self.db.scalar(stmt)

    def get_with_relations(self, record_id: uuid.UUID) -> ImportRecord | None:
        stmt = (
            select(ImportRecord)
            .where(ImportRecord.id == record_id)
            .options(
                joinedload(ImportRecord.client),
                joinedload(ImportRecord.collaborator),
                joinedload(ImportRecord.port),
                joinedload(ImportRecord.flagged_by),
            )
        )
        return self.db.scalar(stmt)

    def list_with_filters(
        self,
        *,
        current_user_id: uuid.UUID,
        is_admin: bool,
        client_id: uuid.UUID | None = None,
        status: ImportStatus | None = None,
        collaborator_id: uuid.UUID | None = None,
        search: str | None = None,
        vessel: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        etb_from: date | None = None,
        etb_to: date | None = None,
        offset: int = 0,
        limit: int = 20,
    ) -> list[ImportRecord]:
        stmt = select(ImportRecord).options(
            joinedload(ImportRecord.client),
            joinedload(ImportRecord.collaborator),
            joinedload(ImportRecord.port),
            joinedload(ImportRecord.flagged_by),
        )
        stmt = self._apply_filters(stmt, client_id, status, collaborator_id, search, vessel, date_from, date_to, etb_from, etb_to)
        stmt = self._apply_ordering(stmt, current_user_id, is_admin)
        stmt = stmt.offset(offset).limit(limit)
        return list(self.db.scalars(stmt).unique().all())

    def count_with_filters(
        self,
        *,
        client_id: uuid.UUID | None = None,
        status: ImportStatus | None = None,
        collaborator_id: uuid.UUID | None = None,
        search: str | None = None,
        vessel: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        etb_from: date | None = None,
        etb_to: date | None = None,
    ) -> int:
        stmt = select(func.count()).select_from(ImportRecord)
        stmt = self._apply_filters(stmt, client_id, status, collaborator_id, search, vessel, date_from, date_to, etb_from, etb_to)
        return self.db.scalar(stmt) or 0

    def _apply_filters(
        self,
        stmt: Any,
        client_id: Any,
        status: Any,
        collaborator_id: Any,
        search: str | None,
        vessel: str | None,
        date_from: date | None,
        date_to: date | None,
        etb_from: date | None = None,
        etb_to: date | None = None,
    ) -> Any:
        if search is not None:
            stmt = stmt.join(Client, ImportRecord.client_id == Client.id).where(
                or_(
                    Client.name.ilike(f"%{search}%"),
                    ImportRecord.reference.ilike(f"%{search}%"),
                )
            )
        if vessel is not None:
            stmt = stmt.where(ImportRecord.vessel.ilike(f"%{vessel}%"))
        if client_id is not None:
            stmt = stmt.where(ImportRecord.client_id == client_id)
        if status is not None:
            if isinstance(status, list):
                if status:
                    stmt = stmt.where(ImportRecord.status.in_(status))
            else:
                stmt = stmt.where(ImportRecord.status == status)
        if collaborator_id is not None:
            stmt = stmt.where(ImportRecord.collaborator_id == collaborator_id)
        if date_from is not None:
            stmt = stmt.where(ImportRecord.date >= date_from)
        if date_to is not None:
            stmt = stmt.where(ImportRecord.date <= date_to)
        if etb_from is not None:
            stmt = stmt.where(ImportRecord.etb >= etb_from)
        if etb_to is not None:
            stmt = stmt.where(ImportRecord.etb <= etb_to)
        return stmt

    def _apply_ordering(self, stmt: Any, current_user_id: uuid.UUID, is_admin: bool) -> Any:
        flagged_by_me = (
            select(import_record_flags.c.import_record_id)
            .where(import_record_flags.c.user_id == current_user_id)
            .scalar_subquery()
        )
        is_flagged_by_me = ImportRecord.id.in_(flagged_by_me)

        if is_admin:
            flagged_by_anyone = (
                select(import_record_flags.c.import_record_id)
                .scalar_subquery()
            )
            is_flagged_by_anyone = ImportRecord.id.in_(flagged_by_anyone)

            sort_key = case(
                (is_flagged_by_me, 0),
                (ImportRecord.collaborator_id == current_user_id, 1),
                (is_flagged_by_anyone, 2),
                else_=3,
            )
        else:
            sort_key = case(
                (is_flagged_by_me, 0),
                (ImportRecord.collaborator_id == current_user_id, 1),
                else_=2,
            )

        return stmt.order_by(sort_key, ImportRecord.created_at.desc())

    def toggle_flag(self, record_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        """Toggle flag for user. Returns True if flagged, False if unflagged."""
        existing = self.db.execute(
            select(import_record_flags).where(
                import_record_flags.c.user_id == user_id,
                import_record_flags.c.import_record_id == record_id,
            )
        ).first()
        if existing:
            self.db.execute(
                import_record_flags.delete().where(
                    import_record_flags.c.user_id == user_id,
                    import_record_flags.c.import_record_id == record_id,
                )
            )
            self.db.flush()
            return False
        else:
            self.db.execute(
                import_record_flags.insert().values(user_id=user_id, import_record_id=record_id)
            )
            self.db.flush()
            return True
