import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.note import Note
from app.repositories.base import BaseRepository


class NoteRepository(BaseRepository[Note]):
    model = Note

    def __init__(self, db: Session) -> None:
        super().__init__(db)

    def list_by_export_record(self, export_record_id: uuid.UUID) -> list[Note]:
        stmt = (
            select(Note)
            .where(Note.export_record_id == export_record_id)
            .options(joinedload(Note.author))
            .order_by(Note.created_at.asc())
        )
        return list(self.db.scalars(stmt).unique().all())

    def list_by_import_record(self, import_record_id: uuid.UUID) -> list[Note]:
        stmt = (
            select(Note)
            .where(Note.import_record_id == import_record_id)
            .options(joinedload(Note.author))
            .order_by(Note.created_at.asc())
        )
        return list(self.db.scalars(stmt).unique().all())
