import { useNavigate, useParams } from 'react-router-dom'
import { useClient } from '@/hooks/useClients'
import { PageHeader } from '@/components/layout/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { formatDateTime } from '@/utils/format'

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">{value || '—'}</dd>
    </div>
  )
}

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: client, isLoading } = useClient(id!)

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>
  if (!client) return <p className="text-slate-500">Cliente não encontrado.</p>

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title={client.name}
        backTo="/clients"
        action={{ label: 'Editar', onClick: () => navigate(`/clients/${id}/edit`) }}
      />

      <div className="form-section">
        <p className="form-section-title">Dados principais</p>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
          <div className="col-span-2">
            <DetailRow label="Nome" value={client.name} />
          </div>
          <DetailRow label="CNPJ" value={client.cnpj} />
          <DetailRow label="Telefone" value={client.phone} />
          <div className="col-span-2">
            <DetailRow label="E-mail" value={client.email} />
          </div>
        </dl>
      </div>

      {(client.address || client.notes) && (
        <div className="form-section">
          <p className="form-section-title">Endereço e observações</p>
          <dl className="space-y-4">
            {client.address && <DetailRow label="Endereço" value={client.address} />}
            {client.notes && <DetailRow label="Observações" value={client.notes} />}
          </dl>
        </div>
      )}

      <div className="text-xs text-slate-400">
        Cadastrado em {formatDateTime(client.created_at)}
        {client.updated_at !== client.created_at && ` · Atualizado em ${formatDateTime(client.updated_at)}`}
      </div>
    </div>
  )
}
