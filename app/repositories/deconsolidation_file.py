import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.deconsolidation_file import DeconsolidationFile
from app.repositories.base import BaseRepository


class DeconsolidationFileRepository(BaseRepository[DeconsolidationFile]):
    model = DeconsolidationFile

    def __init__(self, db: Session) -> None:
        super().__init__(db)

    def list_by_record(self, deconsolidation_record_id: uuid.UUID) -> list[DeconsolidationFile]:
        stmt = (
            select(DeconsolidationFile)
            .where(DeconsolidationFile.deconsolidation_record_id == deconsolidation_record_id)
            .order_by(DeconsolidationFile.created_at.asc())
        )
        return list(self.db.scalars(stmt).all())
