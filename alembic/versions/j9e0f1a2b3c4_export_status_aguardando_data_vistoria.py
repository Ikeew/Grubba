"""Add aguardando_data_vistoria to export_status enum

Revision ID: j9e0f1a2b3c4
Revises: i8d9e0f1a2b3
Branch Labels: None
Create Date: 2026-04-14 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

revision: str = 'j9e0f1a2b3c4'
down_revision: Union[str, None] = 'i8d9e0f1a2b3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE export_status ADD VALUE IF NOT EXISTS 'aguardando_data_vistoria'")


def downgrade() -> None:
    pass
