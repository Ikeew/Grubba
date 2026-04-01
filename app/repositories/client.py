from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.client import Client
from app.repositories.base import BaseRepository


class ClientRepository(BaseRepository[Client]):
    model = Client

    def __init__(self, db: Session) -> None:
        super().__init__(db)

    def get_by_cnpj(self, cnpj: str) -> Client | None:
        stmt = select(Client).where(Client.cnpj == cnpj)
        return self.db.scalar(stmt)

    def search(self, query: str, *, offset: int = 0, limit: int = 20) -> list[Client]:
        pattern = f"%{query}%"
        stmt = (
            select(Client)
            .where(
                or_(
                    Client.name.ilike(pattern),
                    Client.cnpj.ilike(pattern),
                    Client.email.ilike(pattern),
                )
            )
            .offset(offset)
            .limit(limit)
        )
        return list(self.db.scalars(stmt).all())

    def count_search(self, query: str) -> int:
        pattern = f"%{query}%"
        stmt = select(func.count()).select_from(Client).where(
            or_(
                Client.name.ilike(pattern),
                Client.cnpj.ilike(pattern),
                Client.email.ilike(pattern),
            )
        )
        return self.db.scalar(stmt) or 0

    def list_active(self, *, offset: int = 0, limit: int = 20) -> list[Client]:
        stmt = select(Client).where(Client.is_active.is_(True)).offset(offset).limit(limit)
        return list(self.db.scalars(stmt).all())

    def count_active(self) -> int:
        stmt = select(func.count()).select_from(Client).where(Client.is_active.is_(True))
        return self.db.scalar(stmt) or 0
