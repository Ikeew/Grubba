from uuid import UUID

from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.import_record import ImportRecord
from app.models.user import User, UserRole
from app.repositories.client import ClientRepository
from app.repositories.import_record import ImportRecordRepository
from app.repositories.update_history import UpdateHistoryRepository
from app.schemas.import_record import ImportRecordCreate, ImportRecordUpdate
from app.services.history import HistoryService
from app.utils.pagination import PaginationParams, paginate


class ImportRecordService:
    def __init__(
        self,
        record_repo: ImportRecordRepository,
        client_repo: ClientRepository,
        history_repo: UpdateHistoryRepository,
    ) -> None:
        self._records = record_repo
        self._clients = client_repo
        self._history = HistoryService(history_repo)

    def _check_access(self, record: ImportRecord, current_user: User) -> None:
        if current_user.role != UserRole.admin and record.collaborator_id != current_user.id:
            raise ForbiddenError("Você não tem permissão para acessar esta ficha")

    def create(self, payload: ImportRecordCreate, current_user: User) -> ImportRecord:
        client = self._clients.get_by_id(payload.client_id)
        if not client:
            raise NotFoundError("Client")

        data = payload.model_dump()
        # Collaborators always own their records; admins can assign freely
        if current_user.role != UserRole.admin or not data.get("collaborator_id"):
            data["collaborator_id"] = current_user.id
        record = ImportRecord(**data)
        created = self._records.create(record)
        return self._records.get_with_relations(created.id)  # type: ignore[return-value]

    def get_or_404(self, record_id: UUID, current_user: User | None = None) -> ImportRecord:
        record = self._records.get_with_relations(record_id)
        if not record:
            raise NotFoundError("Import record")
        if current_user is not None:
            self._check_access(record, current_user)
        return record

    def list_paginated(
        self,
        pagination: PaginationParams,
        *,
        client_id: UUID | None = None,
        status=None,
        collaborator_id: UUID | None = None,
        search: str | None = None,
        date_from=None,
        date_to=None,
    ):
        total = self._records.count_with_filters(
            client_id=client_id, status=status, collaborator_id=collaborator_id,
            search=search, date_from=date_from, date_to=date_to,
        )
        items = self._records.list_with_filters(
            client_id=client_id,
            status=status,
            collaborator_id=collaborator_id,
            search=search,
            date_from=date_from,
            date_to=date_to,
            offset=pagination.offset,
            limit=pagination.limit,
        )
        return paginate(items, total, pagination)

    def update(self, record_id: UUID, payload: ImportRecordUpdate, current_user: User) -> ImportRecord:
        record = self.get_or_404(record_id, current_user)
        old_data = {col: getattr(record, col) for col in payload.model_fields}

        update_data = payload.model_dump(exclude_none=True)
        if "client_id" in update_data:
            if not self._clients.get_by_id(update_data["client_id"]):
                raise NotFoundError("Client")

        updated = self._records.update(record, update_data)
        new_data = {col: getattr(updated, col) for col in payload.model_fields}

        self._history.record_import_changes(
            record_id=record_id,
            old_data=old_data,
            new_data=new_data,
            changed_by_id=current_user.id,
        )
        return self._records.get_with_relations(record_id)  # type: ignore[return-value]

    def delete(self, record_id: UUID, current_user: User) -> None:
        record = self.get_or_404(record_id, current_user)
        self._records.delete(record)
