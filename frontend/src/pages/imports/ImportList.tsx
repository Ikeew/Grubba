import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useImportList, useDeleteImport } from '@/hooks/useImports'
import { PageHeader } from '@/components/layout/PageHeader'
import { Pagination } from '@/components/shared/Pagination'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { formatDate } from '@/utils/format'
import { STATUS_LABELS, MODALITY_LABELS } from '@/utils/constants'
import type { ImportRecord } from '@/types/import'
import type { RecordStatus } from '@/types/common'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  ...Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l })),
]

type Period = 'today' | 'week' | 'month' | ''

function getPeriodDates(period: Period): { date_from?: string; date_to?: string } {
  if (!period) return {}
  const today = new Date()
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  if (period === 'today') {
    const s = fmt(today)
    return { date_from: s, date_to: s }
  }
  if (period === 'week') {
    const day = today.getDay() === 0 ? 6 : today.getDay() - 1
    const mon = new Date(today)
    mon.setDate(today.getDate() - day)
    return { date_from: fmt(mon), date_to: fmt(today) }
  }
  // month
  const start = new Date(today.getFullYear(), today.getMonth(), 1)
  return { date_from: fmt(start), date_to: fmt(today) }
}

export default function ImportList() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<RecordStatus | ''>('')
  const [period, setPeriod] = useState<Period>('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [toDelete, setToDelete] = useState<ImportRecord | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchInput])

  const { date_from, date_to } = getPeriodDates(period)

  const { data, isLoading } = useImportList({
    page,
    page_size: 20,
    status: status || undefined,
    search: search || undefined,
    date_from,
    date_to,
  })
  const deleteImport = useDeleteImport()

  async function handleDelete() {
    if (!toDelete) return
    await deleteImport.mutateAsync(toDelete.id)
    setToDelete(null)
  }

  function handlePeriod(p: Period) {
    setPeriod((prev) => (prev === p ? '' : p))
    setPage(1)
  }

  const PERIOD_LABELS: Record<Exclude<Period, ''>, string> = {
    today: 'Hoje',
    week: 'Esta semana',
    month: 'Este mês',
  }

  return (
    <div>
      <PageHeader
        title="Fichas de Importação"
        action={{ label: 'Nova ficha', onClick: () => navigate('/imports/new') }}
      />

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Buscar por cliente ou referência..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 w-64"
          />
          <Select
            options={STATUS_OPTIONS}
            value={status}
            onChange={(e) => { setStatus(e.target.value as RecordStatus | ''); setPage(1) }}
            className="w-48"
          />
          <div className="flex gap-1">
            {(['today', 'week', 'month'] as Exclude<Period, ''>[]).map((p) => (
              <button
                key={p}
                onClick={() => handlePeriod(p)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
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
                <th className="table-header-cell">Modalidade</th>
                <th className="table-header-cell">Data</th>
                <th className="table-header-cell">Navio</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell w-36">Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((record) => (
                <tr key={record.id} className="table-row">
                  <td className="table-cell font-medium">{record.reference ?? '—'}</td>
                  <td className="table-cell">{record.client.name}</td>
                  <td className="table-cell text-slate-500">
                    {record.modality ? MODALITY_LABELS[record.modality] : '—'}
                  </td>
                  <td className="table-cell text-slate-500">{formatDate(record.date)}</td>
                  <td className="table-cell text-slate-500">{record.vessel ?? '—'}</td>
                  <td className="table-cell"><StatusBadge status={record.status} /></td>
                  <td className="table-cell">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/imports/${record.id}`)}>
                        Ver
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/imports/${record.id}/edit`)}>
                        Editar
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-500" onClick={() => setToDelete(record)}>
                        ×
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {data && <Pagination page={data.page} pages={data.pages} total={data.total} onPageChange={setPage} />}
      </div>

      {toDelete && (
        <ConfirmModal
          title="Remover ficha de importação"
          description={`Remover a ficha "${toDelete.reference ?? toDelete.id}"?`}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
          loading={deleteImport.isPending}
        />
      )}
    </div>
  )
}
