import uuid
from datetime import datetime

from pydantic import BaseModel, model_validator

from app.schemas.user import UserSummary


class NoteCreate(BaseModel):
    content: str
    export_record_id: uuid.UUID | None = None
    import_record_id: uuid.UUID | None = None
    deconsolidation_record_id: uuid.UUID | None = None

    @model_validator(mode="after")
    def validate_exactly_one_record(self) -> "NoteCreate":
        provided = sum(
            1
            for value in (
                self.export_record_id,
                self.import_record_id,
                self.deconsolidation_record_id,
            )
            if value
        )
        if provided != 1:
            raise ValueError(
                "Exactly one of export_record_id, import_record_id or "
                "deconsolidation_record_id must be set"
            )
        return self


class NoteUpdate(BaseModel):
    content: str


class NoteResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    content: str
    export_record_id: uuid.UUID | None
    import_record_id: uuid.UUID | None
    deconsolidation_record_id: uuid.UUID | None
    author: UserSummary | None
    created_at: datetime
    updated_at: datetime
