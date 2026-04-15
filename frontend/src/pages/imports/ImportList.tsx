import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useImportList, useDeleteImport, useToggleImportFlag, useUpdateImportField } from '@/hooks/useImports'
import { useUserList } from '@/hooks/useUsers'
import { PageHeader } from '@/components/layout/PageHeader'
import { Pagination } from '@/components/shared/Pagination'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { StatusMultiSelect } from '@/components/ui/StatusMultiSelect'
import { Spinner } from '@/components/ui/Spinner'
import { formatDate } from '@/utils/format'
import { IMPORT_STATUS_LABELS, MODALITY_LABELS } from '@/utils/constants'
import type { ImportRecord } from '@/types/import'
import type { ImportStatus } from '@/types/common'

// Options shown in the filter bar (no completed/cancelled — those are billing-only)
const FILTERABLE_STATUS_OPTIONS = Object.entries(IMPORT_STATUS_LABELS)
  .filter(([value]) => value !== 'completed' && value !== 'cancelled')
  .map(([value, label]) => ({ value, label }))

// All options available when changing status inline on a row
const ALL_STATUS_OPTIONS = Object.entries(IMPORT_STATUS_LABELS).map(([value, label]) => ({ value, label }))

const DEFAULT_STATUSES: ImportStatus[] = (Object.keys(IMPORT_STATUS_LABELS) as ImportStatus[]).filter(
  (s) => s !== 'completed' && s !== 'cancelled',
)

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

