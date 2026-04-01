from uuid import UUID

from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.note import Note
from app.models.user import User, UserRole
from app.repositories.note import NoteRepository
from app.repositories.export_record import ExportRecordRepository
from app.repositories.import_record import ImportRecordRepository
from app.schemas.note import NoteCreate, NoteUpdate


class NoteService:
    def __init__(
        self,
        note_repo: NoteRepository,
        export_repo: ExportRecordRepository,
        import_repo: ImportRecordRepository,
    ) -> None:
        self._notes = note_repo
        self._exports = export_repo
        self._imports = import_repo

    def create(self, payload: NoteCreate, current_user: User) -> Note:
        if payload.export_record_id:
            if not self._exports.get_by_id(payload.export_record_id):
                raise NotFoundError("Export record")
        else:
            if not self._imports.get_by_id(payload.import_record_id):  # type: ignore[arg-type]
                raise NotFoundError("Import record")

        note = Note(
            content=payload.content,
            export_record_id=payload.export_record_id,
            import_record_id=payload.import_record_id,
            author_id=current_user.id,
        )
        return self._notes.create(note)

    def list_by_export_record(self, export_record_id: UUID) -> list[Note]:
        if not self._exports.get_by_id(export_record_id):
            raise NotFoundError("Export record")
        return self._notes.list_by_export_record(export_record_id)

    def list_by_import_record(self, import_record_id: UUID) -> list[Note]:
        if not self._imports.get_by_id(import_record_id):
            raise NotFoundError("Import record")
        return self._notes.list_by_import_record(import_record_id)

    def update(self, note_id: UUID, payload: NoteUpdate, current_user: User) -> Note:
        note = self._notes.get_by_id(note_id)
        if not note:
            raise NotFoundError("Note")
        if note.author_id != current_user.id and current_user.role != UserRole.admin:
            raise ForbiddenError("You can only edit your own notes")
        return self._notes.update(note, {"content": payload.content})

    def delete(self, note_id: UUID, current_user: User) -> None:
        note = self._notes.get_by_id(note_id)
        if not note:
            raise NotFoundError("Note")
        if note.author_id != current_user.id and current_user.role != UserRole.admin:
            raise ForbiddenError("You can only delete your own notes")
        self._notes.delete(note)
