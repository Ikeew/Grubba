import uuid
from datetime import date, datetime
from typing import Any

from sqlalchemy import case, func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.client import Client
from app.models.deconsolidation_record import (
    DeconsolidationRecord,
    DeconsolidationStatus,
    deconsolidation_record_flags,
)
from app.repositories.base import BaseRepository


class DeconsolidationRecordRepository(BaseRepository[DeconsolidationRecord]):
    model = DeconsolidationRecord

    def __init__(self, db: Session) -> None:
        super().__init__(db)

    def find_by_normalized_reference(
        self, normalized_ref: str, exclude_id: uuid.UUID | None = None
    ) -> DeconsolidationRecord | None:
        stmt = select(DeconsolidationRecord).where(
            func.lower(
                func.regexp_replace(DeconsolidationRecord.reference, "[^a-zA-Z0-9]", "", "g")
            )
            == normalized_ref.lower()
        )
        if exclude_id:
            stmt = stmt.where(DeconsolidationRecord.id != exclude_id)
        return self.db.scalar(stmt)

    def get_with_relations(self, record_id: uuid.UUID) -> DeconsolidationRecord | None:
        stmt = (
            select(DeconsolidationRecord)
            .where(DeconsolidationRecord.id == record_id)
            .options(
                joinedload(DeconsolidationRecord.client),
                joinedload(DeconsolidationRecord.collaborator),
                joinedload(DeconsolidationRecord.flags),
            )
        )
        return self.db.scalar(stmt)

    def list_with_filters(
        self,
        *,
        current_user_id: uuid.UUID,
        is_admin: bool,
        client_id: uuid.UUID | None = None,
        status: DeconsolidationStatus | None = None,
        collaborator_id: uuid.UUID | None = None,
        search: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        completed_from: datetime | None = None,
        completed_to: datetime | None = None,
        created_from: datetime | None = None,
        created_to: datetime | None = None,
        billing_completed: bool | None = None,
        offset: int = 0,
        limit: int = 20,
    ) -> list[DeconsolidationRecord]:
        stmt = select(DeconsolidationRecord).options(
            joinedload(DeconsolidationRecord.client),
            joinedload(DeconsolidationRecord.collaborator),
            joinedload(DeconsolidationRecord.flags),
        )
        stmt = self._apply_filters(
            stmt, client_id, status, collaborator_id, search, date_from, date_to,
            completed_from, completed_to, created_from, created_to, billing_completed,
        )
        stmt = self._apply_ordering(stmt, current_user_id, is_admin)
        stmt = stmt.offset(offset).limit(limit)
        return list(self.db.scalars(stmt).unique().all())

    def count_with_filters(
        self,
        *,
        client_id: uuid.UUID | None = None,
        status: DeconsolidationStatus | None = None,
        collaborator_id: uuid.UUID | None = None,
        search: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        completed_from: datetime | None = None,
        completed_to: datetime | None = None,
        created_from: datetime | None = None,
        created_to: datetime | None = None,
        billing_completed: bool | None = None,
    ) -> int:
        stmt = select(func.count()).select_from(DeconsolidationRecord)
        stmt = self._apply_filters(
            stmt, client_id, status, collaborator_id, search, date_from, date_to,
            completed_from, completed_to, created_from, created_to, billing_completed,
        )
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
        completed_from: datetime | None = None,
        completed_to: datetime | None = None,
        created_from: datetime | None = None,
        created_to: datetime | None = None,
        billing_completed: bool | None = None,
    ) -> Any:
        if search is not None:
            stmt = stmt.join(Client, DeconsolidationRecord.client_id == Client.id).where(
                or_(
                    Client.name.ilike(f"%{search}%"),
                    DeconsolidationRecord.reference.ilike(f"%{search}%"),
                    DeconsolidationRecord.consignee.ilike(f"%{search}%"),
                )
            )
        if client_id is not None:
            stmt = stmt.where(DeconsolidationRecord.client_id == client_id)
        if status is not None:
            if isinstance(status, list):
                if status:
                    stmt = stmt.where(DeconsolidationRecord.status.in_(status))
            else:
                stmt = stmt.where(DeconsolidationRecord.status == status)
        if collaborator_id is not None:
            stmt = stmt.where(DeconsolidationRecord.collaborator_id == collaborator_id)
        if date_from is not None:
            stmt = stmt.where(DeconsolidationRecord.date >= date_from)
        if date_to is not None:
            stmt = stmt.where(DeconsolidationRecord.date <= date_to)
        if completed_from is not None:
            stmt = stmt.where(DeconsolidationRecord.completed_at >= completed_from)
        if completed_to is not None:
            stmt = stmt.where(DeconsolidationRecord.completed_at <= completed_to)
        if created_from is not None:
            stmt = stmt.where(DeconsolidationRecord.created_at >= created_from)
        if created_to is not None:
            stmt = stmt.where(DeconsolidationRecord.created_at <= created_to)
        if billing_completed is not None:
            stmt = stmt.where(DeconsolidationRecord.billing_completed == billing_completed)
        return stmt

    def _apply_ordering(self, stmt: Any, current_user_id: uuid.UUID, is_admin: bool) -> Any:
        my_flag_color = (
            select(deconsolidation_record_flags.c.color)
            .where(
                deconsolidation_record_flags.c.user_id == current_user_id,
                deconsolidation_record_flags.c.deconsolidation_record_id
                == DeconsolidationRecord.id,
            )
            .scalar_subquery()
        )

        if is_admin:
            flagged_by_anyone = (
                select(deconsolidation_record_flags.c.deconsolidation_record_id)
                .scalar_subquery()
            )
            is_flagged_by_anyone = DeconsolidationRecord.id.in_(flagged_by_anyone)

            sort_key = case(
                (my_flag_color == "red", 0),
                (my_flag_color == "yellow", 1),
                (DeconsolidationRecord.collaborator_id == current_user_id, 2),
                (is_flagged_by_anyone, 3),
                else_=4,
            )
        else:
            sort_key = case(
                (my_flag_color == "red", 0),
                (my_flag_color == "yellow", 1),
                (DeconsolidationRecord.collaborator_id == current_user_id, 2),
                else_=3,
            )

        return stmt.order_by(sort_key, DeconsolidationRecord.created_at.desc())

    def set_flag(
        self, record_id: uuid.UUID, user_id: uuid.UUID, color: str | None
    ) -> str | None:
        """Set/replace/remove the current user's flag.

        Passing ``color=None`` or the color already stored removes the flag.
        Returns the resulting color, or ``None`` if unflagged.
        """
        existing = self.db.execute(
            select(deconsolidation_record_flags.c.color).where(
                deconsolidation_record_flags.c.user_id == user_id,
                deconsolidation_record_flags.c.deconsolidation_record_id == record_id,
            )
        ).first()
        current = existing[0] if existing else None

        if color is None or color == current:
            if current is not None:
                self.db.execute(
                    deconsolidation_record_flags.delete().where(
                        deconsolidation_record_flags.c.user_id == user_id,
                        deconsolidation_record_flags.c.deconsolidation_record_id == record_id,
                    )
                )
                self.db.flush()
            return None

        if current is None:
            self.db.execute(
                deconsolidation_record_flags.insert().values(
                    user_id=user_id, deconsolidation_record_id=record_id, color=color
                )
            )
        else:
            self.db.execute(
                deconsolidation_record_flags.update()
                .where(
                    deconsolidation_record_flags.c.user_id == user_id,
                    deconsolidation_record_flags.c.deconsolidation_record_id == record_id,
                )
                .values(color=color)
            )
        self.db.flush()
        return color
