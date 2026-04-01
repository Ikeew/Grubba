import enum
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.export_record import ExportRecord
    from app.models.import_record import ImportRecord
    from app.models.note import Note
    from app.models.update_history import UpdateHistory
    from app.models.import_file import ImportFile


class UserRole(str, enum.Enum):
    admin = "admin"
    collaborator = "collaborator"


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role"), nullable=False, default=UserRole.collaborator
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Relationships
    export_records: Mapped[list["ExportRecord"]] = relationship(
        back_populates="collaborator", foreign_keys="ExportRecord.collaborator_id"
    )
    import_records: Mapped[list["ImportRecord"]] = relationship(
        back_populates="collaborator", foreign_keys="ImportRecord.collaborator_id"
    )
    notes: Mapped[list["Note"]] = relationship(back_populates="author")
    history_entries: Mapped[list["UpdateHistory"]] = relationship(back_populates="changed_by")
    uploaded_files: Mapped[list["ImportFile"]] = relationship(back_populates="uploaded_by")

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role}>"
