"""Add services array to deconsolidation records

Revision ID: q6f7a8b9c0d1
Revises: p5e6f7a8b9c0
Branch Labels: None
Depends On: None

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = 'q6f7a8b9c0d1'
down_revision: Union[str, None] = 'p5e6f7a8b9c0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'deconsolidation_records',
        sa.Column(
            'services',
            postgresql.ARRAY(sa.String()),
            nullable=False,
            server_default='{}',
        ),
    )


def downgrade() -> None:
    op.drop_column('deconsolidation_records', 'services')
