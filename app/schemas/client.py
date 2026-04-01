import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr


class ClientCreate(BaseModel):
    name: str
    cnpj: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    address: str | None = None
    notes: str | None = None


class ClientUpdate(BaseModel):
    name: str | None = None
    cnpj: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    address: str | None = None
    notes: str | None = None
    is_active: bool | None = None


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
    created_at: datetime
    updated_at: datetime


class ClientSummary(BaseModel):
    """Compact client representation used inside record responses."""

    model_config = {"from_attributes": True}

    id: uuid.UUID
    name: str
    cnpj: str | None
