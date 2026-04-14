"""Add ets column to export_records table

Revision ID: i8d9e0f1a2b3
Revises: h7c8d9e0f1a2
Branch Labels: None
Create Date: 2026-04-13 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'i8d9e0f1a2b3'
down_revision: Union[str, None] = 'h7c8d9e0f1a2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('export_records', sa.Column('ets', sa.Date(), nullable=True))


def downgrade() -> None:
    op.drop_column('export_records', 'ets')
