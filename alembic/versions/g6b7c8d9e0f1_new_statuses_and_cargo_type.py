"""Add new statuses (aguardando_data_vistoria, aguardando_mais_informacoes) and cargo_type column

Revision ID: g6b7c8d9e0f1
Revises: f5a6b7c8d9e0
Create Date: 2026-04-12 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'g6b7c8d9e0f1'
down_revision: Union[str, None] = 'f5a6b7c8d9e0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new values to import_status enum
    op.execute("ALTER TYPE import_status ADD VALUE IF NOT EXISTS 'aguardando_data_vistoria'")
    op.execute("ALTER TYPE import_status ADD VALUE IF NOT EXISTS 'aguardando_mais_informacoes'")

    # Add new value to export_status enum
    op.execute("ALTER TYPE export_status ADD VALUE IF NOT EXISTS 'aguardando_mais_informacoes'")

    # Add cargo_type column to import_records
    op.add_column('import_records', sa.Column('cargo_type', sa.String(10), nullable=True))

    # Add cargo_type column to export_records
    op.add_column('export_records', sa.Column('cargo_type', sa.String(10), nullable=True))


def downgrade() -> None:
    # Remove cargo_type columns (enum values cannot be removed in PostgreSQL)
    op.drop_column('import_records', 'cargo_type')
    op.drop_column('export_records', 'cargo_type')
