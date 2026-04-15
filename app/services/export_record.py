import re
from uuid import UUID

from app.core.exceptions import ConflictError, NotFoundError
from app.models.export_record import ExportRecord
from app.models.user import User, UserRole
from app.repositories.client import ClientRepository
from app.repositories.export_record import ExportRecordRepository
from app.repositories.update_history import UpdateHistoryRepository
from app.schemas.export_record import ExportRecordCreate, ExportRecordUpdate
from app.services.history import HistoryService
from app.utils.pagination import PaginationParams, paginate


def _normalize_ref(ref: str) -> str:
    return re.sub(r"[^a-zA-Z0-9]", "", ref).lower()


class ExportRecordService:
    def __init__(
        self,
        record_repo: ExportRecordRepository,
        client_repo: ClientRepository,
        history_repo: UpdateHistoryRepository,
    ) -> None:
        self._records = record_repo
        self._clients = client_repo
        self._history = HistoryService(history_repo)

    def _check_edit_access(self, _record: ExportRecord, _current_user: User) -> None:
        pass  # All authenticated users can edit any record

    def create(self, payload: ExportRecordCreate, current_user: User) -> ExportRecord:
        client = self._clients.get_by_id(payload.client_id)
        if not client:
            raise NotFoundError("Client")

        if payload.reference:
            normalized = _normalize_ref(payload.reference)
            if self._records.find_by_normalized_reference(normalized):
                raise ConflictError("Já existe uma ficha com esta referência")

        data = payload.model_dump()
        # Collaborators always own their records; admins can assign freely
        if current_user.role != UserRole.admin or not data.get("collaborator_id"):
            data["collaborator_id"] = current_user.id
        data["services"] = [s.value for s in (data.get("services") or [])]
        record = ExportRecord(**data)
        created = self._records.create(record)
        return self._records.get_with_relations(created.id)  # type: ignore[return-value]

    def get_or_404(self, record_id: UUID, current_user: User | None = None, check_edit: bool = False) -> ExportRecord:
        record = self._records.get_with_relations(record_id)
        if not record:
            raise NotFoundError("Export record")
        if check_edit and current_user is not None:
            self._check_edit_access(record, current_user)
        return record

    def list_paginated(
        self,
        pagination: PaginationParams,
        current_user: User,
        *,
        client_id: UUID | None = None,
        status=None,
        collaborator_id: UUID | None = None,
        search: str | None = None,
        date_from=None,
        date_to=None,
        ets_from=None,
        ets_to=None,
    ):
        is_admin = current_user.role == UserRole.admin
        total = self._records.count_with_filters(
            client_id=client_id, status=status, collaborator_id=collaborator_id,
            search=search, date_from=date_from, date_to=date_to,
            ets_from=ets_from, ets_to=ets_to,
        )
        items = self._records.list_with_filters(
            current_user_id=current_user.id,
            is_admin=is_admin,
            client_id=client_id,
            status=status,
            collaborator_id=collaborator_id,
            search=search,
            date_from=date_from,
            date_to=date_to,
            ets_from=ets_from,
            ets_to=ets_to,
            offset=pagination.offset,
            limit=pagination.limit,
        )
        return paginate(items, total, pagination)

    def update(self, record_id: UUID, payload: ExportRecordUpdate, current_user: User) -> ExportRecord:
        record = self.get_or_404(record_id, current_user, check_edit=True)

        # Snapshot for history diffing
        old_data = {col: getattr(record, col) for col in payload.model_fields}

        update_data = payload.model_dump(exclude_none=True)
        if "reference" in update_data and update_data["reference"]:
            normalized = _normalize_ref(update_data["reference"])
            if self._records.find_by_normalized_reference(normalized, exclude_id=record_id):
                raise ConflictError("Já existe uma ficha com esta referência")
        if "services" in update_data:
            update_data["services"] = [s.value for s in update_data["services"]]
        if "client_id" in update_data:
            if not self._clients.get_by_id(update_data["client_id"]):
                raise NotFoundError("Client")

        updated = self._records.update(record, update_data)
        new_data = {col: getattr(updated, col) for col in payload.model_fields}

        self._history.record_export_changes(
            record_id=record_id,
            old_data=old_data,
            new_data=new_data,
            changed_by_id=current_user.id,
        )
        return self._records.get_with_relations(record_id)  # type: ignore[return-value]

    def toggle_billing(self, record_id: UUID, _current_user: User) -> bool:
        record = self._records.get_with_relations(record_id)
        if not record:
            raise NotFoundError("Export record")
        new_value = not record.billing_completed
        self._records.update(record, {"billing_completed": new_value})
        return new_value

    def toggle_flag(self, record_id: UUID, current_user: User) -> bool:
        record = self._records.get_with_relations(record_id)
        if not record:
            raise NotFoundError("Export record")
        return self._records.toggle_flag(record_id, current_user.id)

    def delete(self, record_id: UUID, current_user: User) -> None:
        record = self.get_or_404(record_id, current_user, check_edit=True)
        self._records.delete(record)
