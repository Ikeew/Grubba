import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.export_file import ExportFile
from app.repositories.base import BaseRepository


class ExportFileRepository(BaseRepository[ExportFile]):
    model = ExportFile

    def __init__(self, db: Session) -> None:
        super().__init__(db)

    def list_by_record(self, export_record_id: uuid.UUID) -> list[ExportFile]:
        stmt = (
            select(ExportFile)
            .where(ExportFile.export_record_id == export_record_id)
            .order_by(ExportFile.created_at.asc())
        )
        return list(self.db.scalars(stmt).all())
