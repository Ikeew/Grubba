import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.import_file import ImportFile
from app.repositories.base import BaseRepository


class ImportFileRepository(BaseRepository[ImportFile]):
    model = ImportFile

    def __init__(self, db: Session) -> None:
        super().__init__(db)

    def list_by_record(self, import_record_id: uuid.UUID) -> list[ImportFile]:
        stmt = (
            select(ImportFile)
            .where(ImportFile.import_record_id == import_record_id)
            .order_by(ImportFile.created_at.asc())
        )
        return list(self.db.scalars(stmt).all())
