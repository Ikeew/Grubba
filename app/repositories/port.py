from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.port import Port
from app.repositories.base import BaseRepository


class PortRepository(BaseRepository[Port]):
    model = Port

    def __init__(self, db: Session) -> None:
        super().__init__(db)

    def get_by_name(self, name: str) -> Port | None:
        stmt = select(Port).where(Port.name == name)
        return self.db.scalar(stmt)

    def list_all(self) -> list[Port]:
        stmt = select(Port).order_by(Port.name)
        return list(self.db.scalars(stmt).all())
