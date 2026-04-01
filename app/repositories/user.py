from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    model = User

    def __init__(self, db: Session) -> None:
        super().__init__(db)

    def get_by_email(self, email: str) -> User | None:
        stmt = select(User).where(User.email == email)
        return self.db.scalar(stmt)

    def email_exists(self, email: str) -> bool:
        return self.get_by_email(email) is not None

    def list_active(self, *, offset: int = 0, limit: int = 20) -> list[User]:
        stmt = select(User).where(User.is_active.is_(True)).offset(offset).limit(limit)
        return list(self.db.scalars(stmt).all())
