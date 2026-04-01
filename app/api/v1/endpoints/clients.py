from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.dependencies.auth import CurrentUser
from app.dependencies.db import DbSession
from app.repositories.client import ClientRepository
from app.schemas.client import ClientCreate, ClientResponse, ClientUpdate
from app.schemas.common import PaginatedResponse
from app.services.client import ClientService
from app.utils.pagination import PaginationParams, get_pagination

router = APIRouter(prefix="/clients", tags=["clients"])

Pagination = Annotated[PaginationParams, Depends(get_pagination)]


def _client_service(db: DbSession) -> ClientService:
    return ClientService(ClientRepository(db))


@router.post("", response_model=ClientResponse, status_code=201, summary="Create client")
def create_client(
    payload: ClientCreate, db: DbSession, _: CurrentUser
) -> ClientResponse:
    client = _client_service(db).create(payload)
    return ClientResponse.model_validate(client)


@router.get("", response_model=PaginatedResponse[ClientResponse], summary="List clients")
def list_clients(
    db: DbSession,
    _: CurrentUser,
    pagination: Pagination,
    search: str | None = Query(default=None, description="Search by name, CNPJ or email"),
):
    return _client_service(db).list_paginated(pagination, search=search)


@router.get("/{client_id}", response_model=ClientResponse, summary="Get client by ID")
def get_client(client_id: UUID, db: DbSession, _: CurrentUser) -> ClientResponse:
    client = _client_service(db).get_or_404(client_id)
    return ClientResponse.model_validate(client)


@router.patch("/{client_id}", response_model=ClientResponse, summary="Update client")
def update_client(
    client_id: UUID, payload: ClientUpdate, db: DbSession, _: CurrentUser
) -> ClientResponse:
    client = _client_service(db).update(client_id, payload)
    return ClientResponse.model_validate(client)


@router.delete("/{client_id}", status_code=204, summary="Deactivate client (soft delete)")
def delete_client(client_id: UUID, db: DbSession, _: CurrentUser) -> None:
    _client_service(db).delete(client_id)
