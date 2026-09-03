from uuid import UUID

from fastapi import APIRouter, File, UploadFile

from app.dependencies.auth import CurrentUser
from app.dependencies.db import DbSession
from app.repositories.deconsolidation_file import DeconsolidationFileRepository
from app.repositories.deconsolidation_record import DeconsolidationRecordRepository
from app.schemas.deconsolidation_file import DeconsolidationFileResponse
from app.services.deconsolidation_file import DeconsolidationFileService

router = APIRouter(prefix="/deconsolidation-records", tags=["deconsolidation files"])


def _file_service(db: DbSession) -> DeconsolidationFileService:
    return DeconsolidationFileService(
        DeconsolidationFileRepository(db), DeconsolidationRecordRepository(db)
    )


@router.post(
    "/{record_id}/files",
    response_model=DeconsolidationFileResponse,
    status_code=201,
    summary="Upload a file to a deconsolidation record",
)
async def upload_deconsolidation_file(
    record_id: UUID,
    db: DbSession,
    current_user: CurrentUser,
    file: UploadFile = File(...),
) -> DeconsolidationFileResponse:
    result = await _file_service(db).upload(record_id, file, current_user)
    return DeconsolidationFileResponse.model_validate(result)


@router.get(
    "/{record_id}/files",
    response_model=list[DeconsolidationFileResponse],
    summary="List files attached to a deconsolidation record",
)
def list_deconsolidation_files(
    record_id: UUID, db: DbSession, _: CurrentUser
) -> list[DeconsolidationFileResponse]:
    files = _file_service(db).list_by_record(record_id)
    return [DeconsolidationFileResponse.model_validate(f) for f in files]


@router.delete(
    "/files/{file_id}",
    status_code=204,
    summary="Delete a deconsolidation file",
)
def delete_deconsolidation_file(file_id: UUID, db: DbSession, _: CurrentUser) -> None:
    _file_service(db).delete(file_id)
