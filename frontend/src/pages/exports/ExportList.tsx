import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExportList, useDeleteExport } from '@/hooks/useExports'
import { PageHeader } from '@/components/layout/PageHeader'
import { Pagination } from '@/components/shared/Pagination'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { formatDate } from '@/utils/format'
import { STATUS_LABELS } from '@/utils/constants'
import type { ExportRecord } from '@/types/export'
import type { RecordStatus } from '@/types/common'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
]

export default function ExportList() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<RecordStatus | ''>('')
  const [toDelete, setToDelete] = useState<ExportRecord | null>(null)

  const { data, isLoading } = useExportList({
    page,
    page_size: 20,
    status: status || undefined,
  })
  const deleteExport = useDeleteExport()

  async function handleDelete() {
    if (!toDelete) return
    await deleteExport.mutateAsync(toDelete.id)
    setToDelete(null)
  }

  return (
    <div>
      <PageHeader
        title="Fichas de Exportação"
        action={{ label: 'Nova ficha', onClick: () => navigate('/exports/new') }}
      />

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex gap-3">
          <Select
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => { setStatus(e.target.value as RecordStatus | ''); setPage(1) }}
            className="w-48"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : !data?.items.length ? (
          <EmptyState />
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="table-header-cell">Referência</th>
                <th className="table-header-cell">Cliente</th>
                <th className="table-header-cell">Data</th>
                <th className="table-header-cell">Navio</th>
                <th className="table-header-cell">Porto</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell w-36">Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((record) => (
                <tr key={record.id} className="table-row">
                  <td className="table-cell font-medium">{record.reference ?? '—'}</td>
                  <td className="table-cell">{record.client.name}</td>
                  <td className="table-cell text-slate-500">{formatDate(record.date)}</td>
                  <td className="table-cell text-slate-500">{record.vessel ?? '—'}</td>
                  <td className="table-cell text-slate-500">{record.port ?? '—'}</td>
                  <td className="table-cell"><StatusBadge status={record.status} /></td>
                  <td className="table-cell">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/exports/${record.id}`)}>
                        Ver
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/exports/${record.id}/edit`)}>
                        Editar
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        className="text-red-500"
                        onClick={() => setToDelete(record)}
                      >
                        ×
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {data && (
          <Pagination page={data.page} pages={data.pages} total={data.total} onPageChange={setPage} />
        )}
      </div>

      {toDelete && (
        <ConfirmModal
          title="Remover ficha de exportação"
          description={`Remover a ficha "${toDelete.reference ?? toDelete.id}"?`}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
          loading={deleteExport.isPending}
        />
      )}
    </div>
  )
}
