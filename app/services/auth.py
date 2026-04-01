from jose import JWTError

from app.core.exceptions import UnauthorizedError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
    verify_password,
)
from app.models.user import User
from app.repositories.user import UserRepository
from app.schemas.auth import AccessTokenResponse, TokenResponse


class AuthService:
    def __init__(self, user_repo: UserRepository) -> None:
        self._users = user_repo

    def login(self, email: str, password: str) -> TokenResponse:
        user = self._users.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise UnauthorizedError("Invalid email or password")
        if not user.is_active:
            raise UnauthorizedError("Account is disabled")

        return TokenResponse(
            access_token=create_access_token(user.id),
            refresh_token=create_refresh_token(user.id),
        )

    def refresh_access_token(self, refresh_token: str) -> AccessTokenResponse:
        try:
            user_id = decode_refresh_token(refresh_token)
        except JWTError:
            raise UnauthorizedError("Invalid or expired refresh token")

        user = self._users.get_by_id(user_id)  # type: ignore[arg-type]
        if not user or not user.is_active:
            raise UnauthorizedError("User not found or disabled")

        return AccessTokenResponse(access_token=create_access_token(user.id))

    def get_current_user_from_token(self, token: str) -> User:
        try:
            user_id = decode_access_token(token)
        except JWTError:
            raise UnauthorizedError("Invalid or expired access token")

        user = self._users.get_by_id(user_id)  # type: ignore[arg-type]
        if not user:
            raise UnauthorizedError("User not found")
        if not user.is_active:
            raise UnauthorizedError("Account is disabled")
        return user
