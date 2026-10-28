from datetime import date, datetime, timezone
from decimal import Decimal
from types import SimpleNamespace
from typing import Any
from uuid import UUID

from app.core.exceptions import BusinessRuleError, ConflictError, NotFoundError
from app.models.client import Client
from app.models.receipt import Receipt, ReceiptExtraCost, ReceiptItem
from app.models.user import User
from app.repositories.client import ClientRepository
from app.repositories.receipt import RECORD_MODELS, ReceiptRepository
from app.schemas.receipt import (
    AvailableRecord,
    AvailableRecordsResponse,
    FieldOption,
    ReceiptClientInfo,
    ReceiptCreate,
)
from app.services import receipt_fields as rf
from app.utils.formatting import BRT, to_money
from app.utils.pagination import PaginationParams, paginate

RECORD_TYPE_LABELS = {
    "import": "importação",
    "export": "exportação",
    "deconsolidation": "desconsolidação",
}

# Valor padrão do cliente usado para cada tipo de ficha
_DEFAULT_VALUE_FIELD = {
    "import": "valor_padrao_importacao",
    "export": "valor_padrao_exportacao",
    "deconsolidation": "valor_padrao_desconsolidacao",
}


def format_receipt_number(sequence: int, issue_date: date) -> str:
    """GT + mês (2 dígitos) + sequência global (mín. 3 dígitos) + '-' + ano (2 dígitos)."""
    return f"GT{issue_date:%m}{sequence:03d}-{issue_date:%y}"


def _record_description(record_type: str, record: Any) -> str | None:
    if record_type == "import":
        parts = [record.awb_bl, record.di_duimp_dta, record.vessel]
    elif record_type == "export":
        parts = [record.vessel, record.booking, record.due_25br]
    else:
        parts = [record.consignee, record.master_bl, record.house_bl]
    return " · ".join(p for p in parts if p) or None


def _record_label(record: Any) -> str:
    return record.reference or str(record.id)[:8]


