"""Add import status dsa_registrada

Revision ID: l1a2b3c4d5e6
Revises: k0f1a2b3c4d5
Branch Labels: None
Depends On: None

"""
from typing import Sequence, Union

from alembic import op

revision: str = 'l1a2b3c4d5e6'
down_revision: Union[str, None] = 'k0f1a2b3c4d5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE import_status ADD VALUE IF NOT EXISTS 'dsa_registrada'")


def downgrade() -> None:
    pass
