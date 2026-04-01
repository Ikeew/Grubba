from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.exceptions import ForbiddenError
from app.dependencies.db import DbSession
from app.models.user import User, UserRole
from app.repositories.user import UserRepository
from app.services.auth import AuthService

_bearer = HTTPBearer()


def get_current_user(
    db: DbSession,
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
) -> User:
    user_repo = UserRepository(db)
    auth_service = AuthService(user_repo)
    return auth_service.get_current_user_from_token(credentials.credentials)


def require_admin(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    if current_user.role != UserRole.admin:
        raise ForbiddenError("Admin access required")
    return current_user


CurrentUser = Annotated[User, Depends(get_current_user)]
AdminUser = Annotated[User, Depends(require_admin)]
