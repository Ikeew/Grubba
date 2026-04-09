"""add aguardando_chegada_navio to export_status enum

Revision ID: e4f5a6b7c8d9
Revises: c2d3e4f5a6b7
Branch Labels: None
Depends On: None

"""
from typing import Sequence, Union

from alembic import op

revision: str = 'e4f5a6b7c8d9'
down_revision: Union[str, None] = 'd3e4f5a6b7c8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # PostgreSQL requires ALTER TYPE outside a transaction to add enum values
    op.execute("ALTER TYPE export_status ADD VALUE IF NOT EXISTS 'aguardando_chegada_navio'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values; downgrade is a no-op
    pass
