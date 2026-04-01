import uuid
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.export_record import ExportRecord, RecordStatus
from app.repositories.base import BaseRepository


class ExportRecordRepository(BaseRepository[ExportRecord]):
    model = ExportRecord

    def __init__(self, db: Session) -> None:
        super().__init__(db)

    def get_with_relations(self, record_id: uuid.UUID) -> ExportRecord | None:
        stmt = (
            select(ExportRecord)
            .where(ExportRecord.id == record_id)
            .options(
                joinedload(ExportRecord.client),
                joinedload(ExportRecord.collaborator),
            )
        )
        return self.db.scalar(stmt)

    def list_with_filters(
        self,
        *,
        client_id: uuid.UUID | None = None,
        status: RecordStatus | None = None,
        collaborator_id: uuid.UUID | None = None,
        offset: int = 0,
        limit: int = 20,
    ) -> list[ExportRecord]:
        stmt = select(ExportRecord).options(
            joinedload(ExportRecord.client),
            joinedload(ExportRecord.collaborator),
        )
        stmt = self._apply_filters(stmt, client_id, status, collaborator_id)
        stmt = stmt.order_by(ExportRecord.created_at.desc()).offset(offset).limit(limit)
        return list(self.db.scalars(stmt).unique().all())

    def count_with_filters(
        self,
        *,
        client_id: uuid.UUID | None = None,
        status: RecordStatus | None = None,
        collaborator_id: uuid.UUID | None = None,
    ) -> int:
        stmt = select(func.count()).select_from(ExportRecord)
        stmt = self._apply_filters(stmt, client_id, status, collaborator_id)
        return self.db.scalar(stmt) or 0

    def _apply_filters(self, stmt: Any, client_id: Any, status: Any, collaborator_id: Any) -> Any:
        if client_id is not None:
            stmt = stmt.where(ExportRecord.client_id == client_id)
        if status is not None:
            stmt = stmt.where(ExportRecord.status == status)
        if collaborator_id is not None:
            stmt = stmt.where(ExportRecord.collaborator_id == collaborator_id)
        return stmt
