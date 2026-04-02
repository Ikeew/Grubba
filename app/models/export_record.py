import enum
import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.client import Client
    from app.models.user import User
    from app.models.note import Note
    from app.models.update_history import UpdateHistory


class ExportService(str, enum.Enum):
    vistoria_receita_federal = "vistoria_receita_federal"
    coleta_e_entrega_de_lacre = "coleta_e_entrega_de_lacre"
    vistoria_mapa_coleta = "vistoria_mapa_coleta"
    vistoria_anuentes = "vistoria_anuentes"
    comex = "comex"
    liberacao_retirada_de_bl_e_docs = "liberacao_retirada_de_bl_e_docs"
    fornecimento_de_navio_oleo = "fornecimento_de_navio_oleo"
    mapa_sistema = "mapa_sistema"
    lpco_x_vistoria_x_cf_csi = "lpco_x_vistoria_x_cf_csi"
    registro_despacho = "registro_despacho"
    outros = "outros"


class MapType(str, enum.Enum):
    vegetal = "vegetal"
    animal = "animal"


class RecordStatus(str, enum.Enum):
    draft = "draft"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class ExportRecord(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "export_records"

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

    # --- Shipping / logistics ---
    lpco: Mapped[str | None] = mapped_column(String(100), nullable=True)
    vessel: Mapped[str | None] = mapped_column(String(150), nullable=True)       # navio
    booking: Mapped[str | None] = mapped_column(String(100), nullable=True)
    port: Mapped[str | None] = mapped_column(String(150), nullable=True)         # porto
    due_25br: Mapped[str | None] = mapped_column(String(100), nullable=True)
    eta: Mapped[date | None] = mapped_column(Date, nullable=True)
    ddl_carga: Mapped[date | None] = mapped_column(Date, nullable=True)
    shipping_company: Mapped[str | None] = mapped_column(String(150), nullable=True)  # armador
    etb: Mapped[date | None] = mapped_column(Date, nullable=True)
    et5: Mapped[date | None] = mapped_column(Date, nullable=True)

    # --- Services (multi-select stored as PostgreSQL ARRAY of strings) ---
    # Decision: Using ARRAY(String) for native PostgreSQL array semantics.
    # Allows efficient ANY() queries without full JSON deserialization.
    services: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)

    # --- Inspection / release ---
    map_type: Mapped[MapType | None] = mapped_column(Enum(MapType, name="map_type"), nullable=True)
    selected_unit: Mapped[str | None] = mapped_column(String(255), nullable=True)
    new_seal: Mapped[str | None] = mapped_column(String(100), nullable=True)       # novo_lacre
    inspection_date: Mapped[date | None] = mapped_column(Date, nullable=True)       # data_vistoria
    comex_released_date: Mapped[date | None] = mapped_column(Date, nullable=True)   # comex_liberado_data

    # --- Completion ---
    finalized_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    observations: Mapped[str | None] = mapped_column(Text, nullable=True)

    # --- Relationships ---
    client: Mapped["Client"] = relationship(back_populates="export_records")
    collaborator: Mapped["User | None"] = relationship(
        back_populates="export_records", foreign_keys=[collaborator_id]
    )
    notes: Mapped[list["Note"]] = relationship(
        back_populates="export_record",
        primaryjoin="Note.export_record_id == ExportRecord.id",
        cascade="all, delete-orphan",
    )
    history: Mapped[list["UpdateHistory"]] = relationship(
        back_populates="export_record",
        primaryjoin="UpdateHistory.export_record_id == ExportRecord.id",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<ExportRecord id={self.id} reference={self.reference} status={self.status}>"
