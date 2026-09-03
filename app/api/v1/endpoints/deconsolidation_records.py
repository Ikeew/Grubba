from typing import Annotated, List
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.dependencies.auth import CurrentUser
from app.dependencies.db import DbSession
from app.models.deconsolidation_record import DeconsolidationStatus
from app.repositories.client import ClientRepository
from app.repositories.deconsolidation_record import DeconsolidationRecordRepository
from app.repositories.update_history import UpdateHistoryRepository
from app.schemas.common import PaginatedResponse
from app.schemas.deconsolidation_record import (
    DeconsolidationRecordCreate,
    DeconsolidationRecordResponse,
    DeconsolidationRecordUpdate,
)
from app.schemas.export_record import FlagRequest
from app.schemas.update_history import UpdateHistoryResponse
from app.services.deconsolidation_record import DeconsolidationRecordService
from app.services.history import HistoryService
from app.utils.pagination import PaginationParams, get_pagination

router = APIRouter(prefix="/deconsolidation-records", tags=["deconsolidation records"])

Pagination = Annotated[PaginationParams, Depends(get_pagination)]


def _service(db: DbSession) -> DeconsolidationRecordService:
    return DeconsolidationRecordService(
        DeconsolidationRecordRepository(db),
        ClientRepository(db),
        UpdateHistoryRepository(db),
    )


@router.post(
    "",
    response_model=DeconsolidationRecordResponse,
    status_code=201,
    summary="Create deconsolidation record",
)
def create_deconsolidation_record(
    payload: DeconsolidationRecordCreate, db: DbSession, current_user: CurrentUser
) -> DeconsolidationRecordResponse:
    record = _service(db).create(payload, current_user)
    return DeconsolidationRecordResponse.model_validate(record)


@router.get(
    "",
    response_model=PaginatedResponse[DeconsolidationRecordResponse],
    summary="List deconsolidation records",
)
def list_deconsolidation_records(
    db: DbSession,
    current_user: CurrentUser,
    pagination: Pagination,
    client_id: UUID | None = Query(default=None),
    status: List[DeconsolidationStatus] | None = Query(default=None),
    collaborator_id: UUID | None = Query(default=None),
    search: str | None = Query(default=None),
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    completed_from: str | None = Query(default=None),
    completed_to: str | None = Query(default=None),
    created_from: str | None = Query(default=None),
    created_to: str | None = Query(default=None),
    billing_completed: bool | None = Query(default=None),
):
    from datetime import date as Date, datetime, time as Time, timezone

    df = Date.fromisoformat(date_from) if date_from else None
    dt = Date.fromisoformat(date_to) if date_to else None
    cf = (
        datetime.combine(Date.fromisoformat(completed_from), Time.min, tzinfo=timezone.utc)
        if completed_from
        else None
    )
    ct = (
        datetime.combine(Date.fromisoformat(completed_to), Time.max, tzinfo=timezone.utc)
        if completed_to
        else None
    )
    crf = (
        datetime.combine(Date.fromisoformat(created_from), Time.min, tzinfo=timezone.utc)
        if created_from
        else None
    )
    crt = (
        datetime.combine(Date.fromisoformat(created_to), Time.max, tzinfo=timezone.utc)
        if created_to
        else None
    )
    result = _service(db).list_paginated(
        pagination,
        current_user,
        client_id=client_id,
        status=status,
        collaborator_id=collaborator_id,
        search=search,
        date_from=df,
        date_to=dt,
        completed_from=cf,
        completed_to=ct,
        created_from=crf,
        created_to=crt,
        billing_completed=billing_completed,
    )
    return PaginatedResponse[DeconsolidationRecordResponse](
        items=[DeconsolidationRecordResponse.model_validate(item) for item in result.items],
        total=result.total,
        page=result.page,
        page_size=result.page_size,
        pages=result.pages,
    )


@router.get(
    "/{record_id}",
    response_model=DeconsolidationRecordResponse,
    summary="Get deconsolidation record by ID",
)
def get_deconsolidation_record(
    record_id: UUID, db: DbSession, current_user: CurrentUser
) -> DeconsolidationRecordResponse:
    record = _service(db).get_or_404(record_id, current_user)
    return DeconsolidationRecordResponse.model_validate(record)


@router.patch(
    "/{record_id}",
    response_model=DeconsolidationRecordResponse,
    summary="Update deconsolidation record",
)
def update_deconsolidation_record(
    record_id: UUID,
    payload: DeconsolidationRecordUpdate,
    db: DbSession,
    current_user: CurrentUser,
) -> DeconsolidationRecordResponse:
    record = _service(db).update(record_id, payload, current_user)
    return DeconsolidationRecordResponse.model_validate(record)


@router.post("/{record_id}/billing", summary="Toggle billing_completed on deconsolidation record")
def toggle_deconsolidation_billing(
    record_id: UUID, db: DbSession, current_user: CurrentUser
) -> dict:
    completed = _service(db).toggle_billing(record_id, current_user)
    return {"billing_completed": completed}


@router.post("/{record_id}/flag", summary="Set/replace/remove flag on deconsolidation record")
def set_deconsolidation_flag(
    record_id: UUID,
    db: DbSession,
    current_user: CurrentUser,
    payload: FlagRequest | None = None,
) -> dict:
    color_enum = payload.color if payload else None
    color = _service(db).set_flag(
        record_id, current_user, color_enum.value if color_enum else None
    )
    return {"flag_color": color}


@router.delete("/{record_id}", status_code=204, summary="Delete deconsolidation record")
def delete_deconsolidation_record(
    record_id: UUID, db: DbSession, current_user: CurrentUser
) -> None:
    _service(db).delete(record_id, current_user)


@router.get(
    "/{record_id}/history",
    response_model=list[UpdateHistoryResponse],
    summary="Get change history for a deconsolidation record",
)
def get_deconsolidation_record_history(
    record_id: UUID, db: DbSession, _: CurrentUser
) -> list[UpdateHistoryResponse]:
    history_service = HistoryService(UpdateHistoryRepository(db))
    entries = history_service.get_deconsolidation_history(record_id)
    return [UpdateHistoryResponse.model_validate(e) for e in entries]
