from uuid import UUID

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.models.client import Client
from app.models.user import User, UserRole
from app.repositories.client import ClientRepository
from app.schemas.client import DEFAULT_VALUE_FIELDS, ClientCreate, ClientUpdate
from app.utils.pagination import PaginationParams, paginate


def _check_default_values_access(fields: set[str], current_user: User) -> None:
    if fields & set(DEFAULT_VALUE_FIELDS) and current_user.role not in (UserRole.admin, UserRole.manager):
        raise ForbiddenError("Somente administradores e gerentes podem definir valores padrão")


class ClientService:
    def __init__(self, client_repo: ClientRepository) -> None:
        self._clients = client_repo

    def create(self, payload: ClientCreate, current_user: User) -> Client:
        provided = {f for f in DEFAULT_VALUE_FIELDS if getattr(payload, f) is not None}
        _check_default_values_access(provided, current_user)

        if payload.cnpj and self._clients.get_by_cnpj(payload.cnpj):
            raise ConflictError(f"CNPJ '{payload.cnpj}' is already registered")

        client = Client(**payload.model_dump())
        return self._clients.create(client)

    def get_or_404(self, client_id: UUID) -> Client:
        client = self._clients.get_by_id(client_id)
        if not client:
            raise NotFoundError("Client")
        return client

    def list_paginated(self, pagination: PaginationParams, *, search: str | None = None):
        if search:
            total = self._clients.count_search(search)
            items = self._clients.search(search, offset=pagination.offset, limit=pagination.limit)
        else:
            total = self._clients.count_active()
            items = self._clients.list_active(offset=pagination.offset, limit=pagination.limit)
        return paginate(items, total, pagination)

    def update(self, client_id: UUID, payload: ClientUpdate, current_user: User) -> Client:
        _check_default_values_access(payload.model_fields_set, current_user)
        client = self.get_or_404(client_id)
        data = payload.model_dump(exclude_none=True)
        # Valores padrão aceitam null explícito para limpar
        for field in DEFAULT_VALUE_FIELDS:
            if field in payload.model_fields_set:
                data[field] = getattr(payload, field)

        if "cnpj" in data and data["cnpj"] != client.cnpj:
            existing = self._clients.get_by_cnpj(data["cnpj"])
            if existing:
                raise ConflictError(f"CNPJ '{data['cnpj']}' is already registered")

        return self._clients.update(client, data)

    def delete(self, client_id: UUID) -> None:
        client = self.get_or_404(client_id)
        self._clients.update(client, {"is_active": False})
