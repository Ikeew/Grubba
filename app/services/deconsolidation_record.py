import re
from datetime import datetime, timezone
from uuid import UUID

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.models.deconsolidation_record import DeconsolidationRecord, DeconsolidationStatus
from app.models.user import User, UserRole
from app.repositories.client import ClientRepository
from app.repositories.deconsolidation_record import DeconsolidationRecordRepository
from app.repositories.update_history import UpdateHistoryRepository
from app.schemas.deconsolidation_record import (
    DeconsolidationRecordCreate,
    DeconsolidationRecordUpdate,
)
from app.services.history import HistoryService
from app.utils.pagination import PaginationParams, paginate


def _normalize_ref(ref: str) -> str:
    return re.sub(r"[^a-zA-Z0-9]", "", ref).lower()


class DeconsolidationRecordService:
    def __init__(
        self,
        record_repo: DeconsolidationRecordRepository,
        client_repo: ClientRepository,
        history_repo: UpdateHistoryRepository,
    ) -> None:
        self._records = record_repo
        self._clients = client_repo
        self._history = HistoryService(history_repo)

    def _check_edit_access(self, record: DeconsolidationRecord, current_user: User) -> None:
        if record.status == DeconsolidationStatus.completed and current_user.role not in (
            UserRole.admin,
            UserRole.manager,
        ):
            raise ForbiddenError("Fichas concluídas só podem ser editadas por administradores")

    def create(
        self, payload: DeconsolidationRecordCreate, current_user: User
    ) -> DeconsolidationRecord:
        client = self._clients.get_by_id(payload.client_id)
        if not client:
            raise NotFoundError("Client")

        if payload.reference:
            normalized = _normalize_ref(payload.reference)
            if self._records.find_by_normalized_reference(normalized):
                raise ConflictError("Já existe uma ficha com esta referência")

        data = payload.model_dump()
        if current_user.role != UserRole.admin or not data.get("collaborator_id"):
            data["collaborator_id"] = current_user.id
        record = DeconsolidationRecord(**data)
        created = self._records.create(record)
        full_record = self._records.get_with_relations(created.id)
        self._history.record_deconsolidation_creation(
            record_id=created.id,
            record=created,
            created_by_id=current_user.id,
        )
        return full_record  # type: ignore[return-value]

    def get_or_404(
        self, record_id: UUID, current_user: User | None = None, check_edit: bool = False
    ) -> DeconsolidationRecord:
        record = self._records.get_with_relations(record_id)
        if not record:
            raise NotFoundError("Deconsolidation record")
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
        completed_from=None,
        completed_to=None,
        created_from=None,
        created_to=None,
        billing_completed=None,
    ):
        is_admin = current_user.role == UserRole.admin
        total = self._records.count_with_filters(
            client_id=client_id, status=status, collaborator_id=collaborator_id,
            search=search, date_from=date_from, date_to=date_to,
            completed_from=completed_from, completed_to=completed_to,
            created_from=created_from, created_to=created_to,
            billing_completed=billing_completed,
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
            completed_from=completed_from,
            completed_to=completed_to,
            created_from=created_from,
            created_to=created_to,
            billing_completed=billing_completed,
            offset=pagination.offset,
            limit=pagination.limit,
        )
        return paginate(items, total, pagination)

    def update(
        self, record_id: UUID, payload: DeconsolidationRecordUpdate, current_user: User
    ) -> DeconsolidationRecord:
        record = self.get_or_404(record_id, current_user, check_edit=True)
        old_data = {col: getattr(record, col) for col in payload.model_fields}

        update_data = payload.model_dump(exclude_none=True)
        if "reference" in update_data and update_data["reference"]:
            normalized = _normalize_ref(update_data["reference"])
            if self._records.find_by_normalized_reference(normalized, exclude_id=record_id):
                raise ConflictError("Já existe uma ficha com esta referência")
        if "client_id" in update_data:
            if not self._clients.get_by_id(update_data["client_id"]):
                raise NotFoundError("Client")
        if (
            update_data.get("status") == DeconsolidationStatus.completed
            and record.completed_at is None
        ):
            update_data["completed_at"] = datetime.now(timezone.utc)

        updated = self._records.update(record, update_data)
        new_data = {col: getattr(updated, col) for col in payload.model_fields}

        self._history.record_deconsolidation_changes(
            record_id=record_id,
            old_data=old_data,
            new_data=new_data,
            changed_by_id=current_user.id,
        )
        return self._records.get_with_relations(record_id)  # type: ignore[return-value]

    def toggle_billing(self, record_id: UUID, _current_user: User) -> bool:
        record = self._records.get_with_relations(record_id)
        if not record:
            raise NotFoundError("Deconsolidation record")
        new_value = not record.billing_completed
        self._records.update(record, {"billing_completed": new_value})
        return new_value

    def set_flag(self, record_id: UUID, current_user: User, color: str | None) -> str | None:
        record = self._records.get_with_relations(record_id)
        if not record:
            raise NotFoundError("Deconsolidation record")
        return self._records.set_flag(record_id, current_user.id, color)

    def delete(self, record_id: UUID, current_user: User) -> None:
        record = self.get_or_404(record_id, current_user, check_edit=True)
        self._records.delete(record)
