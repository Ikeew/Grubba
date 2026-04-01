from uuid import UUID

from fastapi import APIRouter, UploadFile, File

from app.dependencies.auth import CurrentUser
from app.dependencies.db import DbSession
from app.repositories.import_file import ImportFileRepository
from app.repositories.import_record import ImportRecordRepository
from app.schemas.import_file import ImportFileResponse
from app.services.file import FileService

router = APIRouter(prefix="/import-records", tags=["files"])


def _file_service(db: DbSession) -> FileService:
    return FileService(ImportFileRepository(db), ImportRecordRepository(db))


@router.post(
    "/{record_id}/files",
    response_model=ImportFileResponse,
    status_code=201,
    summary="Upload a file to an import record",
)
async def upload_file(
    record_id: UUID,
    db: DbSession,
    current_user: CurrentUser,
    file: UploadFile = File(...),
) -> ImportFileResponse:
    result = await _file_service(db).upload(record_id, file, current_user)
    return ImportFileResponse.model_validate(result)


@router.get(
    "/{record_id}/files",
    response_model=list[ImportFileResponse],
    summary="List files attached to an import record",
)
def list_files(
    record_id: UUID, db: DbSession, _: CurrentUser
) -> list[ImportFileResponse]:
    files = _file_service(db).list_by_record(record_id)
    return [ImportFileResponse.model_validate(f) for f in files]


@router.delete(
    "/files/{file_id}",
    status_code=204,
    summary="Delete a file",
)
def delete_file(file_id: UUID, db: DbSession, _: CurrentUser) -> None:
    _file_service(db).delete(file_id)
