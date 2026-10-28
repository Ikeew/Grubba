from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response

from app.dependencies.auth import BillingUser
from app.dependencies.db import DbSession
from app.repositories.client import ClientRepository
from app.repositories.receipt import ReceiptRepository
from app.schemas.common import PaginatedResponse
from app.schemas.receipt import (
    AvailableRecordsResponse,
    ReceiptCreate,
    ReceiptListItem,
    ReceiptResponse,
)
from app.services.receipt import ReceiptService
from app.services.receipt_pdf import render_receipt_pdf
from app.utils.pagination import PaginationParams, get_pagination

router = APIRouter(prefix="/receipts", tags=["receipts"])

Pagination = Annotated[PaginationParams, Depends(get_pagination)]


def _service(db: DbSession) -> ReceiptService:
    return ReceiptService(ReceiptRepository(db), ClientRepository(db))


@router.get(
    "/available-records",
    response_model=AvailableRecordsResponse,
    summary="Fichas elegíveis do cliente para recibo, com valor padrão sugerido",
)
def available_records(client_id: UUID, db: DbSession, _: BillingUser) -> AvailableRecordsResponse:
    return _service(db).available_records(client_id)


@router.post("", response_model=ReceiptResponse, status_code=201, summary="Gerar recibo")
def create_receipt(payload: ReceiptCreate, db: DbSession, current_user: BillingUser) -> ReceiptResponse:
    receipt = _service(db).create(payload, current_user)
    return ReceiptResponse.model_validate(receipt)


@router.get("", response_model=PaginatedResponse[ReceiptListItem], summary="Listar recibos")
def list_receipts(
    db: DbSession,
    _: BillingUser,
    pagination: Pagination,
    client_id: UUID | None = Query(default=None),
    include_cancelled: bool = Query(default=True),
    search: str | None = Query(default=None, description="Número do recibo ou nome do cliente"),
):
    result = _service(db).list_paginated(
        pagination, client_id=client_id, include_cancelled=include_cancelled, search=search
    )
    return PaginatedResponse(
        items=[ReceiptListItem.model_validate(r) for r in result.items],
        total=result.total,
        page=result.page,
        page_size=result.page_size,
        pages=result.pages,
    )


@router.get("/{receipt_id}", response_model=ReceiptResponse, summary="Detalhe do recibo")
def get_receipt(receipt_id: UUID, db: DbSession, _: BillingUser) -> ReceiptResponse:
    return ReceiptResponse.model_validate(_service(db).get_or_404(receipt_id))


@router.get("/{receipt_id}/pdf", summary="PDF do recibo", response_class=Response)
def get_receipt_pdf(receipt_id: UUID, db: DbSession, _: BillingUser) -> Response:
    receipt = _service(db).get_or_404(receipt_id)
    return Response(
        content=render_receipt_pdf(receipt),
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="recibo-{receipt.number}.pdf"'},
    )


@router.delete("/{receipt_id}", status_code=204, summary="Cancelar recibo (soft delete)")
def cancel_receipt(receipt_id: UUID, db: DbSession, current_user: BillingUser) -> None:
    _service(db).cancel(receipt_id, current_user)
