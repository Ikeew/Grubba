import uuid
from datetime import datetime

from pydantic import BaseModel


class PortCreate(BaseModel):
    name: str


class PortUpdate(BaseModel):
    name: str | None = None


class PortResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    name: str
    created_at: datetime
    updated_at: datetime
