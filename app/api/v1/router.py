from fastapi import APIRouter

from app.api.v1.endpoints import auth, clients, export_records, files, import_records, notes, users

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(clients.router)
api_router.include_router(export_records.router)
api_router.include_router(import_records.router)
api_router.include_router(files.router)
api_router.include_router(notes.router)
