import uuid
from typing import Any

from sqlalchemy import func, select, text, update
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.deconsolidation_record import DeconsolidationRecord, DeconsolidationStatus
from app.models.export_record import ExportRecord, ExportStatus
from app.models.import_record import ImportRecord, ImportStatus
from app.models.receipt import Receipt
from app.repositories.base import BaseRepository

# Modelo e status "concluído" de cada tipo de ficha
RECORD_MODELS: dict[str, Any] = {
    "import": (ImportRecord, ImportStatus.completed),
    "export": (ExportRecord, ExportStatus.completed),
    "deconsolidation": (DeconsolidationRecord, DeconsolidationStatus.completed),
}

# Chave arbitrária do advisory lock que serializa a numeração dos recibos
_SEQUENCE_LOCK_KEY = 7_420_001


class ReceiptRepository(BaseRepository[Receipt]):
    model = Receipt

    def __init__(self, db: Session) -> None:
        super().__init__(db)

    def get_with_relations(self, receipt_id: uuid.UUID) -> Receipt | None:
        stmt = (
            select(Receipt)
            .where(Receipt.id == receipt_id)
            .options(
                selectinload(Receipt.items),
                selectinload(Receipt.extra_costs),
                joinedload(Receipt.created_by),
                joinedload(Receipt.cancelled_by),
            )
        )
        return self.db.scalar(stmt)

    def list_filtered(
        self,
        *,
        client_id: uuid.UUID | None = None,
        include_cancelled: bool = True,
        search: str | None = None,
        offset: int = 0,
        limit: int = 20,
    ) -> list[Receipt]:
        stmt = select(Receipt).options(selectinload(Receipt.items), joinedload(Receipt.created_by))
        stmt = self._apply_filters(stmt, client_id, include_cancelled, search)
        stmt = stmt.order_by(Receipt.sequence.desc()).offset(offset).limit(limit)
        return list(self.db.scalars(stmt).unique().all())

    def count_filtered(
        self,
        *,
        client_id: uuid.UUID | None = None,
        include_cancelled: bool = True,
        search: str | None = None,
    ) -> int:
        stmt = select(func.count()).select_from(Receipt)
        stmt = self._apply_filters(stmt, client_id, include_cancelled, search)
        return self.db.scalar(stmt) or 0

    @staticmethod
    def _apply_filters(stmt: Any, client_id: Any, include_cancelled: bool, search: str | None) -> Any:
        if client_id is not None:
            stmt = stmt.where(Receipt.client_id == client_id)
        if not include_cancelled:
            stmt = stmt.where(Receipt.is_cancelled.is_(False))
        if search:
            stmt = stmt.where(
                Receipt.number.ilike(f"%{search}%") | Receipt.client_name.ilike(f"%{search}%")
            )
        return stmt

    def next_sequence(self) -> int:
        """Próximo número da sequência global. No Postgres serializa emissões concorrentes."""
        if self.db.get_bind().dialect.name == "postgresql":
            self.db.execute(text("SELECT pg_advisory_xact_lock(:key)"), {"key": _SEQUENCE_LOCK_KEY})
        current = self.db.scalar(select(func.max(Receipt.sequence)))
        return (current or 0) + 1

    # --- Fichas -------------------------------------------------------------

    def list_eligible_records(self, record_type: str, client_id: uuid.UUID) -> list[Any]:
        """Fichas que aparecem no Faturamento (concluídas, não faturadas) e sem recibo ativo."""
        model, completed = RECORD_MODELS[record_type]
        stmt = select(model).where(
            model.client_id == client_id,
            model.status == completed,
            model.billing_completed.is_(False),
            model.receipt_id.is_(None),
        )
        if hasattr(model, "port"):
            stmt = stmt.options(joinedload(model.port))
        stmt = stmt.order_by(model.completed_at.desc().nulls_last(), model.created_at.desc())
        return list(self.db.scalars(stmt).unique().all())

    def get_records(self, record_type: str, ids: list[uuid.UUID]) -> list[Any]:
        if not ids:
            return []
        model, _ = RECORD_MODELS[record_type]
        stmt = select(model).where(model.id.in_(ids))
        if hasattr(model, "port"):
            stmt = stmt.options(joinedload(model.port))
        return list(self.db.scalars(stmt).unique().all())

    def mark_records(self, records: list[Any], receipt_id: uuid.UUID) -> None:
        for record in records:
            record.receipt_id = receipt_id
        self.db.flush()

    def release_records(self, receipt_id: uuid.UUID) -> None:
        """Desmarca as fichas de um recibo cancelado (voltam a ficar elegíveis)."""
        for model, _ in RECORD_MODELS.values():
            self.db.execute(
                update(model)
                .where(model.receipt_id == receipt_id)
                .values(receipt_id=None)
                .execution_options(synchronize_session="fetch")
            )
        self.db.flush()
