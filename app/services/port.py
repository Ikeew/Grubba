from uuid import UUID

from app.core.exceptions import ConflictError, NotFoundError
from app.models.port import Port
from app.repositories.port import PortRepository
from app.schemas.port import PortCreate, PortUpdate


class PortService:
    def __init__(self, repo: PortRepository) -> None:
        self._ports = repo

    def create(self, payload: PortCreate) -> Port:
        if self._ports.get_by_name(payload.name):
            raise ConflictError(f"Porto '{payload.name}' já está cadastrado")
        port = Port(**payload.model_dump())
        return self._ports.create(port)

    def get_or_404(self, port_id: UUID) -> Port:
        port = self._ports.get_by_id(port_id)
        if not port:
            raise NotFoundError("Porto")
        return port

    def list_all(self) -> list[Port]:
        return self._ports.list_all()

    def update(self, port_id: UUID, payload: PortUpdate) -> Port:
        port = self.get_or_404(port_id)
        data = payload.model_dump(exclude_none=True)
        if "name" in data and data["name"] != port.name:
            if self._ports.get_by_name(data["name"]):
                raise ConflictError(f"Porto '{data['name']}' já está cadastrado")
        return self._ports.update(port, data)

    def delete(self, port_id: UUID) -> None:
        port = self.get_or_404(port_id)
        self._ports.delete(port)
