from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.base import TimestampMixin, UUIDPrimaryKeyMixin


class Port(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "ports"

    name: Mapped[str] = mapped_column(String(150), nullable=False, unique=True, index=True)

    def __repr__(self) -> str:
        return f"<Port id={self.id} name={self.name}>"
