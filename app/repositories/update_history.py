import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.update_history import UpdateHistory
from app.repositories.base import BaseRepository


class UpdateHistoryRepository(BaseRepository[UpdateHistory]):
    model = UpdateHistory

    def __init__(self, db: Session) -> None:
        super().__init__(db)

    def list_by_export_record(self, export_record_id: uuid.UUID) -> list[UpdateHistory]:
        stmt = (
            select(UpdateHistory)
            .where(UpdateHistory.export_record_id == export_record_id)
            .options(joinedload(UpdateHistory.changed_by))
            .order_by(UpdateHistory.created_at.desc())
        )
        return list(self.db.scalars(stmt).unique().all())

    def list_by_import_record(self, import_record_id: uuid.UUID) -> list[UpdateHistory]:
        stmt = (
            select(UpdateHistory)
            .where(UpdateHistory.import_record_id == import_record_id)
            .options(joinedload(UpdateHistory.changed_by))
            .order_by(UpdateHistory.created_at.desc())
        )
        return list(self.db.scalars(stmt).unique().all())
