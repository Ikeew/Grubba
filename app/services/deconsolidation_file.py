import uuid
from pathlib import Path
from uuid import UUID

from fastapi import UploadFile

from app.core.config import settings
from app.core.exceptions import FileTooLargeError, NotFoundError
from app.models.deconsolidation_file import DeconsolidationFile
from app.models.user import User
from app.repositories.deconsolidation_file import DeconsolidationFileRepository
from app.repositories.deconsolidation_record import DeconsolidationRecordRepository


class DeconsolidationFileService:
    def __init__(
        self,
        file_repo: DeconsolidationFileRepository,
        record_repo: DeconsolidationRecordRepository,
    ) -> None:
        self._files = file_repo
        self._records = record_repo

    async def upload(
        self, record_id: UUID, upload: UploadFile, current_user: User
    ) -> DeconsolidationFile:
        record = self._records.get_by_id(record_id)
        if not record:
            raise NotFoundError("Deconsolidation record")

        content = await upload.read()
        if len(content) > settings.max_upload_size_bytes:
            raise FileTooLargeError(settings.MAX_UPLOAD_SIZE_MB)

        upload_dir = Path(settings.UPLOAD_DIR) / "deconsolidations" / str(record_id)
        upload_dir.mkdir(parents=True, exist_ok=True)

        stored_filename = f"{uuid.uuid4().hex}_{upload.filename}"
        file_path = upload_dir / stored_filename
        file_path.write_bytes(content)

        record_file = DeconsolidationFile(
            deconsolidation_record_id=record_id,
            uploaded_by_id=current_user.id,
            original_filename=upload.filename or "unknown",
            stored_filename=stored_filename,
            file_path=str(file_path),
            file_size=len(content),
            content_type=upload.content_type,
        )
        return self._files.create(record_file)

    def list_by_record(self, record_id: UUID) -> list[DeconsolidationFile]:
        record = self._records.get_by_id(record_id)
        if not record:
            raise NotFoundError("Deconsolidation record")
        return self._files.list_by_record(record_id)

    def delete(self, file_id: UUID) -> None:
        file_obj = self._files.get_by_id(file_id)
        if not file_obj:
            raise NotFoundError("File")

        stored = Path(file_obj.file_path)
        if stored.exists():
            stored.unlink()

        self._files.delete(file_obj)
