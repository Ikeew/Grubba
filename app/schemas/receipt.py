import uuid
from datetime import date as Date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field

RecordTypeLiteral = Literal["import", "export", "deconsolidation"]

Money = Field(ge=0, max_digits=12, decimal_places=2)


# ---------------------------------------------------------------------------
# Montagem do recibo
# ---------------------------------------------------------------------------

class FieldOption(BaseModel):
    key: str
    label: str


class ReceiptClientInfo(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    name: str
    cnpj: str | None
    email: str | None
    phone: str | None
    address: str | None


class AvailableRecord(BaseModel):
    record_type: RecordTypeLiteral
    id: uuid.UUID
    reference: str | None
    date: Date | None
    completed_at: datetime | None
    description: str | None          # resumo curto para a lista (navio / BL / consignatário)
    suggested_amount: Decimal | None  # valor padrão do cliente para o tipo (None = em branco)


class AvailableRecordsResponse(BaseModel):
    client: ReceiptClientInfo
    records: list[AvailableRecord]
    record_field_options: dict[RecordTypeLiteral, list[FieldOption]]
    client_field_options: list[FieldOption]
    default_record_fields: dict[RecordTypeLiteral, list[str]]
    default_client_fields: list[str]


class ReceiptItemCreate(BaseModel):
    record_type: RecordTypeLiteral
    record_id: uuid.UUID
    # Opcional no formato para devolver mensagem amigável ("Informe o valor da ficha X")
    amount: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)


class ReceiptExtraCostCreate(BaseModel):
    description: str = Field(min_length=1, max_length=500)
    amount: Decimal = Money


class ReceiptCreate(BaseModel):
    client_id: uuid.UUID
    issue_date: Date | None = None  # padrão: hoje
    client_cnpj: str | None = Field(default=None, max_length=18)
    client_email: str | None = Field(default=None, max_length=255)
    client_fields: list[str] = Field(default_factory=list)
    record_fields: dict[RecordTypeLiteral, list[str]] = Field(default_factory=dict)
    items: list[ReceiptItemCreate] = Field(min_length=1)
    extra_costs: list[ReceiptExtraCostCreate] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Respostas
# ---------------------------------------------------------------------------

class SnapshotField(BaseModel):
    key: str
    label: str
    value: str


class ReceiptSummary(BaseModel):
    """Recibo ativo resumido, embutido nas respostas das fichas."""

    model_config = {"from_attributes": True}

    id: uuid.UUID
    number: str


class ReceiptItemResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    record_type: RecordTypeLiteral
    record_id: uuid.UUID | None
    reference: str | None
    amount: Decimal
    snapshot: list[SnapshotField]


class ReceiptExtraCostResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    description: str
    amount: Decimal


class UserName(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    full_name: str


class ReceiptListItem(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    number: str
    client_id: uuid.UUID
    client_name: str
    issue_date: Date
    total: Decimal
    items_count: int
    is_cancelled: bool
    created_by: UserName | None
    created_at: datetime


class ReceiptResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    number: str
    client_id: uuid.UUID
    issue_date: Date
    subtotal: Decimal
    extras_total: Decimal
    total: Decimal
    client_name: str
    client_cnpj: str | None
    client_email: str | None
    client_fields: list[str]
    client_snapshot: list[SnapshotField]
    record_fields: dict[str, list[str]]
    items: list[ReceiptItemResponse]
    extra_costs: list[ReceiptExtraCostResponse]
    is_cancelled: bool
    cancelled_at: datetime | None
    created_by: UserName | None
    cancelled_by: UserName | None
    created_at: datetime
