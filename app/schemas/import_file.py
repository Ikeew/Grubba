import uuid
from datetime import datetime

from pydantic import BaseModel


class ImportFileResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    import_record_id: uuid.UUID
    original_filename: str
    stored_filename: str
    file_size: int
    content_type: str | None
    uploaded_by_id: uuid.UUID | None
    created_at: datetime
