from uuid import UUID

from app.core.exceptions import ConflictError, NotFoundError
from app.core.security import hash_password, verify_password
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.user import UserCreate, UserUpdate, UserPasswordChange
from app.utils.pagination import PaginationParams, paginate


class UserService:
    def __init__(self, user_repo: UserRepository) -> None:
        self._users = user_repo

    def create(self, payload: UserCreate) -> User:
        if self._users.email_exists(payload.email):
            raise ConflictError(f"Email '{payload.email}' is already registered")

        user = User(
            email=payload.email,
            full_name=payload.full_name,
            hashed_password=hash_password(payload.password),
            role=payload.role,
        )
        return self._users.create(user)

    def get_or_404(self, user_id: UUID) -> User:
        user = self._users.get_by_id(user_id)
        if not user:
            raise NotFoundError("User")
        return user

    def list_paginated(self, pagination: PaginationParams):
        total = self._users.count()
        items = self._users.list(offset=pagination.offset, limit=pagination.limit)
        return paginate(items, total, pagination)

    def update(self, user_id: UUID, payload: UserUpdate) -> User:
        user = self.get_or_404(user_id)
        data = payload.model_dump(exclude_none=True)
        return self._users.update(user, data)

    def change_password(self, user: User, payload: UserPasswordChange) -> User:
        if not verify_password(payload.current_password, user.hashed_password):
            raise ConflictError("Current password is incorrect")
        return self._users.update(user, {"hashed_password": hash_password(payload.new_password)})

    def deactivate(self, user_id: UUID) -> User:
        user = self.get_or_404(user_id)
        return self._users.update(user, {"is_active": False})
