from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.dependencies.auth import CurrentUser
from app.dependencies.db import DbSession
from app.models.export_record import ExportStatus
from app.models.user import UserRole
from app.repositories.client import ClientRepository
from app.repositories.export_record import ExportRecordRepository
from app.repositories.update_history import UpdateHistoryRepository
from app.schemas.common import PaginatedResponse
from app.schemas.export_record import ExportRecordCreate, ExportRecordResponse, ExportRecordUpdate
from app.schemas.update_history import UpdateHistoryResponse
from app.services.export_record import ExportRecordService
from app.services.history import HistoryService
from app.utils.pagination import PaginationParams, get_pagination

router = APIRouter(prefix="/export-records", tags=["export records"])

Pagination = Annotated[PaginationParams, Depends(get_pagination)]


def _service(db: DbSession) -> ExportRecordService:
    return ExportRecordService(
        ExportRecordRepository(db),
        ClientRepository(db),
        UpdateHistoryRepository(db),
    )


@router.post("", response_model=ExportRecordResponse, status_code=201, summary="Create export record")
def create_export_record(
    payload: ExportRecordCreate, db: DbSession, current_user: CurrentUser
) -> ExportRecordResponse:
    record = _service(db).create(payload, current_user)
    return ExportRecordResponse.model_validate(record)


@router.get("", response_model=PaginatedResponse[ExportRecordResponse], summary="List export records")
def list_export_records(
    db: DbSession,
    current_user: CurrentUser,
    pagination: Pagination,
    client_id: UUID | None = Query(default=None),
    status: ExportStatus | None = Query(default=None),
    collaborator_id: UUID | None = Query(default=None),
    search: str | None = Query(default=None),
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    etb_from: str | None = Query(default=None),
    etb_to: str | None = Query(default=None),
):
    from datetime import date as Date
    df = Date.fromisoformat(date_from) if date_from else None
    dt = Date.fromisoformat(date_to) if date_to else None
    ef = Date.fromisoformat(etb_from) if etb_from else None
    et = Date.fromisoformat(etb_to) if etb_to else None
    # Collaborators can only see their own records
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
        etb_from=ef,
        etb_to=et,
    )
    from app.schemas.common import PaginatedResponse as PR
    return PR(
        items=[ExportRecordResponse.model_validate(item) for item in result.items],
        total=result.total,
        page=result.page,
        page_size=result.page_size,
        pages=result.pages,
    )


@router.get("/{record_id}", response_model=ExportRecordResponse, summary="Get export record by ID")
def get_export_record(
    record_id: UUID, db: DbSession, current_user: CurrentUser
) -> ExportRecordResponse:
    record = _service(db).get_or_404(record_id, current_user)
    return ExportRecordResponse.model_validate(record)


@router.patch("/{record_id}", response_model=ExportRecordResponse, summary="Update export record")
def update_export_record(
    record_id: UUID, payload: ExportRecordUpdate, db: DbSession, current_user: CurrentUser
) -> ExportRecordResponse:
    record = _service(db).update(record_id, payload, current_user)
    return ExportRecordResponse.model_validate(record)


@router.post("/{record_id}/flag", summary="Toggle flag on export record")
def toggle_export_flag(record_id: UUID, db: DbSession, current_user: CurrentUser) -> dict:
    flagged = _service(db).toggle_flag(record_id, current_user)
    return {"flagged": flagged}


@router.delete("/{record_id}", status_code=204, summary="Delete export record")
def delete_export_record(record_id: UUID, db: DbSession, current_user: CurrentUser) -> None:
    _service(db).delete(record_id, current_user)


@router.get(
    "/{record_id}/history",
    response_model=list[UpdateHistoryResponse],
    summary="Get change history for an export record",
)
def get_export_record_history(
    record_id: UUID, db: DbSession, _: CurrentUser
) -> list[UpdateHistoryResponse]:
    history_service = HistoryService(UpdateHistoryRepository(db))
    entries = history_service.get_export_history(record_id)
    return [UpdateHistoryResponse.model_validate(e) for e in entries]
