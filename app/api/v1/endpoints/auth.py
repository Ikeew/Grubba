from fastapi import APIRouter

from app.dependencies.auth import CurrentUser
from app.dependencies.db import DbSession
from app.repositories.user import UserRepository
from app.schemas.auth import AccessTokenResponse, LoginRequest, RefreshRequest, TokenResponse
from app.schemas.user import UserResponse
from app.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


def _auth_service(db: DbSession) -> AuthService:
    return AuthService(UserRepository(db))


@router.post("/login", response_model=TokenResponse, summary="Authenticate and receive tokens")
def login(payload: LoginRequest, db: DbSession) -> TokenResponse:
    return _auth_service(db).login(payload.email, payload.password)


@router.post("/refresh", response_model=AccessTokenResponse, summary="Refresh access token")
def refresh_token(payload: RefreshRequest, db: DbSession) -> AccessTokenResponse:
    return _auth_service(db).refresh_access_token(payload.refresh_token)


@router.get("/me", response_model=UserResponse, summary="Get authenticated user profile")
def get_me(current_user: CurrentUser) -> UserResponse:
    return UserResponse.model_validate(current_user)
