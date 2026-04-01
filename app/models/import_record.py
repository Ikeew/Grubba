import enum
import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin
from app.models.export_record import MapType, RecordStatus

if TYPE_CHECKING:
    from app.models.client import Client
    from app.models.user import User
    from app.models.import_file import ImportFile
    from app.models.note import Note
    from app.models.update_history import UpdateHistory


class Modality(str, enum.Enum):
    maritimo = "maritimo"
    aereo = "aereo"


class ImportRecord(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "import_records"

    # --- Foreign keys ---
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False, index=True
    )
    collaborator_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    # --- Core fields ---
    reference: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[RecordStatus] = mapped_column(
        Enum(RecordStatus, name="record_status"), nullable=False, default=RecordStatus.draft
    )
    modality: Mapped[Modality | None] = mapped_column(Enum(Modality, name="modality"), nullable=True)

    # --- Identification ---
    importer: Mapped[str | None] = mapped_column(String(255), nullable=True)           # importador
    ce_mercante: Mapped[str | None] = mapped_column(String(100), nullable=True)
    awb_bl: Mapped[str | None] = mapped_column(String(100), nullable=True)
    di_duimp_dta: Mapped[str | None] = mapped_column(String(100), nullable=True)
    numero_li: Mapped[str | None] = mapped_column(String(100), nullable=True)
    dta: Mapped[str | None] = mapped_column(String(100), nullable=True)
    dtc: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # --- Logistics / shipping ---
    shipping_company: Mapped[str | None] = mapped_column(String(150), nullable=True)   # armador
    vessel: Mapped[str | None] = mapped_column(String(150), nullable=True)             # navio
    port: Mapped[str | None] = mapped_column(String(150), nullable=True)               # porto
    eta: Mapped[date | None] = mapped_column(Date, nullable=True)
    etb: Mapped[date | None] = mapped_column(Date, nullable=True)
    containers: Mapped[str | None] = mapped_column(Text, nullable=True)
    carrier: Mapped[str | None] = mapped_column(String(255), nullable=True)            # transportadora
    local_ioa: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # --- Inspection / LPCO ---
    lpco_packaging: Mapped[str | None] = mapped_column(String(100), nullable=True)     # lpco_embalagem
    lpco_number: Mapped[str | None] = mapped_column(String(100), nullable=True)        # numero_lpco
    map_type: Mapped[MapType | None] = mapped_column(Enum(MapType, name="map_type"), nullable=True)
    map_packaging_released: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    selected_unit: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # --- Release / dates ---
    cargo_presence_date: Mapped[date | None] = mapped_column(Date, nullable=True)      # data_presenca_carga
    released_at: Mapped[date | None] = mapped_column(Date, nullable=True)              # liberado_em
    comex_informed_date: Mapped[date | None] = mapped_column(Date, nullable=True)      # comex_informado_data
    comex_released: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    guide_sent: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)   # guia_enviada
    finalized_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # --- Notes ---
    observations: Mapped[str | None] = mapped_column(Text, nullable=True)

    # --- Relationships ---
    client: Mapped["Client"] = relationship(back_populates="import_records")
    collaborator: Mapped["User | None"] = relationship(
        back_populates="import_records", foreign_keys=[collaborator_id]
    )
    files: Mapped[list["ImportFile"]] = relationship(
        back_populates="import_record", cascade="all, delete-orphan"
    )
    notes: Mapped[list["Note"]] = relationship(
        back_populates="import_record",
        primaryjoin="Note.import_record_id == ImportRecord.id",
        cascade="all, delete-orphan",
    )
    history: Mapped[list["UpdateHistory"]] = relationship(
        back_populates="import_record",
        primaryjoin="UpdateHistory.import_record_id == ImportRecord.id",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<ImportRecord id={self.id} reference={self.reference} status={self.status}>"
