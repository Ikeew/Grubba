"""ports, new statuses, flags

Revision ID: b1c2d3e4f5a6
Revises: ad3851e08055
Create Date: 2026-04-09 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = 'b1c2d3e4f5a6'
down_revision: Union[str, None] = 'ad3851e08055'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- ports table ---
    op.create_table(
        'ports',
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.Column(
            'updated_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('now()'),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
    )
    op.create_index(op.f('ix_ports_name'), 'ports', ['name'], unique=True)

    # --- new export_status enum ---
    export_status = postgresql.ENUM(
        'in_progress', 'completed', 'cancelled',
        'protocolado', 'agendado_inspecao', 'aguardando_certificado',
        'deferido', 'embarcado_aguardando_documento', 'aguardando_autorizacao_lacre',
        name='export_status',
    )
    export_status.create(op.get_bind(), checkfirst=True)

    # --- new import_status enum ---
    import_status = postgresql.ENUM(
        'in_progress', 'completed', 'cancelled',
        'aguardando_chegada_navio', 'mapa_tfa', 'comex_solicitado',
        'faturamento_solicitado', 'agendamento',
        name='import_status',
    )
    import_status.create(op.get_bind(), checkfirst=True)

    # --- migrate export_records status column ---
    # First add a new column, populate it, then drop old
    op.add_column('export_records', sa.Column('status_new', sa.Enum(
        'in_progress', 'completed', 'cancelled',
        'protocolado', 'agendado_inspecao', 'aguardando_certificado',
        'deferido', 'embarcado_aguardando_documento', 'aguardando_autorizacao_lacre',
        name='export_status',
    ), nullable=True))
    op.execute(
        "UPDATE export_records SET status_new = CASE "
        "WHEN status::text = 'draft' THEN 'in_progress'::export_status "
        "WHEN status::text = 'in_progress' THEN 'in_progress'::export_status "
        "WHEN status::text = 'completed' THEN 'completed'::export_status "
        "WHEN status::text = 'cancelled' THEN 'cancelled'::export_status "
        "ELSE 'in_progress'::export_status END"
    )
    op.alter_column('export_records', 'status_new', nullable=False)
    op.drop_column('export_records', 'status')
    op.alter_column('export_records', 'status_new', new_column_name='status')

    # --- migrate import_records status column ---
    op.add_column('import_records', sa.Column('status_new', sa.Enum(
        'in_progress', 'completed', 'cancelled',
        'aguardando_chegada_navio', 'mapa_tfa', 'comex_solicitado',
        'faturamento_solicitado', 'agendamento',
        name='import_status',
    ), nullable=True))
    op.execute(
        "UPDATE import_records SET status_new = CASE "
        "WHEN status::text = 'draft' THEN 'in_progress'::import_status "
        "WHEN status::text = 'in_progress' THEN 'in_progress'::import_status "
        "WHEN status::text = 'completed' THEN 'completed'::import_status "
        "WHEN status::text = 'cancelled' THEN 'cancelled'::import_status "
        "ELSE 'in_progress'::import_status END"
    )
    op.alter_column('import_records', 'status_new', nullable=False)
    op.drop_column('import_records', 'status')
    op.alter_column('import_records', 'status_new', new_column_name='status')

    # Drop old shared record_status enum if no longer used
    op.execute("DROP TYPE IF EXISTS record_status")

    # --- add port_id FK to export_records ---
    op.add_column('export_records', sa.Column('port_id', sa.UUID(), nullable=True))
    # Migrate existing port text -> best-effort: leave NULL (no port table rows yet)
    op.create_foreign_key('fk_export_records_port_id', 'export_records', 'ports', ['port_id'], ['id'])

    # --- drop old port text column from export_records ---
    op.drop_column('export_records', 'port')

    # --- add port_id FK to import_records ---
    op.add_column('import_records', sa.Column('port_id', sa.UUID(), nullable=True))
    op.create_foreign_key('fk_import_records_port_id', 'import_records', 'ports', ['port_id'], ['id'])

    # --- drop old port text column from import_records ---
    op.drop_column('import_records', 'port')

    # --- flag junction tables ---
    op.create_table(
        'export_record_flags',
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('export_record_id', sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(['export_record_id'], ['export_records.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id', 'export_record_id'),
    )
    op.create_table(
        'import_record_flags',
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('import_record_id', sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(['import_record_id'], ['import_records.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id', 'import_record_id'),
    )


def downgrade() -> None:
    op.drop_table('import_record_flags')
    op.drop_table('export_record_flags')

    # Restore port text column on import_records
    op.drop_constraint('fk_import_records_port_id', 'import_records', type_='foreignkey')
    op.drop_column('import_records', 'port_id')
    op.add_column('import_records', sa.Column('port', sa.String(length=150), nullable=True))

    # Restore port text column on export_records
    op.drop_constraint('fk_export_records_port_id', 'export_records', type_='foreignkey')
    op.drop_column('export_records', 'port_id')
    op.add_column('export_records', sa.Column('port', sa.String(length=150), nullable=True))

    # Restore record_status enum
    op.execute("CREATE TYPE record_status AS ENUM ('draft', 'in_progress', 'completed', 'cancelled')")

    # Restore import status
    op.add_column('import_records', sa.Column('status_old', sa.Enum(
        'draft', 'in_progress', 'completed', 'cancelled', name='record_status'
    ), nullable=True))
    op.execute(
        "UPDATE import_records SET status_old = CASE "
        "WHEN status::text IN ('in_progress') THEN 'in_progress'::record_status "
        "WHEN status::text = 'completed' THEN 'completed'::record_status "
        "WHEN status::text = 'cancelled' THEN 'cancelled'::record_status "
        "ELSE 'in_progress'::record_status END"
    )
    op.alter_column('import_records', 'status_old', nullable=False)
    op.drop_column('import_records', 'status')
    op.alter_column('import_records', 'status_old', new_column_name='status')

    # Restore export status
    op.add_column('export_records', sa.Column('status_old', sa.Enum(
        'draft', 'in_progress', 'completed', 'cancelled', name='record_status'
    ), nullable=True))
    op.execute(
        "UPDATE export_records SET status_old = CASE "
        "WHEN status::text IN ('in_progress') THEN 'in_progress'::record_status "
        "WHEN status::text = 'completed' THEN 'completed'::record_status "
        "WHEN status::text = 'cancelled' THEN 'cancelled'::record_status "
        "ELSE 'in_progress'::record_status END"
    )
    op.alter_column('export_records', 'status_old', nullable=False)
    op.drop_column('export_records', 'status')
    op.alter_column('export_records', 'status_old', new_column_name='status')

    op.execute("DROP TYPE IF EXISTS import_status")
    op.execute("DROP TYPE IF EXISTS export_status")

    op.drop_index(op.f('ix_ports_name'), table_name='ports')
    op.drop_table('ports')
