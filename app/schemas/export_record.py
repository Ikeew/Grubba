import uuid
from datetime import date as Date, datetime

from pydantic import BaseModel, Field, field_validator

from app.models.export_record import ExportService, MapType, RecordStatus
from app.schemas.client import ClientSummary
from app.schemas.user import UserSummary


class ExportRecordCreate(BaseModel):
    client_id: uuid.UUID
    reference: str
    date: Date
    status: RecordStatus = RecordStatus.draft

    lpco: str | None = None
    vessel: str | None = None
    booking: str | None = None
    port: str
    due_25br: str | None = None
    eta: Date | None = None
    ddl_carga: Date | None = None
    shipping_company: str | None = None
    etb: Date | None = None
    et5: Date | None = None

    services: list[ExportService] = Field(min_length=1)
    map_type: MapType
    selected_unit: str | None = None
    new_seal: str | None = None
    inspection_date: Date | None = None
    comex_released_date: Date | None = None

    collaborator_id: uuid.UUID | None = None
    finalized_at: datetime | None = None
    observations: str | None = None

    @field_validator("services", mode="before")
    @classmethod
    def coerce_services(cls, value: list) -> list:
        return [ExportService(v) if isinstance(v, str) else v for v in value]


class ExportRecordUpdate(BaseModel):
    client_id: uuid.UUID | None = None
    reference: str | None = None
    date: Date | None = None
    status: RecordStatus | None = None

    lpco: str | None = None
    vessel: str | None = None
    booking: str | None = None
    port: str | None = None
    due_25br: str | None = None
    eta: Date | None = None
    ddl_carga: Date | None = None
    shipping_company: str | None = None
    etb: Date | None = None
    et5: Date | None = None

    services: list[ExportService] | None = None
    map_type: MapType | None = None
    selected_unit: str | None = None
    new_seal: str | None = None
    inspection_date: Date | None = None
    comex_released_date: Date | None = None

    collaborator_id: uuid.UUID | None = None
    finalized_at: datetime | None = None
    observations: str | None = None


class ExportRecordResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    reference: str | None
    date: Date | None
    status: RecordStatus

    lpco: str | None
    vessel: str | None
    booking: str | None
    port: str | None
    due_25br: str | None
    eta: Date | None
    ddl_carga: Date | None
    shipping_company: str | None
    etb: Date | None
    et5: Date | None
    services: list[str]

    map_type: MapType | None
    selected_unit: str | None
    new_seal: str | None
    inspection_date: Date | None
    comex_released_date: Date | None

    finalized_at: datetime | None
    observations: str | None

    client: ClientSummary
    collaborator: UserSummary | None

    created_at: datetime
    updated_at: datetime
