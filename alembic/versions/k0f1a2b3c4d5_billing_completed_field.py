"""Add billing_completed to import_records and export_records

Revision ID: k0f1a2b3c4d5
Revises: j9e0f1a2b3c4
Branch Labels: None
Create Date: 2026-04-14 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'k0f1a2b3c4d5'
down_revision: Union[str, None] = 'j9e0f1a2b3c4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('export_records', sa.Column('billing_completed', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('import_records', sa.Column('billing_completed', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    op.drop_column('export_records', 'billing_completed')
    op.drop_column('import_records', 'billing_completed')
