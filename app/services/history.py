from uuid import UUID

from app.models.update_history import RecordType, UpdateHistory
from app.repositories.update_history import UpdateHistoryRepository


FIELDS_TO_TRACK_EXPORT = {
    "reference", "date", "status", "lpco", "vessel", "booking", "port",
    "due_25br", "eta", "ddl_carga", "shipping_company", "etb", "et5",
    "services", "map_type", "selected_unit", "new_seal", "inspection_date",
    "comex_released_date", "collaborator_id", "finalized_at", "observations",
}

FIELDS_TO_TRACK_IMPORT = {
    "reference", "date", "status", "modality", "importer", "ce_mercante",
    "awb_bl", "di_duimp_dta", "numero_li", "dta", "dtc", "shipping_company",
    "vessel", "port", "eta", "etb", "containers", "carrier", "local_ioa",
    "lpco_packaging", "lpco_number", "map_type", "map_packaging_released",
    "selected_unit", "cargo_presence_date", "released_at", "comex_informed_date",
    "comex_released", "guide_sent", "finalized_at", "collaborator_id", "observations",
}


class HistoryService:
    def __init__(self, history_repo: UpdateHistoryRepository) -> None:
        self._history = history_repo

    def record_export_changes(
        self, record_id: UUID, old_data: dict, new_data: dict, changed_by_id: UUID | None
    ) -> None:
        self._record_changes(
            record_type=RecordType.export,
            record_id=record_id,
            old_data=old_data,
            new_data=new_data,
            changed_by_id=changed_by_id,
            tracked_fields=FIELDS_TO_TRACK_EXPORT,
            id_kwarg="export_record_id",
        )

    def record_import_changes(
        self, record_id: UUID, old_data: dict, new_data: dict, changed_by_id: UUID | None
    ) -> None:
        self._record_changes(
            record_type=RecordType.import_,
            record_id=record_id,
            old_data=old_data,
            new_data=new_data,
            changed_by_id=changed_by_id,
            tracked_fields=FIELDS_TO_TRACK_IMPORT,
            id_kwarg="import_record_id",
        )

    def get_export_history(self, record_id: UUID) -> list[UpdateHistory]:
        return self._history.list_by_export_record(record_id)

    def get_import_history(self, record_id: UUID) -> list[UpdateHistory]:
        return self._history.list_by_import_record(record_id)

    def _record_changes(
        self,
        *,
        record_type: RecordType,
        record_id: UUID,
        old_data: dict,
        new_data: dict,
        changed_by_id: UUID | None,
        tracked_fields: set[str],
        id_kwarg: str,
    ) -> None:
        for field in tracked_fields:
            old_val = old_data.get(field)
            new_val = new_data.get(field)
            if old_val != new_val:
                entry = UpdateHistory(
                    record_type=record_type,
                    **{id_kwarg: record_id},
                    changed_by_id=changed_by_id,
                    field_name=field,
                    old_value=str(old_val) if old_val is not None else None,
                    new_value=str(new_val) if new_val is not None else None,
                )
                self._history.create(entry)
