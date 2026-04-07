import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClientList, useDeleteClient } from '@/hooks/useClients'
import { PageHeader } from '@/components/layout/PageHeader'
import { SearchInput } from '@/components/shared/SearchInput'
import { Pagination } from '@/components/shared/Pagination'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import type { Client } from '@/types/client'

export default function ClientList() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [toDelete, setToDelete] = useState<Client | null>(null)

  const { data, isLoading } = useClientList({ page, page_size: 20, search: search || undefined })
  const deleteClient = useDeleteClient()

  async function handleDelete() {
    if (!toDelete) return
    await deleteClient.mutateAsync(toDelete.id)
    setToDelete(null)
  }

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Gerenciamento de clientes cadastrados"
        action={{ label: 'Novo cliente', onClick: () => navigate('/clients/new') }}
      />

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nome, CNPJ ou e-mail" />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : !data?.items.length ? (
          <EmptyState />
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="table-header-cell">Nome</th>
                <th className="table-header-cell">CNPJ</th>
                <th className="table-header-cell">E-mail</th>
                <th className="table-header-cell">Telefone</th>
                <th className="table-header-cell w-32">Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((client) => (
                <tr
                  key={client.id}
                  className="table-row cursor-pointer"
                  onDoubleClick={() => navigate(`/clients/${client.id}`)}
                >
                  <td className="table-cell font-medium">{client.name}</td>
                  <td className="table-cell text-slate-500">{client.cnpj ?? '—'}</td>
                  <td className="table-cell text-slate-500">{client.email ?? '—'}</td>
                  <td className="table-cell text-slate-500">{client.phone ?? '—'}</td>
                  <td className="table-cell">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => setToDelete(client)}
                    >
                      Remover
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {data && (
          <Pagination
            page={data.page}
            pages={data.pages}
            total={data.total}
            onPageChange={setPage}
          />
        )}
      </div>

      {toDelete && (
        <ConfirmModal
          title="Remover cliente"
          description={`Deseja desativar o cliente "${toDelete.name}"?`}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
          loading={deleteClient.isPending}
        />
      )}
    </div>
  )
}