export default function ImportList() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [page, setPage] = useState(1)
  const [statuses, setStatuses] = useState<ImportStatus[]>(DEFAULT_STATUSES)
  const [collaboratorId, setCollaboratorId] = useState(user?.id ?? '')
  const [vesselInput, setVesselInput] = useState('')
  const [vessel, setVessel] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [etbFrom, setEtbFrom] = useState('')
  const [etbTo, setEtbTo] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [toDelete, setToDelete] = useState<ImportRecord | null>(null)

  // Inline editing state
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null)
  const [editingDateId, setEditingDateId] = useState<string | null>(null)
  const statusDropdownRef = useRef<HTMLDivElement>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const vesselDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { setSearch(searchInput); setPage(1) }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchInput])

  useEffect(() => {
    if (vesselDebounceRef.current) clearTimeout(vesselDebounceRef.current)
    vesselDebounceRef.current = setTimeout(() => { setVessel(vesselInput); setPage(1) }, 350)
    return () => { if (vesselDebounceRef.current) clearTimeout(vesselDebounceRef.current) }
  }, [vesselInput])

  // Close status dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setEditingStatusId(null)
      }
    }
    if (editingStatusId) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [editingStatusId])

  const { data: users } = useUserList()
  const collaboratorOptions = [
    { value: '', label: 'Todos os colaboradores' },
    ...(users?.items ?? []).map((u) => ({ value: u.id, label: u.full_name })),
  ]

  const { data, isLoading } = useImportList({
    page,
    page_size: 20,
    status: statuses.length > 0 ? statuses : undefined,
    collaborator_id: collaboratorId || undefined,
    search: search || undefined,
    vessel: vessel || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    etb_from: etbFrom || undefined,
    etb_to: etbTo || undefined,
  })

  const deleteImport = useDeleteImport()
  const toggleFlag = useToggleImportFlag()
  const updateField = useUpdateImportField()

  const isDefaultState =
    statuses.length === DEFAULT_STATUSES.length &&
    DEFAULT_STATUSES.every((s) => statuses.includes(s)) &&
    collaboratorId === (user?.id ?? '') &&
    !dateFrom && !dateTo && !etbFrom && !etbTo && !searchInput && !vesselInput

  const hasFilters = !isDefaultState

  function applyPeriod(p: Period) {
    const { date_from, date_to } = getPeriodDates(p)
    setDateFrom(date_from)
    setDateTo(date_to)
    setPage(1)
  }

  function clearFilters() {
    setStatuses(DEFAULT_STATUSES)
    setCollaboratorId(user?.id ?? '')
    setDateFrom('')
    setDateTo('')
    setEtbFrom('')
    setEtbTo('')
    setSearchInput('')
    setSearch('')
    setVesselInput('')
    setVessel('')
    setPage(1)
  }

  async function handleDelete() {
    if (!toDelete) return
    await deleteImport.mutateAsync(toDelete.id)
    setToDelete(null)
  }

  function isFlagged(record: ImportRecord) {
    return user ? record.flagged_by_ids.includes(user.id) : false
  }

  function handleStatusChange(recordId: string, newStatus: ImportStatus) {
    updateField.mutate({ id: recordId, payload: { status: newStatus } })
    setEditingStatusId(null)
  }

  function handleDateBlur(record: ImportRecord, value: string) {
    const current = record.inspection_date ?? ''
    if (value !== current) {
      updateField.mutate({ id: record.id, payload: { inspection_date: value || undefined } })
    }
    setEditingDateId(null)
  }

  return (
    <div>
      <PageHeader
        title="Fichas de Importação"
        action={{ label: 'Nova ficha', onClick: () => navigate('/imports/new') }}
      />

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {/* Filter bar */}
        <div className="px-4 py-3 border-b border-slate-200 space-y-2">
          {/* Row 1: search + vessel + status multi-select + collaborator */}
          <div className="flex flex-wrap gap-2 items-center">
            <input
              type="text"
              placeholder="Buscar por cliente ou referência..."
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value) }}
              className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 w-64"
            />
            <input
              type="text"
              placeholder="Filtrar por navio..."
              value={vesselInput}
              onChange={(e) => { setVesselInput(e.target.value) }}
              className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 w-44"
            />
            <StatusMultiSelect
              options={FILTERABLE_STATUS_OPTIONS}
              value={statuses}
              onChange={(v) => { setStatuses(v as ImportStatus[]); setPage(1) }}
              className="w-52"
            />
            <Select
              options={collaboratorOptions}
              value={collaboratorId}
              onChange={(e) => { setCollaboratorId(e.target.value); setPage(1) }}
              className="w-52"
            />
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
              <span className="text-xs text-slate-500 whitespace-nowrap">ETB:</span>
              <input
                type="date"
                value={etbFrom}
                onChange={(e) => { setEtbFrom(e.target.value); setPage(1) }}
                className="border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
              <span className="text-slate-400 text-xs">–</span>
              <input
                type="date"
                value={etbTo}
                onChange={(e) => { setEtbTo(e.target.value); setPage(1) }}
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

                  {/* Inline inspection date editing */}
                  <td
                    className="px-2 py-2 text-xs text-slate-500"
                    onClick={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
                  >
                    {editingDateId === record.id ? (
                      <input
                        type="date"
                        defaultValue={record.inspection_date ?? ''}
                        autoFocus
                        className="border border-brand-400 rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                        onBlur={(e) => handleDateBlur(record, e.target.value)}
                      />
                    ) : (
                      <button
                        onClick={() => setEditingDateId(record.id)}
                        className="text-left hover:text-brand-600 hover:underline decoration-dashed underline-offset-2"
                        title="Clique para alterar a data de vistoria"
                      >
                        {formatDate(record.inspection_date) || <span className="text-slate-300">—</span>}
                      </button>
                    )}
                  </td>

                  {/* Inline status editing */}
                  <td
                    className="px-2 py-2 text-xs text-slate-700"
                    onClick={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
                  >
                    <div className="relative">
                      <button
                        onClick={() => setEditingStatusId(editingStatusId === record.id ? null : record.id)}
                        title="Clique para alterar o status"
                      >
                        <StatusBadge status={record.status} />
                      </button>
                      {editingStatusId === record.id && (
                        <div
                          ref={statusDropdownRef}
                          className="absolute top-full left-0 z-50 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-52 max-h-72 overflow-y-auto"
                        >
                          {ALL_STATUS_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 transition-colors ${
                                record.status === opt.value ? 'font-semibold text-brand-700 bg-brand-50' : 'text-slate-700'
                              }`}
                              onClick={() => handleStatusChange(record.id, opt.value as ImportStatus)}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>

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
