import uuid
from datetime import datetime

from pydantic import BaseModel


class DeconsolidationFileResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    deconsolidation_record_id: uuid.UUID
    original_filename: str
    stored_filename: str
    file_size: int
    content_type: str | None
    uploaded_by_id: uuid.UUID | None
    created_at: datetime
