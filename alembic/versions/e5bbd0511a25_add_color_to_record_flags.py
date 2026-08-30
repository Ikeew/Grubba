"""add color to record flags

Revision ID: e5bbd0511a25
Revises: 993b16d2c316
Create Date: 2026-08-30 18:48:30.510865

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e5bbd0511a25'
down_revision: Union[str, None] = '993b16d2c316'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'export_record_flags',
        sa.Column('color', sa.String(length=10), nullable=False, server_default='red'),
    )
    op.add_column(
        'import_record_flags',
        sa.Column('color', sa.String(length=10), nullable=False, server_default='red'),
    )


def downgrade() -> None:
    op.drop_column('import_record_flags', 'color')
    op.drop_column('export_record_flags', 'color')
