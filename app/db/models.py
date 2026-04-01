"""
Carrega todos os modelos ORM para registrar tabelas em Base.metadata
(Alembic, create_all em testes/seeds). Evita import circular com app.db.base.
"""
from app.db.base import Base  # noqa: F401

from app.models.user import User  # noqa: F401, E402
from app.models.client import Client  # noqa: F401, E402
from app.models.export_record import ExportRecord  # noqa: F401, E402
from app.models.import_record import ImportRecord  # noqa: F401, E402
from app.models.import_file import ImportFile  # noqa: F401, E402
from app.models.note import Note  # noqa: F401, E402
from app.models.update_history import UpdateHistory  # noqa: F401, E402
