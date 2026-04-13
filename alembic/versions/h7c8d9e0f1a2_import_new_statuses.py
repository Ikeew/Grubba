"""Add new import statuses: agendado_inspecao, aguardando_ati, aguardando_plmi_tela_verde, aguardando_programacao

Revision ID: h7c8d9e0f1a2
Revises: g6b7c8d9e0f1
Create Date: 2026-04-13 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

revision: str = 'h7c8d9e0f1a2'
down_revision: Union[str, None] = 'g6b7c8d9e0f1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE import_status ADD VALUE IF NOT EXISTS 'agendado_inspecao'")
    op.execute("ALTER TYPE import_status ADD VALUE IF NOT EXISTS 'aguardando_ati'")
    op.execute("ALTER TYPE import_status ADD VALUE IF NOT EXISTS 'aguardando_plmi_tela_verde'")
    op.execute("ALTER TYPE import_status ADD VALUE IF NOT EXISTS 'aguardando_programacao'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values; downgrade is a no-op
    pass
