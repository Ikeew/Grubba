"""Add deconsolidation status aguardando_liberacao

Revision ID: p5e6f7a8b9c0
Revises: o4d5e6f7a8b9
Branch Labels: None
Depends On: None

"""
from typing import Sequence, Union

from alembic import op

revision: str = 'p5e6f7a8b9c0'
down_revision: Union[str, None] = 'o4d5e6f7a8b9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE deconsolidation_status ADD VALUE IF NOT EXISTS 'aguardando_liberacao'")


def downgrade() -> None:
    pass
