from uuid import UUID

from fastapi import APIRouter

from app.dependencies.auth import CurrentUser, PortManagerUser
from app.dependencies.db import DbSession
from app.repositories.port import PortRepository
from app.schemas.port import PortCreate, PortResponse, PortUpdate
from app.services.port import PortService

router = APIRouter(prefix="/ports", tags=["ports"])


def _service(db: DbSession) -> PortService:
    return PortService(PortRepository(db))


@router.get("", response_model=list[PortResponse], summary="List all ports")
def list_ports(db: DbSession, _: CurrentUser) -> list[PortResponse]:
    ports = _service(db).list_all()
    return [PortResponse.model_validate(p) for p in ports]


@router.post("", response_model=PortResponse, status_code=201, summary="Create port (admin/manager)")
def create_port(payload: PortCreate, db: DbSession, _: PortManagerUser) -> PortResponse:
    port = _service(db).create(payload)
    return PortResponse.model_validate(port)


@router.patch("/{port_id}", response_model=PortResponse, summary="Update port (admin/manager)")
def update_port(port_id: UUID, payload: PortUpdate, db: DbSession, _: PortManagerUser) -> PortResponse:
    port = _service(db).update(port_id, payload)
    return PortResponse.model_validate(port)


@router.delete("/{port_id}", status_code=204, summary="Delete port (admin/manager)")
def delete_port(port_id: UUID, db: DbSession, _: PortManagerUser) -> None:
    _service(db).delete(port_id)
