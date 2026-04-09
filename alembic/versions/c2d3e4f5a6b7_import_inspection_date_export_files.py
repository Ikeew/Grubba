"""import inspection_date, export_files table

Revision ID: c2d3e4f5a6b7
Revises: b1c2d3e4f5a6
Create Date: 2026-04-09 01:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'c2d3e4f5a6b7'
down_revision: Union[str, None] = 'b1c2d3e4f5a6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add inspection_date to import_records
    op.add_column('import_records', sa.Column('inspection_date', sa.Date(), nullable=True))

    # Create export_files table
    op.create_table(
        'export_files',
        sa.Column('export_record_id', sa.UUID(), nullable=False),
        sa.Column('uploaded_by_id', sa.UUID(), nullable=True),
        sa.Column('original_filename', sa.String(length=255), nullable=False),
        sa.Column('stored_filename', sa.String(length=255), nullable=False),
        sa.Column('file_path', sa.String(length=512), nullable=False),
        sa.Column('file_size', sa.BigInteger(), nullable=False),
        sa.Column('content_type', sa.String(length=100), nullable=True),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['export_record_id'], ['export_records.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['uploaded_by_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('stored_filename'),
    )
    op.create_index(op.f('ix_export_files_export_record_id'), 'export_files', ['export_record_id'])


def downgrade() -> None:
    op.drop_index(op.f('ix_export_files_export_record_id'), table_name='export_files')
    op.drop_table('export_files')
    op.drop_column('import_records', 'inspection_date')
