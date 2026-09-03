import uuid
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.deconsolidation_record import DeconsolidationRecord
    from app.models.user import User


class DeconsolidationFile(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "deconsolidation_files"

    deconsolidation_record_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("deconsolidation_records.id"), nullable=False, index=True
    )
    uploaded_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    stored_filename: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    file_size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    content_type: Mapped[str | None] = mapped_column(String(100), nullable=True)

    deconsolidation_record: Mapped["DeconsolidationRecord"] = relationship(back_populates="files")
    uploaded_by: Mapped["User | None"] = relationship()

    def __repr__(self) -> str:
        return f"<DeconsolidationFile id={self.id} original={self.original_filename}>"
