"""Add receipts (recibos) and client default service values

Revision ID: r7a8b9c0d1e2
Revises: q6f7a8b9c0d1
Branch Labels: None
Depends On: None

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = 'r7a8b9c0d1e2'
down_revision: Union[str, None] = 'q6f7a8b9c0d1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

RECORD_TABLES = ('import_records', 'export_records', 'deconsolidation_records')


def upgrade() -> None:
    # --- Valores padrão no cliente ---
    for col in ('valor_padrao_importacao', 'valor_padrao_exportacao', 'valor_padrao_desconsolidacao'):
        op.add_column('clients', sa.Column(col, sa.Numeric(12, 2), nullable=True))

    # --- Recibos ---
    op.create_table(
        'receipts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('sequence', sa.Integer(), nullable=False),
        sa.Column('number', sa.String(20), nullable=False),
        sa.Column('client_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('clients.id'), nullable=False),
        sa.Column('issue_date', sa.Date(), nullable=False),
        sa.Column('subtotal', sa.Numeric(12, 2), nullable=False),
        sa.Column('extras_total', sa.Numeric(12, 2), nullable=False),
        sa.Column('total', sa.Numeric(12, 2), nullable=False),
        sa.Column('client_name', sa.String(255), nullable=False),
        sa.Column('client_cnpj', sa.String(18), nullable=True),
        sa.Column('client_email', sa.String(255), nullable=True),
        sa.Column('client_fields', sa.JSON(), nullable=False),
        sa.Column('client_snapshot', sa.JSON(), nullable=False),
        sa.Column('record_fields', sa.JSON(), nullable=False),
        sa.Column('created_by_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('is_cancelled', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('cancelled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('cancelled_by_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('sequence', name='uq_receipts_sequence'),
    )
    op.create_index('ix_receipts_number', 'receipts', ['number'], unique=True)
    op.create_index('ix_receipts_client_id', 'receipts', ['client_id'])

    op.create_table(
        'receipt_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            'receipt_id', postgresql.UUID(as_uuid=True),
            sa.ForeignKey('receipts.id', ondelete='CASCADE'), nullable=False,
        ),
        sa.Column('record_type', sa.String(20), nullable=False),
        sa.Column(
            'import_record_id', postgresql.UUID(as_uuid=True),
            sa.ForeignKey('import_records.id', ondelete='SET NULL'), nullable=True,
        ),
        sa.Column(
            'export_record_id', postgresql.UUID(as_uuid=True),
            sa.ForeignKey('export_records.id', ondelete='SET NULL'), nullable=True,
        ),
        sa.Column(
            'deconsolidation_record_id', postgresql.UUID(as_uuid=True),
            sa.ForeignKey('deconsolidation_records.id', ondelete='SET NULL'), nullable=True,
        ),
        sa.Column('reference', sa.String(100), nullable=True),
        sa.Column('amount', sa.Numeric(12, 2), nullable=False),
        sa.Column('snapshot', sa.JSON(), nullable=False),
        sa.Column('position', sa.Integer(), nullable=False, server_default='0'),
        sa.CheckConstraint(
            "(CASE WHEN import_record_id IS NOT NULL THEN 1 ELSE 0 END"
            " + CASE WHEN export_record_id IS NOT NULL THEN 1 ELSE 0 END"
            " + CASE WHEN deconsolidation_record_id IS NOT NULL THEN 1 ELSE 0 END) <= 1",
            name='ck_receipt_items_single_record',
        ),
    )
    op.create_index('ix_receipt_items_receipt_id', 'receipt_items', ['receipt_id'])
    op.create_index('ix_receipt_items_import_record_id', 'receipt_items', ['import_record_id'])
    op.create_index('ix_receipt_items_export_record_id', 'receipt_items', ['export_record_id'])
    op.create_index('ix_receipt_items_deconsolidation_record_id', 'receipt_items', ['deconsolidation_record_id'])

    op.create_table(
        'receipt_extra_costs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            'receipt_id', postgresql.UUID(as_uuid=True),
            sa.ForeignKey('receipts.id', ondelete='CASCADE'), nullable=False,
        ),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('amount', sa.Numeric(12, 2), nullable=False),
        sa.Column('position', sa.Integer(), nullable=False, server_default='0'),
    )
    op.create_index('ix_receipt_extra_costs_receipt_id', 'receipt_extra_costs', ['receipt_id'])

    # --- Marca de "recibo gerado" nas fichas ---
    for table in RECORD_TABLES:
        op.add_column(
            table,
            sa.Column(
                'receipt_id', postgresql.UUID(as_uuid=True),
                sa.ForeignKey('receipts.id', ondelete='SET NULL', name=f'fk_{table}_receipt_id'),
                nullable=True,
            ),
        )
        op.create_index(f'ix_{table}_receipt_id', table, ['receipt_id'])


def downgrade() -> None:
    for table in RECORD_TABLES:
        op.drop_index(f'ix_{table}_receipt_id', table_name=table)
        op.drop_constraint(f'fk_{table}_receipt_id', table, type_='foreignkey')
        op.drop_column(table, 'receipt_id')

    op.drop_index('ix_receipt_extra_costs_receipt_id', table_name='receipt_extra_costs')
    op.drop_table('receipt_extra_costs')
    op.drop_index('ix_receipt_items_deconsolidation_record_id', table_name='receipt_items')
    op.drop_index('ix_receipt_items_export_record_id', table_name='receipt_items')
    op.drop_index('ix_receipt_items_import_record_id', table_name='receipt_items')
    op.drop_index('ix_receipt_items_receipt_id', table_name='receipt_items')
    op.drop_table('receipt_items')
    op.drop_index('ix_receipts_client_id', table_name='receipts')
    op.drop_index('ix_receipts_number', table_name='receipts')
    op.drop_table('receipts')

    for col in ('valor_padrao_importacao', 'valor_padrao_exportacao', 'valor_padrao_desconsolidacao'):
        op.drop_column('clients', col)
