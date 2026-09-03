"""Add deconsolidation records, files, flags and related FKs

Revision ID: o4d5e6f7a8b9
Revises: e5bbd0511a25
Branch Labels: None
Depends On: None

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = 'o4d5e6f7a8b9'
down_revision: Union[str, None] = 'e5bbd0511a25'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


deconsolidation_status = postgresql.ENUM(
    'aguardando_chegada_documento',
    'agendamento_apresentacao',
    'liberacao_realizada',
    'completed',
    'cancelled',
    name='deconsolidation_status',
    create_type=False,
)

deconsolidation_modality = postgresql.ENUM(
    'importacao',
    'exportacao',
    name='deconsolidation_modality',
    create_type=False,
)


def upgrade() -> None:
    bind = op.get_bind()
    deconsolidation_status.create(bind, checkfirst=True)
    deconsolidation_modality.create(bind, checkfirst=True)

    op.execute("ALTER TYPE record_type ADD VALUE IF NOT EXISTS 'deconsolidation'")

    op.create_table(
        'deconsolidation_records',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('client_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('collaborator_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('reference', sa.String(length=100), nullable=True),
        sa.Column('date', sa.Date(), nullable=True),
        sa.Column('status', deconsolidation_status, nullable=False),
        sa.Column('modality', deconsolidation_modality, nullable=True),
        sa.Column('consignee', sa.String(length=255), nullable=True),
        sa.Column('ce_mercante', sa.String(length=100), nullable=True),
        sa.Column('master_bl', sa.String(length=100), nullable=True),
        sa.Column('house_bl', sa.String(length=100), nullable=True),
        sa.Column('agency', sa.String(length=255), nullable=True),
        sa.Column('shipping_company', sa.String(length=150), nullable=True),
        sa.Column('observations', sa.Text(), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('billing_completed', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id']),
        sa.ForeignKeyConstraint(['collaborator_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_deconsolidation_records_client_id'),
        'deconsolidation_records', ['client_id'], unique=False,
    )
    op.create_index(
        op.f('ix_deconsolidation_records_reference'),
        'deconsolidation_records', ['reference'], unique=False,
    )

    op.create_table(
        'deconsolidation_record_flags',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('deconsolidation_record_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('color', sa.String(length=10), nullable=False, server_default='red'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(
            ['deconsolidation_record_id'], ['deconsolidation_records.id'], ondelete='CASCADE'
        ),
        sa.PrimaryKeyConstraint('user_id', 'deconsolidation_record_id'),
    )

    op.create_table(
        'deconsolidation_files',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('deconsolidation_record_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('uploaded_by_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('original_filename', sa.String(length=255), nullable=False),
        sa.Column('stored_filename', sa.String(length=255), nullable=False),
        sa.Column('file_path', sa.String(length=512), nullable=False),
        sa.Column('file_size', sa.BigInteger(), nullable=False),
        sa.Column('content_type', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['deconsolidation_record_id'], ['deconsolidation_records.id']),
        sa.ForeignKeyConstraint(['uploaded_by_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('stored_filename'),
    )
    op.create_index(
        op.f('ix_deconsolidation_files_deconsolidation_record_id'),
        'deconsolidation_files', ['deconsolidation_record_id'], unique=False,
    )

    op.add_column(
        'notes',
        sa.Column('deconsolidation_record_id', postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_index(
        op.f('ix_notes_deconsolidation_record_id'),
        'notes', ['deconsolidation_record_id'], unique=False,
    )
    op.create_foreign_key(
        'fk_notes_deconsolidation_record_id',
        'notes', 'deconsolidation_records', ['deconsolidation_record_id'], ['id'],
    )

    op.add_column(
        'update_history',
        sa.Column('deconsolidation_record_id', postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_index(
        op.f('ix_update_history_deconsolidation_record_id'),
        'update_history', ['deconsolidation_record_id'], unique=False,
    )
    op.create_foreign_key(
        'fk_update_history_deconsolidation_record_id',
        'update_history', 'deconsolidation_records', ['deconsolidation_record_id'], ['id'],
    )


def downgrade() -> None:
    op.drop_constraint(
        'fk_update_history_deconsolidation_record_id', 'update_history', type_='foreignkey'
    )
    op.drop_index(
        op.f('ix_update_history_deconsolidation_record_id'), table_name='update_history'
    )
    op.drop_column('update_history', 'deconsolidation_record_id')

    op.drop_constraint('fk_notes_deconsolidation_record_id', 'notes', type_='foreignkey')
    op.drop_index(op.f('ix_notes_deconsolidation_record_id'), table_name='notes')
    op.drop_column('notes', 'deconsolidation_record_id')

    op.drop_index(
        op.f('ix_deconsolidation_files_deconsolidation_record_id'),
        table_name='deconsolidation_files',
    )
    op.drop_table('deconsolidation_files')
    op.drop_table('deconsolidation_record_flags')
    op.drop_index(
        op.f('ix_deconsolidation_records_reference'), table_name='deconsolidation_records'
    )
    op.drop_index(
        op.f('ix_deconsolidation_records_client_id'), table_name='deconsolidation_records'
    )
    op.drop_table('deconsolidation_records')

    bind = op.get_bind()
    deconsolidation_modality.drop(bind, checkfirst=True)
    deconsolidation_status.drop(bind, checkfirst=True)
