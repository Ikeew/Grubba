import uuid
from datetime import date
from typing import Any

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.client import Client
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
        search: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
        offset: int = 0,
        limit: int = 20,
    ) -> list[ImportRecord]:
        stmt = select(ImportRecord).options(
            joinedload(ImportRecord.client),
            joinedload(ImportRecord.collaborator),
        )
        stmt = self._apply_filters(stmt, client_id, status, collaborator_id, search, date_from, date_to)
        stmt = stmt.order_by(ImportRecord.created_at.desc()).offset(offset).limit(limit)
        return list(self.db.scalars(stmt).unique().all())

    def count_with_filters(
        self,
        *,
        client_id: uuid.UUID | None = None,
        status: RecordStatus | None = None,
        collaborator_id: uuid.UUID | None = None,
        search: str | None = None,
        date_from: date | None = None,
        date_to: date | None = None,
    ) -> int:
        stmt = select(func.count()).select_from(ImportRecord)
        stmt = self._apply_filters(stmt, client_id, status, collaborator_id, search, date_from, date_to)
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
    ) -> Any:
        if search is not None:
            stmt = stmt.join(Client, ImportRecord.client_id == Client.id).where(
                or_(
                    Client.name.ilike(f"%{search}%"),
                    ImportRecord.reference.ilike(f"%{search}%"),
                )
            )
        if client_id is not None:
            stmt = stmt.where(ImportRecord.client_id == client_id)
        if status is not None:
            stmt = stmt.where(ImportRecord.status == status)
        if collaborator_id is not None:
            stmt = stmt.where(ImportRecord.collaborator_id == collaborator_id)
        if date_from is not None:
            stmt = stmt.where(ImportRecord.date >= date_from)
        if date_to is not None:
            stmt = stmt.where(ImportRecord.date <= date_to)
        return stmt
