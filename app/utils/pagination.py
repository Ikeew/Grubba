import math
from dataclasses import dataclass
from typing import TypeVar

from fastapi import Query

from app.schemas.common import PaginatedResponse

T = TypeVar("T")


@dataclass
class PaginationParams:
    page: int
    page_size: int

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        return self.page_size


def get_pagination(
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Items per page"),
) -> PaginationParams:
    return PaginationParams(page=page, page_size=page_size)


def paginate(items: list[T], total: int, pagination: PaginationParams) -> PaginatedResponse[T]:
    pages = math.ceil(total / pagination.page_size) if pagination.page_size else 0
    return PaginatedResponse(
        items=items,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        pages=pages,
    )
