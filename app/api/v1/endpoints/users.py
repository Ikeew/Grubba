from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends

from app.dependencies.auth import AdminUser, CurrentUser
from app.dependencies.db import DbSession
from app.repositories.user import UserRepository
from app.schemas.common import PaginatedResponse
from app.schemas.user import UserCreate, UserPasswordChange, UserResponse, UserUpdate
from app.services.user import UserService
from app.utils.pagination import PaginationParams, get_pagination

router = APIRouter(prefix="/users", tags=["users"])

Pagination = Annotated[PaginationParams, Depends(get_pagination)]


def _user_service(db: DbSession) -> UserService:
    return UserService(UserRepository(db))


@router.post("", response_model=UserResponse, status_code=201, summary="Create user (admin only)")
def create_user(payload: UserCreate, db: DbSession, _: AdminUser) -> UserResponse:
    user = _user_service(db).create(payload)
    return UserResponse.model_validate(user)


@router.get("", response_model=PaginatedResponse[UserResponse], summary="List users")
def list_users(db: DbSession, _: CurrentUser, pagination: Pagination):
    return _user_service(db).list_paginated(pagination)


@router.get("/{user_id}", response_model=UserResponse, summary="Get user by ID")
def get_user(user_id: UUID, db: DbSession, _: CurrentUser) -> UserResponse:
    user = _user_service(db).get_or_404(user_id)
    return UserResponse.model_validate(user)


@router.patch("/{user_id}", response_model=UserResponse, summary="Update user (admin only)")
def update_user(user_id: UUID, payload: UserUpdate, db: DbSession, _: AdminUser) -> UserResponse:
    user = _user_service(db).update(user_id, payload)
    return UserResponse.model_validate(user)


@router.post("/me/change-password", response_model=UserResponse, summary="Change own password")
def change_password(
    payload: UserPasswordChange, db: DbSession, current_user: CurrentUser
) -> UserResponse:
    user = _user_service(db).change_password(current_user, payload)
    return UserResponse.model_validate(user)


@router.delete("/{user_id}", status_code=204, summary="Deactivate user (admin only)")
def deactivate_user(user_id: UUID, db: DbSession, _: AdminUser) -> None:
    _user_service(db).deactivate(user_id)
