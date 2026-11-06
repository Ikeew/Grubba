import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, EmailStr, Field

# Campos de valor padrão de serviço — só admin pode gravar
DEFAULT_VALUE_FIELDS = (
    "valor_padrao_importacao_maritimo",
    "valor_padrao_importacao_aereo",
    "valor_padrao_exportacao_maritimo",
    "valor_padrao_exportacao_aereo",
    "valor_padrao_desconsolidacao_maritimo",
    "valor_padrao_desconsolidacao_aereo",
)

Money = Decimal | None


class ClientCreate(BaseModel):
    name: str
    cnpj: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    address: str | None = None
    notes: str | None = None
    valor_padrao_importacao_maritimo: Money = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    valor_padrao_importacao_aereo: Money = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    valor_padrao_exportacao_maritimo: Money = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    valor_padrao_exportacao_aereo: Money = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    valor_padrao_desconsolidacao_maritimo: Money = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    valor_padrao_desconsolidacao_aereo: Money = Field(default=None, ge=0, max_digits=12, decimal_places=2)


class ClientUpdate(BaseModel):
    name: str | None = None
    cnpj: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    address: str | None = None
    notes: str | None = None
    is_active: bool | None = None
    # null explícito limpa o valor padrão
    valor_padrao_importacao_maritimo: Money = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    valor_padrao_importacao_aereo: Money = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    valor_padrao_exportacao_maritimo: Money = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    valor_padrao_exportacao_aereo: Money = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    valor_padrao_desconsolidacao_maritimo: Money = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    valor_padrao_desconsolidacao_aereo: Money = Field(default=None, ge=0, max_digits=12, decimal_places=2)


class ClientResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    name: str
    cnpj: str | None
    email: str | None
    phone: str | None
    address: str | None
    notes: str | None
    is_active: bool
    valor_padrao_importacao_maritimo: Decimal | None = None
    valor_padrao_importacao_aereo: Decimal | None = None
    valor_padrao_exportacao_maritimo: Decimal | None = None
    valor_padrao_exportacao_aereo: Decimal | None = None
    valor_padrao_desconsolidacao_maritimo: Decimal | None = None
    valor_padrao_desconsolidacao_aereo: Decimal | None = None
    created_at: datetime
    updated_at: datetime


class ClientSummary(BaseModel):
    """Compact client representation used inside record responses."""

    model_config = {"from_attributes": True}

    id: uuid.UUID
    name: str
    cnpj: str | None
