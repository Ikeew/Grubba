import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.update_history import RecordType
from app.schemas.user import UserSummary


class UpdateHistoryResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    record_type: RecordType
    export_record_id: uuid.UUID | None
    import_record_id: uuid.UUID | None
    field_name: str
    old_value: str | None
    new_value: str | None
    description: str | None
    changed_by: UserSummary | None
    created_at: datetime
