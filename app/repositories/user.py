from sqlalchemy import func, select
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

    def list_users(
        self, *, is_active: bool | None = None, offset: int = 0, limit: int = 20
    ) -> list[User]:
        stmt = select(User)
        if is_active is not None:
            stmt = stmt.where(User.is_active.is_(is_active))
        stmt = stmt.offset(offset).limit(limit)
        return list(self.db.scalars(stmt).all())

    def count_users(self, *, is_active: bool | None = None) -> int:
        stmt = select(func.count()).select_from(User)
        if is_active is not None:
            stmt = stmt.where(User.is_active.is_(is_active))
        return self.db.scalar(stmt) or 0
