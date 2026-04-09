import uuid
from pathlib import Path
from uuid import UUID

from fastapi import UploadFile

from app.core.config import settings
from app.core.exceptions import FileTooLargeError, NotFoundError
from app.models.export_file import ExportFile
from app.models.user import User
from app.repositories.export_file import ExportFileRepository
from app.repositories.export_record import ExportRecordRepository


class ExportFileService:
    def __init__(
        self,
        file_repo: ExportFileRepository,
        record_repo: ExportRecordRepository,
    ) -> None:
        self._files = file_repo
        self._records = record_repo

    async def upload(
        self, export_record_id: UUID, upload: UploadFile, current_user: User
    ) -> ExportFile:
        record = self._records.get_by_id(export_record_id)
        if not record:
            raise NotFoundError("Export record")

        content = await upload.read()
        if len(content) > settings.max_upload_size_bytes:
            raise FileTooLargeError(settings.MAX_UPLOAD_SIZE_MB)

        upload_dir = Path(settings.UPLOAD_DIR) / "exports" / str(export_record_id)
        upload_dir.mkdir(parents=True, exist_ok=True)

        stored_filename = f"{uuid.uuid4().hex}_{upload.filename}"
        file_path = upload_dir / stored_filename
        file_path.write_bytes(content)

        export_file = ExportFile(
            export_record_id=export_record_id,
            uploaded_by_id=current_user.id,
            original_filename=upload.filename or "unknown",
            stored_filename=stored_filename,
            file_path=str(file_path),
            file_size=len(content),
            content_type=upload.content_type,
        )
        return self._files.create(export_file)

    def list_by_record(self, export_record_id: UUID) -> list[ExportFile]:
        record = self._records.get_by_id(export_record_id)
        if not record:
            raise NotFoundError("Export record")
        return self._files.list_by_record(export_record_id)

    def delete(self, file_id: UUID) -> None:
        file_obj = self._files.get_by_id(file_id)
        if not file_obj:
            raise NotFoundError("File")

        stored = Path(file_obj.file_path)
        if stored.exists():
            stored.unlink()

        self._files.delete(file_obj)
