"""Add import status protocolado

Revision ID: n3c4d5e6f7a8
Revises: m2b3c4d5e6f7
Branch Labels: None
Depends On: None

"""
from typing import Sequence, Union

from alembic import op

revision: str = 'n3c4d5e6f7a8'
down_revision: Union[str, None] = 'm2b3c4d5e6f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE import_status ADD VALUE IF NOT EXISTS 'protocolado'")


def downgrade() -> None:
    pass
