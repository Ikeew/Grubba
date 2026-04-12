import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useImportList, useDeleteImport, useToggleImportFlag } from '@/hooks/useImports'
import { PageHeader } from '@/components/layout/PageHeader'
import { Pagination } from '@/components/shared/Pagination'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { formatDate } from '@/utils/format'
import { IMPORT_STATUS_LABELS, MODALITY_LABELS } from '@/utils/constants'
import type { ImportRecord } from '@/types/import'
import type { ImportStatus } from '@/types/common'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  ...Object.entries(IMPORT_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l })),
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
  const start = new Date(today.getFullYear(), today.getMonth(), 1)
  return { date_from: fmt(start), date_to: fmt(today) }
}

export default function ImportList() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<ImportStatus | ''>('')
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
  const toggleFlag = useToggleImportFlag()

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

  function isFlagged(record: ImportRecord) {
    return user ? record.flagged_by_ids.includes(user.id) : false
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
            onChange={(e) => { setStatus(e.target.value as ImportStatus | ''); setPage(1) }}
            className="w-56"
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
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-8"></th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Referência</th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente</th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Modal.</th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Data</th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Navio</th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ETB</th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Colaborador</th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Vistoria</th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-16">Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((record) => (
                <tr
                  key={record.id}
                  className={`table-row cursor-pointer ${isFlagged(record) ? 'bg-red-50 hover:bg-red-100' : ''}`}
                  onDoubleClick={() => navigate(`/imports/${record.id}`)}
                >
                  <td className="px-2 py-2 text-xs text-slate-700">
                    <button
                      type="button"
                      title={isFlagged(record) ? 'Remover bandeira' : 'Marcar como importante'}
                      onClick={() => toggleFlag.mutate(record.id)}
                      className="text-base leading-none focus:outline-none"
                    >
                      {isFlagged(record) ? '🚩' : <span className="text-slate-300 hover:text-red-400">⚑</span>}
                    </button>
                  </td>
                  <td className="px-2 py-2 text-xs text-slate-700 font-medium">{record.reference ?? '—'}</td>
                  <td className="px-2 py-2 text-xs text-slate-700">{record.client.name}</td>
                  <td className="px-2 py-2 text-xs text-slate-500">
                    {record.modality ? MODALITY_LABELS[record.modality] : '—'}
                  </td>
                  <td className="px-2 py-2 text-xs text-slate-500">{formatDate(record.date)}</td>
                  <td className="px-2 py-2 text-xs text-slate-500">{record.vessel ?? '—'}</td>
                  <td className="px-2 py-2 text-xs text-slate-500">{formatDate(record.etb)}</td>
                  <td className="px-2 py-2 text-xs text-slate-500">{record.collaborator?.full_name ?? '—'}</td>
                  <td className="px-2 py-2 text-xs text-slate-500">{formatDate(record.inspection_date)}</td>
                  <td className="px-2 py-2 text-xs text-slate-700"><StatusBadge status={record.status} /></td>
                  <td className="px-2 py-2 text-xs text-slate-700">
                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => setToDelete(record)}>
                      ×
                    </Button>
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
