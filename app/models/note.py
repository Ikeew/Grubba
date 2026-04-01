import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.export_record import ExportRecord
    from app.models.import_record import ImportRecord
    from app.models.user import User


class Note(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    Observation / comment attached to either an ExportRecord or an ImportRecord.
    One of export_record_id or import_record_id must be set (enforced at service layer).
    """

    __tablename__ = "notes"

    export_record_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("export_records.id"), nullable=True, index=True
    )
    import_record_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("import_records.id"), nullable=True, index=True
    )
    author_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    content: Mapped[str] = mapped_column(Text, nullable=False)

    # Relationships
    export_record: Mapped["ExportRecord | None"] = relationship(
        back_populates="notes", foreign_keys=[export_record_id]
    )
    import_record: Mapped["ImportRecord | None"] = relationship(
        back_populates="notes", foreign_keys=[import_record_id]
    )
    author: Mapped["User | None"] = relationship(back_populates="notes")

    def __repr__(self) -> str:
        return f"<Note id={self.id} author={self.author_id}>"
