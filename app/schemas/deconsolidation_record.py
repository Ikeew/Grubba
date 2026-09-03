import uuid
from datetime import date as Date, datetime

from pydantic import BaseModel, Field

from app.models.deconsolidation_record import DeconsolidationModality, DeconsolidationStatus
from app.schemas.client import ClientSummary
from app.schemas.export_record import FlagInfo
from app.schemas.user import UserSummary


class DeconsolidationRecordCreate(BaseModel):
    client_id: uuid.UUID
    reference: str | None = None
    date: Date | None = None
    status: DeconsolidationStatus = DeconsolidationStatus.aguardando_chegada_documento
    modality: DeconsolidationModality | None = None
    consignee: str | None = None

    ce_mercante: str | None = None
    master_bl: str | None = None
    house_bl: str | None = None

    agency: str | None = None
    shipping_company: str | None = None

    collaborator_id: uuid.UUID | None = None
    observations: str | None = None


class DeconsolidationRecordUpdate(BaseModel):
    client_id: uuid.UUID | None = None
    reference: str | None = None
    date: Date | None = None
    status: DeconsolidationStatus | None = None
    modality: DeconsolidationModality | None = None
    consignee: str | None = None

    ce_mercante: str | None = None
    master_bl: str | None = None
    house_bl: str | None = None

    agency: str | None = None
    shipping_company: str | None = None

    collaborator_id: uuid.UUID | None = None
    observations: str | None = None


class DeconsolidationRecordResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    reference: str | None
    date: Date | None
    status: DeconsolidationStatus
    modality: DeconsolidationModality | None
    consignee: str | None

    ce_mercante: str | None
    master_bl: str | None
    house_bl: str | None

    agency: str | None
    shipping_company: str | None

    observations: str | None
    completed_at: datetime | None
    billing_completed: bool

    client: ClientSummary
    collaborator: UserSummary | None
    flags: list[FlagInfo] = Field(default_factory=list)

    created_at: datetime
    updated_at: datetime

    @classmethod
    def model_validate(cls, obj, **kwargs):
        instance = super().model_validate(obj, **kwargs)
        if hasattr(obj, "flags"):
            instance.flags = [
                FlagInfo(user_id=f.user_id, color=f.color) for f in obj.flags
            ]
        return instance
