import uuid
from datetime import datetime

from pydantic import BaseModel, model_validator

from app.schemas.user import UserSummary


class NoteCreate(BaseModel):
    content: str
    export_record_id: uuid.UUID | None = None
    import_record_id: uuid.UUID | None = None

    @model_validator(mode="after")
    def validate_exactly_one_record(self) -> "NoteCreate":
        if bool(self.export_record_id) == bool(self.import_record_id):
            raise ValueError("Exactly one of export_record_id or import_record_id must be set")
        return self


class NoteUpdate(BaseModel):
    content: str


class NoteResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    content: str
    export_record_id: uuid.UUID | None
    import_record_id: uuid.UUID | None
    author: UserSummary | None
    created_at: datetime
    updated_at: datetime
