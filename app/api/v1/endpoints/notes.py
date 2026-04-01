from uuid import UUID

from fastapi import APIRouter

from app.dependencies.auth import CurrentUser
from app.dependencies.db import DbSession
from app.repositories.export_record import ExportRecordRepository
from app.repositories.import_record import ImportRecordRepository
from app.repositories.note import NoteRepository
from app.schemas.note import NoteCreate, NoteResponse, NoteUpdate
from app.services.note import NoteService

router = APIRouter(tags=["notes"])


def _note_service(db: DbSession) -> NoteService:
    return NoteService(NoteRepository(db), ExportRecordRepository(db), ImportRecordRepository(db))


@router.post("/notes", response_model=NoteResponse, status_code=201, summary="Create a note")
def create_note(
    payload: NoteCreate, db: DbSession, current_user: CurrentUser
) -> NoteResponse:
    note = _note_service(db).create(payload, current_user)
    return NoteResponse.model_validate(note)


@router.get(
    "/export-records/{record_id}/notes",
    response_model=list[NoteResponse],
    summary="List notes for an export record",
)
def list_export_notes(
    record_id: UUID, db: DbSession, _: CurrentUser
) -> list[NoteResponse]:
    notes = _note_service(db).list_by_export_record(record_id)
    return [NoteResponse.model_validate(n) for n in notes]


@router.get(
    "/import-records/{record_id}/notes",
    response_model=list[NoteResponse],
    summary="List notes for an import record",
)
def list_import_notes(
    record_id: UUID, db: DbSession, _: CurrentUser
) -> list[NoteResponse]:
    notes = _note_service(db).list_by_import_record(record_id)
    return [NoteResponse.model_validate(n) for n in notes]


@router.patch("/notes/{note_id}", response_model=NoteResponse, summary="Update a note")
def update_note(
    note_id: UUID, payload: NoteUpdate, db: DbSession, current_user: CurrentUser
) -> NoteResponse:
    note = _note_service(db).update(note_id, payload, current_user)
    return NoteResponse.model_validate(note)


@router.delete("/notes/{note_id}", status_code=204, summary="Delete a note")
def delete_note(note_id: UUID, db: DbSession, current_user: CurrentUser) -> None:
    _note_service(db).delete(note_id, current_user)
