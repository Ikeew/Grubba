import uuid
from datetime import date as Date, datetime

from pydantic import BaseModel, Field

from app.models.export_record import MapType
from app.models.import_record import ImportStatus, Modality
from app.schemas.client import ClientSummary
from app.schemas.export_record import PortSummary
from app.schemas.user import UserSummary


class ImportRecordCreate(BaseModel):
    client_id: uuid.UUID
    reference: str | None = None
    date: Date | None = None
    status: ImportStatus = ImportStatus.in_progress
    modality: Modality | None = None

    cargo_type: str | None = None

    importer: str | None = None
    ce_mercante: str | None = None
    awb_bl: str | None = None
    di_duimp_dta: str | None = None
    numero_li: str | None = None
    dta: str | None = None
    dtc: str | None = None

    shipping_company: str | None = None
    vessel: str | None = None
    port_id: uuid.UUID | None = None
    eta: Date | None = None
    etb: Date | None = None
    containers: str | None = None
    carrier: str | None = None
    local_ioa: str | None = None

    lpco_packaging: str | None = None
    lpco_number: str | None = None
    map_type: MapType | None = None
    map_packaging_released: bool = False
    selected_unit: str | None = None

    inspection_date: Date | None = None
    cargo_presence_date: Date | None = None
    released_at: Date | None = None
    comex_informed_date: Date | None = None
    comex_released: bool = False
    guide_sent: bool = False
    finalized_at: datetime | None = None

    collaborator_id: uuid.UUID | None = None
    observations: str | None = None


class ImportRecordUpdate(BaseModel):
    client_id: uuid.UUID | None = None
    reference: str | None = None
    date: Date | None = None
    status: ImportStatus | None = None
    modality: Modality | None = None

    cargo_type: str | None = None

    importer: str | None = None
    ce_mercante: str | None = None
    awb_bl: str | None = None
    di_duimp_dta: str | None = None
    numero_li: str | None = None
    dta: str | None = None
    dtc: str | None = None

    shipping_company: str | None = None
    vessel: str | None = None
    port_id: uuid.UUID | None = None
    eta: Date | None = None
    etb: Date | None = None
    containers: str | None = None
    carrier: str | None = None
    local_ioa: str | None = None

    lpco_packaging: str | None = None
    lpco_number: str | None = None
    map_type: MapType | None = None
    map_packaging_released: bool | None = None
    selected_unit: str | None = None

    inspection_date: Date | None = None
    cargo_presence_date: Date | None = None
    released_at: Date | None = None
    comex_informed_date: Date | None = None
    comex_released: bool | None = None
    guide_sent: bool | None = None
    finalized_at: datetime | None = None

    collaborator_id: uuid.UUID | None = None
    observations: str | None = None


class ImportRecordResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    reference: str | None
    date: Date | None
    status: ImportStatus
    modality: Modality | None

    cargo_type: str | None

    importer: str | None
    ce_mercante: str | None
    awb_bl: str | None
    di_duimp_dta: str | None
    numero_li: str | None
    dta: str | None
    dtc: str | None

    shipping_company: str | None
    vessel: str | None
    port_id: uuid.UUID | None
    port: PortSummary | None
    eta: Date | None
    etb: Date | None
    containers: str | None
    carrier: str | None
    local_ioa: str | None

    lpco_packaging: str | None
    lpco_number: str | None
    map_type: MapType | None
    map_packaging_released: bool
    selected_unit: str | None

    inspection_date: Date | None
    cargo_presence_date: Date | None
    released_at: Date | None
    comex_informed_date: Date | None
    comex_released: bool
    guide_sent: bool
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
