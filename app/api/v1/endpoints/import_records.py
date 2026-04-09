from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.dependencies.auth import CurrentUser
from app.dependencies.db import DbSession
from app.models.import_record import ImportStatus
from app.models.user import UserRole
from app.repositories.client import ClientRepository
from app.repositories.import_record import ImportRecordRepository
from app.repositories.update_history import UpdateHistoryRepository
from app.schemas.common import PaginatedResponse
from app.schemas.import_record import ImportRecordCreate, ImportRecordResponse, ImportRecordUpdate
from app.schemas.update_history import UpdateHistoryResponse
from app.services.history import HistoryService
from app.services.import_record import ImportRecordService
from app.utils.pagination import PaginationParams, get_pagination

router = APIRouter(prefix="/import-records", tags=["import records"])

Pagination = Annotated[PaginationParams, Depends(get_pagination)]


def _service(db: DbSession) -> ImportRecordService:
    return ImportRecordService(
        ImportRecordRepository(db),
        ClientRepository(db),
        UpdateHistoryRepository(db),
    )


@router.post("", response_model=ImportRecordResponse, status_code=201, summary="Create import record")
def create_import_record(
    payload: ImportRecordCreate, db: DbSession, current_user: CurrentUser
) -> ImportRecordResponse:
    record = _service(db).create(payload, current_user)
    return ImportRecordResponse.model_validate(record)


@router.get("", response_model=PaginatedResponse[ImportRecordResponse], summary="List import records")
def list_import_records(
    db: DbSession,
    current_user: CurrentUser,
    pagination: Pagination,
    client_id: UUID | None = Query(default=None),
    status: ImportStatus | None = Query(default=None),
    collaborator_id: UUID | None = Query(default=None),
    search: str | None = Query(default=None),
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
):
    from datetime import date as Date
    df = Date.fromisoformat(date_from) if date_from else None
    dt = Date.fromisoformat(date_to) if date_to else None
    if current_user.role != UserRole.admin:
        collaborator_id = current_user.id
    result = _service(db).list_paginated(
        pagination,
        current_user,
        client_id=client_id,
        status=status,
        collaborator_id=collaborator_id,
        search=search,
        date_from=df,
        date_to=dt,
    )
    from app.schemas.common import PaginatedResponse as PR
    return PR(
        items=[ImportRecordResponse.model_validate(item) for item in result.items],
        total=result.total,
        page=result.page,
        page_size=result.page_size,
        pages=result.pages,
    )


@router.get("/{record_id}", response_model=ImportRecordResponse, summary="Get import record by ID")
def get_import_record(
    record_id: UUID, db: DbSession, current_user: CurrentUser
) -> ImportRecordResponse:
    record = _service(db).get_or_404(record_id, current_user)
    return ImportRecordResponse.model_validate(record)


@router.patch("/{record_id}", response_model=ImportRecordResponse, summary="Update import record")
def update_import_record(
    record_id: UUID, payload: ImportRecordUpdate, db: DbSession, current_user: CurrentUser
) -> ImportRecordResponse:
    record = _service(db).update(record_id, payload, current_user)
    return ImportRecordResponse.model_validate(record)


@router.post("/{record_id}/flag", summary="Toggle flag on import record")
def toggle_import_flag(record_id: UUID, db: DbSession, current_user: CurrentUser) -> dict:
    flagged = _service(db).toggle_flag(record_id, current_user)
    return {"flagged": flagged}


@router.delete("/{record_id}", status_code=204, summary="Delete import record")
def delete_import_record(record_id: UUID, db: DbSession, current_user: CurrentUser) -> None:
    _service(db).delete(record_id, current_user)


@router.get(
    "/{record_id}/history",
    response_model=list[UpdateHistoryResponse],
    summary="Get change history for an import record",
)
def get_import_record_history(
    record_id: UUID, db: DbSession, _: CurrentUser
) -> list[UpdateHistoryResponse]:
    history_service = HistoryService(UpdateHistoryRepository(db))
    entries = history_service.get_import_history(record_id)
    return [UpdateHistoryResponse.model_validate(e) for e in entries]
