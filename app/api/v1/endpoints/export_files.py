from uuid import UUID

from fastapi import APIRouter, File, UploadFile

from app.dependencies.auth import CurrentUser
from app.dependencies.db import DbSession
from app.repositories.export_file import ExportFileRepository
from app.repositories.export_record import ExportRecordRepository
from app.repositories.client import ClientRepository
from app.repositories.update_history import UpdateHistoryRepository
from app.schemas.export_file import ExportFileResponse
from app.services.export_file import ExportFileService

router = APIRouter(prefix="/export-records", tags=["export files"])


def _file_service(db: DbSession) -> ExportFileService:
    return ExportFileService(ExportFileRepository(db), ExportRecordRepository(db))


@router.post(
    "/{record_id}/files",
    response_model=ExportFileResponse,
    status_code=201,
    summary="Upload a file to an export record",
)
async def upload_export_file(
    record_id: UUID,
    db: DbSession,
    current_user: CurrentUser,
    file: UploadFile = File(...),
) -> ExportFileResponse:
    result = await _file_service(db).upload(record_id, file, current_user)
    return ExportFileResponse.model_validate(result)


@router.get(
    "/{record_id}/files",
    response_model=list[ExportFileResponse],
    summary="List files attached to an export record",
)
def list_export_files(
    record_id: UUID, db: DbSession, _: CurrentUser
) -> list[ExportFileResponse]:
    files = _file_service(db).list_by_record(record_id)
    return [ExportFileResponse.model_validate(f) for f in files]


@router.delete(
    "/files/{file_id}",
    status_code=204,
    summary="Delete an export file",
)
def delete_export_file(file_id: UUID, db: DbSession, _: CurrentUser) -> None:
    _file_service(db).delete(file_id)
