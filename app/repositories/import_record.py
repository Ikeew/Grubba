import uuid
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.export_record import RecordStatus
from app.models.import_record import ImportRecord
from app.repositories.base import BaseRepository


class ImportRecordRepository(BaseRepository[ImportRecord]):
    model = ImportRecord

    def __init__(self, db: Session) -> None:
        super().__init__(db)

    def get_with_relations(self, record_id: uuid.UUID) -> ImportRecord | None:
        stmt = (
            select(ImportRecord)
            .where(ImportRecord.id == record_id)
            .options(
                joinedload(ImportRecord.client),
                joinedload(ImportRecord.collaborator),
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
    ) -> list[ImportRecord]:
        stmt = select(ImportRecord).options(
            joinedload(ImportRecord.client),
            joinedload(ImportRecord.collaborator),
        )
        stmt = self._apply_filters(stmt, client_id, status, collaborator_id)
        stmt = stmt.order_by(ImportRecord.created_at.desc()).offset(offset).limit(limit)
        return list(self.db.scalars(stmt).unique().all())

    def count_with_filters(
        self,
        *,
        client_id: uuid.UUID | None = None,
        status: RecordStatus | None = None,
        collaborator_id: uuid.UUID | None = None,
    ) -> int:
        stmt = select(func.count()).select_from(ImportRecord)
        stmt = self._apply_filters(stmt, client_id, status, collaborator_id)
        return self.db.scalar(stmt) or 0

    def _apply_filters(self, stmt: Any, client_id: Any, status: Any, collaborator_id: Any) -> Any:
        if client_id is not None:
            stmt = stmt.where(ImportRecord.client_id == client_id)
        if status is not None:
            stmt = stmt.where(ImportRecord.status == status)
        if collaborator_id is not None:
            stmt = stmt.where(ImportRecord.collaborator_id == collaborator_id)
        return stmt
