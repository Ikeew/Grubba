from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.deconsolidation_record import DeconsolidationRecord
    from app.models.export_record import ExportRecord
    from app.models.import_record import ImportRecord


class Client(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "clients"

    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    cnpj: Mapped[str | None] = mapped_column(String(18), nullable=True, unique=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Valores padrão de serviço — pré-preenchem o recibo (editáveis só por admin/manager)
    valor_padrao_importacao: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    valor_padrao_exportacao: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    valor_padrao_desconsolidacao: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)

    # Relationships
    export_records: Mapped[list["ExportRecord"]] = relationship(back_populates="client")
    import_records: Mapped[list["ImportRecord"]] = relationship(back_populates="client")
    deconsolidation_records: Mapped[list["DeconsolidationRecord"]] = relationship(
        back_populates="client"
    )

    def __repr__(self) -> str:
        return f"<Client id={self.id} name={self.name}>"
