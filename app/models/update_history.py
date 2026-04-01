import enum
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.export_record import ExportRecord
    from app.models.import_record import ImportRecord
    from app.models.user import User


class RecordType(str, enum.Enum):
    export = "export"
    import_ = "import"


class UpdateHistory(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    Immutable log of field-level changes on export and import records.
    Each row represents one changed field in one update operation.
    """

    __tablename__ = "update_history"

    export_record_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("export_records.id"), nullable=True, index=True
    )
    import_record_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("import_records.id"), nullable=True, index=True
    )
    changed_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    record_type: Mapped[RecordType] = mapped_column(
        Enum(RecordType, name="record_type"), nullable=False
    )
    field_name: Mapped[str] = mapped_column(String(100), nullable=False)
    old_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    new_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    export_record: Mapped["ExportRecord | None"] = relationship(
        back_populates="history", foreign_keys=[export_record_id]
    )
    import_record: Mapped["ImportRecord | None"] = relationship(
        back_populates="history", foreign_keys=[import_record_id]
    )
    changed_by: Mapped["User | None"] = relationship(back_populates="history_entries")

    def __repr__(self) -> str:
        return f"<UpdateHistory id={self.id} field={self.field_name}>"