class ReceiptService:
    def __init__(self, receipt_repo: ReceiptRepository, client_repo: ClientRepository) -> None:
        self._receipts = receipt_repo
        self._clients = client_repo

    # --- Montagem -----------------------------------------------------------

    def _get_client_or_404(self, client_id: UUID) -> Client:
        client = self._clients.get_by_id(client_id)
        if not client:
            raise NotFoundError("Client")
        return client

    def available_records(self, client_id: UUID) -> AvailableRecordsResponse:
        client = self._get_client_or_404(client_id)

        records: list[AvailableRecord] = []
        for record_type in RECORD_MODELS:
            suggested = getattr(client, _DEFAULT_VALUE_FIELD[record_type])
            for record in self._receipts.list_eligible_records(record_type, client_id):
                records.append(
                    AvailableRecord(
                        record_type=record_type,
                        id=record.id,
                        reference=record.reference,
                        date=record.date,
                        completed_at=record.completed_at,
                        description=_record_description(record_type, record),
                        suggested_amount=suggested,
                    )
                )

        return AvailableRecordsResponse(
            client=ReceiptClientInfo.model_validate(client),
            records=records,
            record_field_options={
                t: [FieldOption(key=f.key, label=f.label) for f in fields]
                for t, fields in rf.RECORD_FIELDS.items()
            },
            client_field_options=[FieldOption(key=f.key, label=f.label) for f in rf.CLIENT_FIELDS],
            default_record_fields=rf.DEFAULT_RECORD_FIELDS,
            default_client_fields=rf.DEFAULT_CLIENT_FIELDS,
        )

    # --- Criação ------------------------------------------------------------

    def create(self, payload: ReceiptCreate, current_user: User) -> Receipt:
        client = self._get_client_or_404(payload.client_id)
        self._validate_field_selection(payload)

        # Fichas duplicadas no mesmo payload
        keys = [(i.record_type, i.record_id) for i in payload.items]
        if len(keys) != len(set(keys)):
            raise BusinessRuleError("A mesma ficha foi incluída mais de uma vez no recibo")

        # Carrega e valida as fichas (por tipo, preservando a ordem do payload)
        loaded: dict[tuple[str, UUID], Any] = {}
        for record_type in RECORD_MODELS:
            ids = [i.record_id for i in payload.items if i.record_type == record_type]
            for record in self._receipts.get_records(record_type, ids):
                loaded[(record_type, record.id)] = record

        items: list[ReceiptItem] = []
        for position, item in enumerate(payload.items):
            record = loaded.get((item.record_type, item.record_id))
            type_label = RECORD_TYPE_LABELS[item.record_type]
            if record is None:
                raise NotFoundError(f"Ficha de {type_label}")
            label = _record_label(record)
            if record.client_id != client.id:
                raise BusinessRuleError(f"A ficha {label} não pertence ao cliente {client.name}")
            _, completed_status = RECORD_MODELS[item.record_type]
            if record.status != completed_status or record.billing_completed:
                raise BusinessRuleError(f"A ficha {label} não está pendente de faturamento")
            if record.receipt_id is not None:
                raise ConflictError(f"A ficha {label} já está em outro recibo")
            if item.amount is None:
                raise BusinessRuleError(f"Informe o valor da ficha {label}")

            selected = payload.record_fields.get(item.record_type, [])
            items.append(
                ReceiptItem(
                    record_type=item.record_type,
                    import_record_id=record.id if item.record_type == "import" else None,
                    export_record_id=record.id if item.record_type == "export" else None,
                    deconsolidation_record_id=record.id if item.record_type == "deconsolidation" else None,
                    reference=record.reference,
                    amount=to_money(item.amount),
                    snapshot=rf.build_snapshot(record, rf.RECORD_FIELDS[item.record_type], selected),
                    position=position,
                )
            )

        extra_costs = [
            ReceiptExtraCost(description=e.description.strip(), amount=to_money(e.amount), position=pos)
            for pos, e in enumerate(payload.extra_costs)
        ]

        # Total sempre recalculado no servidor
        subtotal = to_money(sum((i.amount for i in items), Decimal("0")))
        extras_total = to_money(sum((e.amount for e in extra_costs), Decimal("0")))
        total = to_money(subtotal + extras_total)

        # CNPJ / e-mail editáveis só para este recibo (vazio = sem valor)
        cnpj = (payload.client_cnpj or "").strip() or None
        email = (payload.client_email or "").strip() or None
        client_view = SimpleNamespace(
            name=client.name, cnpj=cnpj, email=email, phone=client.phone, address=client.address
        )

        issue_date = payload.issue_date or datetime.now(BRT).date()
        sequence = self._receipts.next_sequence()

        receipt = Receipt(
            sequence=sequence,
            number=format_receipt_number(sequence, issue_date),
            client_id=client.id,
            issue_date=issue_date,
            subtotal=subtotal,
            extras_total=extras_total,
            total=total,
            client_name=client.name,
            client_cnpj=cnpj,
            client_email=email,
            client_fields=payload.client_fields,
            client_snapshot=rf.build_snapshot(client_view, rf.CLIENT_FIELDS, payload.client_fields),
            record_fields={t: payload.record_fields.get(t, []) for t in RECORD_MODELS},
            created_by_id=current_user.id,
            items=items,
            extra_costs=extra_costs,
        )
        receipt = self._receipts.create(receipt)

        # Marca as fichas como "recibo gerado"
        self._receipts.mark_records(list(loaded.values()), receipt.id)

        return self.get_or_404(receipt.id)

    @staticmethod
    def _validate_field_selection(payload: ReceiptCreate) -> None:
        invalid_client = set(payload.client_fields) - rf.valid_keys(rf.CLIENT_FIELDS)
        if invalid_client:
            raise BusinessRuleError(f"Campos de cliente inválidos: {', '.join(sorted(invalid_client))}")
        for record_type, selected in payload.record_fields.items():
            invalid = set(selected) - rf.valid_keys(rf.RECORD_FIELDS[record_type])
            if invalid:
                raise BusinessRuleError(
                    f"Campos inválidos para {RECORD_TYPE_LABELS[record_type]}: {', '.join(sorted(invalid))}"
                )

    # --- Consulta / cancelamento -------------------------------------------

    def get_or_404(self, receipt_id: UUID) -> Receipt:
        receipt = self._receipts.get_with_relations(receipt_id)
        if not receipt:
            raise NotFoundError("Recibo")
        return receipt

    def list_paginated(
        self,
        pagination: PaginationParams,
        *,
        client_id: UUID | None = None,
        include_cancelled: bool = True,
        search: str | None = None,
    ):
        filters = {"client_id": client_id, "include_cancelled": include_cancelled, "search": search}
        total = self._receipts.count_filtered(**filters)
        items = self._receipts.list_filtered(**filters, offset=pagination.offset, limit=pagination.limit)
        return paginate(items, total, pagination)

    def cancel(self, receipt_id: UUID, current_user: User) -> None:
        receipt = self.get_or_404(receipt_id)
        if receipt.is_cancelled:
            raise ConflictError("Este recibo já foi cancelado")
        self._receipts.update(
            receipt,
            {
                "is_cancelled": True,
                "cancelled_at": datetime.now(timezone.utc),
                "cancelled_by_id": current_user.id,
            },
        )
        self._receipts.release_records(receipt.id)
