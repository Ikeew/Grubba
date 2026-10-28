import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Any

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.client import Client
    from app.models.user import User

# Tipos de ficha aceitos em ReceiptItem.record_type
RECEIPT_RECORD_TYPES = ("import", "export", "deconsolidation")


class Receipt(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Recibo emitido no Faturamento.

    Tudo que é impresso fica salvo como snapshot (dados do cliente e campos de cada ficha),
    então editar a ficha ou o cliente depois não altera um recibo já emitido.
    """

    __tablename__ = "receipts"

    # Sequência global contínua (nunca zera) e número formatado GT{MM}{seq:03d}-{AA}
    sequence: Mapped[int] = mapped_column(Integer, nullable=False, unique=True)
    number: Mapped[str] = mapped_column(String(20), nullable=False, unique=True, index=True)

    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False, index=True
    )
    issue_date: Mapped[date] = mapped_column(Date, nullable=False)

    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)       # soma das fichas
    extras_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)   # soma dos custos extras
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    # --- Snapshot do cliente ---
    client_name: Mapped[str] = mapped_column(String(255), nullable=False)
    client_cnpj: Mapped[str | None] = mapped_column(String(18), nullable=True)
    client_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    client_fields: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    client_snapshot: Mapped[list[dict[str, Any]]] = mapped_column(JSON, nullable=False, default=list)

    # Campos escolhidos por tipo de ficha: {"import": [...], "export": [...], "deconsolidation": [...]}
    record_fields: Mapped[dict[str, list[str]]] = mapped_column(JSON, nullable=False, default=dict)

    created_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    # --- Cancelamento (soft delete) ---
    is_cancelled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    # --- Relationships ---
    client: Mapped["Client"] = relationship()
    created_by: Mapped["User | None"] = relationship(foreign_keys=[created_by_id])
    cancelled_by: Mapped["User | None"] = relationship(foreign_keys=[cancelled_by_id])
    items: Mapped[list["ReceiptItem"]] = relationship(
        back_populates="receipt", cascade="all, delete-orphan", order_by="ReceiptItem.position"
    )
    extra_costs: Mapped[list["ReceiptExtraCost"]] = relationship(
        back_populates="receipt", cascade="all, delete-orphan", order_by="ReceiptExtraCost.position"
    )

    @property
    def items_count(self) -> int:
        return len(self.items)

    def __repr__(self) -> str:
        return f"<Receipt id={self.id} number={self.number} total={self.total}>"


class ReceiptItem(UUIDPrimaryKeyMixin, Base):
    # FK da ficha vira NULL se a ficha for excluída; record_type + snapshot preservam o recibo
    __tablename__ = "receipt_items"
    __table_args__ = (
        CheckConstraint(
            "(CASE WHEN import_record_id IS NOT NULL THEN 1 ELSE 0 END"
            " + CASE WHEN export_record_id IS NOT NULL THEN 1 ELSE 0 END"
            " + CASE WHEN deconsolidation_record_id IS NOT NULL THEN 1 ELSE 0 END) <= 1",
            name="ck_receipt_items_single_record",
        ),
    )

    receipt_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("receipts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    record_type: Mapped[str] = mapped_column(String(20), nullable=False)  # import | export | deconsolidation

    import_record_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("import_records.id", ondelete="SET NULL"), nullable=True, index=True
    )
    export_record_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("export_records.id", ondelete="SET NULL"), nullable=True, index=True
    )
    deconsolidation_record_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("deconsolidation_records.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    reference: Mapped[str | None] = mapped_column(String(100), nullable=True)  # snapshot p/ listagem
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    snapshot: Mapped[list[dict[str, Any]]] = mapped_column(JSON, nullable=False, default=list)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    receipt: Mapped["Receipt"] = relationship(back_populates="items")

    @property
    def record_id(self) -> uuid.UUID | None:
        return self.import_record_id or self.export_record_id or self.deconsolidation_record_id


class ReceiptExtraCost(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "receipt_extra_costs"

    receipt_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("receipts.id", ondelete="CASCADE"), nullable=False, index=True
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    receipt: Mapped["Receipt"] = relationship(back_populates="extra_costs")
