import uuid
from datetime import date as Date, datetime

from pydantic import BaseModel, Field, field_validator

from app.models.export_record import ExportService, ExportStatus, MapType
from app.schemas.client import ClientSummary
from app.schemas.user import UserSummary


class ExportRecordCreate(BaseModel):
    client_id: uuid.UUID
    reference: str
    date: Date
    status: ExportStatus = ExportStatus.in_progress

    cargo_type: str | None = None

    lpco: str | None = None
    vessel: str | None = None
    booking: str | None = None
    port_id: uuid.UUID | None = None
    due_25br: str | None = None
    eta: Date | None = None
    ddl_carga: Date | None = None
    shipping_company: str | None = None
    etb: Date | None = None
    ets: Date | None = None
    et5: Date | None = None

    services: list[ExportService] = Field(default_factory=list)
    map_type: MapType | None = None
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
    status: ExportStatus | None = None

    cargo_type: str | None = None

    lpco: str | None = None
    vessel: str | None = None
    booking: str | None = None
    port_id: uuid.UUID | None = None
    due_25br: str | None = None
    eta: Date | None = None
    ddl_carga: Date | None = None
    shipping_company: str | None = None
    etb: Date | None = None
    ets: Date | None = None
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


class PortSummary(BaseModel):
    model_config = {"from_attributes": True}
    id: uuid.UUID
    name: str


class ExportRecordResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    reference: str | None
    date: Date | None
    status: ExportStatus

    cargo_type: str | None

    lpco: str | None
    vessel: str | None
    booking: str | None
    port_id: uuid.UUID | None
    port: PortSummary | None
    due_25br: str | None
    eta: Date | None
    ddl_carga: Date | None
    shipping_company: str | None
    etb: Date | None
    ets: Date | None
    et5: Date | None
    services: list[str]

    map_type: MapType | None
    selected_unit: str | None
    new_seal: str | None
    inspection_date: Date | None
    comex_released_date: Date | None

    finalized_at: datetime | None
    observations: str | None
    billing_completed: bool

    client: ClientSummary
    collaborator: UserSummary | None
    flagged_by_ids: list[uuid.UUID] = Field(default_factory=list)

    created_at: datetime
    updated_at: datetime

    @classmethod
    def model_validate(cls, obj, **kwargs):
        instance = super().model_validate(obj, **kwargs)
        if hasattr(obj, "flagged_by"):
            instance.flagged_by_ids = [u.id for u in obj.flagged_by]
        return instance
