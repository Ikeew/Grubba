import uuid
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.export_record import ExportRecord
    from app.models.user import User


class ExportFile(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "export_files"

    export_record_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("export_records.id"), nullable=False, index=True
    )
    uploaded_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    stored_filename: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    file_size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    content_type: Mapped[str | None] = mapped_column(String(100), nullable=True)

    export_record: Mapped["ExportRecord"] = relationship(back_populates="files")
    uploaded_by: Mapped["User | None"] = relationship()

    def __repr__(self) -> str:
        return f"<ExportFile id={self.id} original={self.original_filename}>"
