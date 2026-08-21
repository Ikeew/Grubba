"""Add exporter field and manager role

Revision ID: 993b16d2c316
Revises: n3c4d5e6f7a8
Create Date: 2026-08-20 21:34:48.430338

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '993b16d2c316'
down_revision: Union[str, None] = 'n3c4d5e6f7a8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('export_records', sa.Column('exporter', sa.String(length=255), nullable=True))
    op.execute("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'manager'")


def downgrade() -> None:
    op.drop_column('export_records', 'exporter')
    # Postgres does not support removing enum values; manager role value is left in place.
