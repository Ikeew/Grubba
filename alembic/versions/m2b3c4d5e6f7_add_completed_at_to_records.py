"""Add completed_at to export_records and import_records

Revision ID: m2b3c4d5e6f7
Revises: l1a2b3c4d5e6
Branch Labels: None
Depends On: None

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'm2b3c4d5e6f7'
down_revision: Union[str, None] = 'l1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('export_records', sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('import_records', sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('export_records', 'completed_at')
    op.drop_column('import_records', 'completed_at')
