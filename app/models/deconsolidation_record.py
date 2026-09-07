import enum
import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Column, Date, DateTime, Enum, ForeignKey, String, Table, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin
from app.models.export_record import FlagColor

if TYPE_CHECKING:
    from app.models.client import Client
    from app.models.deconsolidation_file import DeconsolidationFile
    from app.models.note import Note
    from app.models.update_history import UpdateHistory
    from app.models.user import User


class DeconsolidationModality(str, enum.Enum):
    importacao = "importacao"
    exportacao = "exportacao"


class DeconsolidationService(str, enum.Enum):
    retirada = "retirada"
    liberacao = "liberacao"


class DeconsolidationStatus(str, enum.Enum):
    aguardando_chegada_documento = "aguardando_chegada_documento"
    agendamento_apresentacao = "agendamento_apresentacao"
    aguardando_liberacao = "aguardando_liberacao"
    liberacao_realizada = "liberacao_realizada"
    completed = "completed"
    cancelled = "cancelled"


# Junction table for deconsolidation record flags (per-user)
deconsolidation_record_flags = Table(
    "deconsolidation_record_flags",
    Base.metadata,
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column(
        "deconsolidation_record_id",
        UUID(as_uuid=True),
        ForeignKey("deconsolidation_records.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column("color", String(10), nullable=False, server_default=FlagColor.red.value),
)


class DeconsolidationRecordFlag(Base):
    """Association object over ``deconsolidation_record_flags`` (read-only helper)."""

    __table__ = deconsolidation_record_flags


class DeconsolidationRecord(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "deconsolidation_records"

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
    status: Mapped[DeconsolidationStatus] = mapped_column(
        Enum(DeconsolidationStatus, name="deconsolidation_status"),
        nullable=False,
        default=DeconsolidationStatus.aguardando_chegada_documento,
    )
    modality: Mapped[DeconsolidationModality | None] = mapped_column(
        Enum(DeconsolidationModality, name="deconsolidation_modality"), nullable=True
    )
    consignee: Mapped[str | None] = mapped_column(String(255), nullable=True)  # consignatário
    services: Mapped[list[str]] = mapped_column(ARRAY(String), nullable=False, default=list)

    # --- Documentação ---
    ce_mercante: Mapped[str | None] = mapped_column(String(100), nullable=True)
    master_bl: Mapped[str | None] = mapped_column(String(100), nullable=True)  # AWB/BL Master
    house_bl: Mapped[str | None] = mapped_column(String(100), nullable=True)   # AWB/BL House

    # --- Representação ---
    agency: Mapped[str | None] = mapped_column(String(255), nullable=True)            # agência representante
    shipping_company: Mapped[str | None] = mapped_column(String(150), nullable=True)  # armador

    # --- Notes ---
    observations: Mapped[str | None] = mapped_column(Text, nullable=True)

    # --- Finalização / faturamento ---
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    billing_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # --- Relationships ---
    client: Mapped["Client"] = relationship(back_populates="deconsolidation_records")
    collaborator: Mapped["User | None"] = relationship(
        back_populates="deconsolidation_records", foreign_keys=[collaborator_id]
    )
    flags: Mapped[list["DeconsolidationRecordFlag"]] = relationship(
        cascade="all, delete-orphan",
    )
    files: Mapped[list["DeconsolidationFile"]] = relationship(
        back_populates="deconsolidation_record", cascade="all, delete-orphan"
    )
    notes: Mapped[list["Note"]] = relationship(
        back_populates="deconsolidation_record",
        primaryjoin="Note.deconsolidation_record_id == DeconsolidationRecord.id",
        cascade="all, delete-orphan",
    )
    history: Mapped[list["UpdateHistory"]] = relationship(
        back_populates="deconsolidation_record",
        primaryjoin="UpdateHistory.deconsolidation_record_id == DeconsolidationRecord.id",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<DeconsolidationRecord id={self.id} reference={self.reference} status={self.status}>"
