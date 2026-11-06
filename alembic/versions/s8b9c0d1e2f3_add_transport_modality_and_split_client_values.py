"""Add transport modality to records/receipt items and split client values by modality

Revision ID: s8b9c0d1e2f3
Revises: r7a8b9c0d1e2
Branch Labels: None
Depends On: None

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = 's8b9c0d1e2f3'
down_revision: Union[str, None] = 'r7a8b9c0d1e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

CLIENT_VALUE_COLUMNS = ('valor_padrao_importacao', 'valor_padrao_exportacao', 'valor_padrao_desconsolidacao')

# O tipo "modality" já existe no Postgres (criado com import_records)
MODALITY = postgresql.ENUM('maritimo', 'aereo', name='modality', create_type=False)


def upgrade() -> None:
    # Os valores atuais passam a ser os de Marítimo; Aéreo começa em branco
    for col in CLIENT_VALUE_COLUMNS:
        op.alter_column('clients', col, new_column_name=f'{col}_maritimo')
        op.add_column('clients', sa.Column(f'{col}_aereo', sa.Numeric(12, 2), nullable=True))

    # Fichas existentes de exportação e desconsolidação são marítimas
    op.add_column('export_records', sa.Column('modality', MODALITY, nullable=True))
    op.execute("UPDATE export_records SET modality = 'maritimo'")

    op.add_column('deconsolidation_records', sa.Column('transport_modality', MODALITY, nullable=True))
    op.execute("UPDATE deconsolidation_records SET transport_modality = 'maritimo'")

    # Itens de recibos já emitidos ficam NULL e continuam impressos como antes
    op.add_column('receipt_items', sa.Column('transport_modality', sa.String(20), nullable=True))


def downgrade() -> None:
    op.drop_column('receipt_items', 'transport_modality')
    op.drop_column('deconsolidation_records', 'transport_modality')
    op.drop_column('export_records', 'modality')

    for col in CLIENT_VALUE_COLUMNS:
        op.drop_column('clients', f'{col}_aereo')
        op.alter_column('clients', f'{col}_maritimo', new_column_name=col)
