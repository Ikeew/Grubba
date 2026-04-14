import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useExportList, useDeleteExport, useToggleExportFlag } from '@/hooks/useExports'
import { useUserList } from '@/hooks/useUsers'
import { PageHeader } from '@/components/layout/PageHeader'
import { Pagination } from '@/components/shared/Pagination'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { formatDate } from '@/utils/format'
import { EXPORT_STATUS_LABELS } from '@/utils/constants'
import type { ExportRecord } from '@/types/export'
import type { ExportStatus } from '@/types/common'

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  ...Object.entries(EXPORT_STATUS_LABELS).map(([value, label]) => ({ value, label })),
]

type Period = 'today' | 'week' | 'month'

const PERIOD_LABELS: Record<Period, string> = {
  today: 'Hoje',
  week: 'Esta semana',
  month: 'Este mês',
}

function getPeriodDates(period: Period): { date_from: string; date_to: string } {
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

export default function ExportList() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<ExportStatus | ''>('')
  const [collaboratorId, setCollaboratorId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [etsFrom, setEtsFrom] = useState('')
  const [etsTo, setEtsTo] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [toDelete, setToDelete] = useState<ExportRecord | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchInput])

  const { data: users } = useUserList(isAdmin)
  const collaboratorOptions = [
    { value: '', label: 'Todos os colaboradores' },
    ...(users?.items ?? []).map((u) => ({ value: u.id, label: u.full_name })),
  ]

  const { data, isLoading } = useExportList({
    page,
    page_size: 20,
    status: status || undefined,
    collaborator_id: collaboratorId || undefined,
    search: search || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    ets_from: etsFrom || undefined,
    ets_to: etsTo || undefined,
  })

  const deleteExport = useDeleteExport()
  const toggleFlag = useToggleExportFlag()

  const hasFilters = !!(status || collaboratorId || dateFrom || dateTo || etsFrom || etsTo || search)

  function applyPeriod(p: Period) {
    const { date_from, date_to } = getPeriodDates(p)
    setDateFrom(date_from)
    setDateTo(date_to)
    setPage(1)
  }

  function clearFilters() {
    setStatus('')
    setCollaboratorId('')
    setDateFrom('')
    setDateTo('')
    setEtsFrom('')
    setEtsTo('')
    setSearchInput('')
    setSearch('')
    setPage(1)
  }

  async function handleDelete() {
    if (!toDelete) return
    await deleteExport.mutateAsync(toDelete.id)
    setToDelete(null)
  }

  function isFlagged(record: ExportRecord) {
    return user ? record.flagged_by_ids.includes(user.id) : false
  }

  return (
    <div>
      <PageHeader
        title="Fichas de Exportação"
        action={{ label: 'Nova ficha', onClick: () => navigate('/exports/new') }}
      />

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {/* Filter bar */}
        <div className="px-4 py-3 border-b border-slate-200 space-y-2">
          {/* Row 1: search + status + collaborator */}
          <div className="flex flex-wrap gap-2 items-center">
            <input
              type="text"
              placeholder="Buscar por cliente ou referência..."
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value) }}
              className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 w-64"
            />
            <Select
              options={STATUS_OPTIONS}
              value={status}
              onChange={(e) => { setStatus(e.target.value as ExportStatus | ''); setPage(1) }}
              className="w-52"
            />
            {isAdmin && (
              <Select
                options={collaboratorOptions}
                value={collaboratorId}
                onChange={(e) => { setCollaboratorId(e.target.value); setPage(1) }}
                className="w-52"
              />
            )}
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 rounded-md text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Limpar filtros
              </button>
            )}
          </div>

          {/* Row 2: date range + period shortcuts + ETB range */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 whitespace-nowrap">Data:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
                className="border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
              <span className="text-slate-400 text-xs">–</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
                className="border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>

            <div className="flex gap-1">
              {(['today', 'week', 'month'] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => applyPeriod(p)}
                  className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 whitespace-nowrap">ETS:</span>
              <input
                type="date"
                value={etsFrom}
                onChange={(e) => { setEtsFrom(e.target.value); setPage(1) }}
                className="border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
              <span className="text-slate-400 text-xs">–</span>
              <input
                type="date"
                value={etsTo}
                onChange={(e) => { setEtsTo(e.target.value); setPage(1) }}
                className="border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
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
                <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Data</th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Navio</th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Porto</th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ETS</th>
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
                  onDoubleClick={() => navigate(`/exports/${record.id}`)}
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
                  <td className="px-2 py-2 text-xs text-slate-500">{formatDate(record.date)}</td>
                  <td className="px-2 py-2 text-xs text-slate-500">{record.vessel ?? '—'}</td>
                  <td className="px-2 py-2 text-xs text-slate-500">{record.port?.name ?? '—'}</td>
                  <td className="px-2 py-2 text-xs text-slate-500">{formatDate(record.ets)}</td>
                  <td className="px-2 py-2 text-xs text-slate-500">{record.collaborator?.full_name ?? '—'}</td>
                  <td className="px-2 py-2 text-xs text-slate-500">{formatDate(record.inspection_date)}</td>
                  <td className="px-2 py-2 text-xs text-slate-700"><StatusBadge status={record.status} /></td>
                  <td className="px-2 py-2 text-xs text-slate-700">
                    <Button
                      size="sm" variant="ghost"
                      className="text-red-500"
                      onClick={() => setToDelete(record)}
                    >
                      ×
                    </Button>
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
