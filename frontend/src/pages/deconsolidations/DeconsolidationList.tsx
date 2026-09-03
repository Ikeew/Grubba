import { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  useDeconsolidationList,
  useDeleteDeconsolidation,
  useSetDeconsolidationFlag,
  useUpdateDeconsolidationField,
} from '@/hooks/useDeconsolidations'
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
import {
  DECONSOLIDATION_MODALITY_LABELS,
  DECONSOLIDATION_STATUS_LABELS,
} from '@/utils/constants'
import { filterStore } from '@/lib/filterStore'
import type { DeconsolidationRecord } from '@/types/deconsolidation'
import type { DeconsolidationStatus, FlagColor } from '@/types/common'

const FILTERABLE_STATUS_OPTIONS = Object.entries(DECONSOLIDATION_STATUS_LABELS)
  .filter(([value]) => value !== 'cancelled')
  .map(([value, label]) => ({ value, label }))

const ALL_STATUS_OPTIONS = Object.entries(DECONSOLIDATION_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}))

const DEFAULT_STATUSES: DeconsolidationStatus[] = (
  Object.keys(DECONSOLIDATION_STATUS_LABELS) as DeconsolidationStatus[]
).filter((s) => s !== 'completed' && s !== 'cancelled')

export default function DeconsolidationList() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [page, setPage] = useState(1)
  const [statuses, setStatuses] = useState<DeconsolidationStatus[]>(
    (filterStore.deconsolidationStatuses as DeconsolidationStatus[] | null) ?? DEFAULT_STATUSES,
  )
  const [collaboratorId, setCollaboratorId] = useState(filterStore.deconsolidationCollaboratorId)
  const [dateFrom, setDateFrom] = useState(filterStore.deconsolidationDateFrom)
  const [dateTo, setDateTo] = useState(filterStore.deconsolidationDateTo)
  const [searchInput, setSearchInput] = useState(filterStore.deconsolidationSearch)
  const [search, setSearch] = useState(filterStore.deconsolidationSearch)
  const [toDelete, setToDelete] = useState<DeconsolidationRecord | null>(null)

  // Inline editing state
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null)
  const statusDropdownRef = useRef<HTMLDivElement>(null)

  // Flag color mini-menu state
  const [flagMenuId, setFlagMenuId] = useState<string | null>(null)
  const [flagMenuPos, setFlagMenuPos] = useState<{ top: number; left: number } | null>(null)
  const flagMenuRef = useRef<HTMLDivElement>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { setSearch(searchInput); setPage(1) }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchInput])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setEditingStatusId(null)
        setDropdownPos(null)
      }
    }
    if (editingStatusId) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [editingStatusId])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (flagMenuRef.current && !flagMenuRef.current.contains(e.target as Node)) {
        setFlagMenuId(null)
        setFlagMenuPos(null)
      }
    }
    if (flagMenuId) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [flagMenuId])

  const { data: users } = useUserList()
  const collaboratorOptions = [
    { value: '', label: 'Todos os colaboradores' },
    ...(users?.items ?? []).map((u) => ({ value: u.id, label: u.full_name })),
  ]

  const { data, isLoading } = useDeconsolidationList({
    page,
    page_size: 20,
    status: statuses.length > 0 ? statuses : undefined,
    collaborator_id: collaboratorId || undefined,
    search: search || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  })

  const deleteRecord = useDeleteDeconsolidation()
  const setFlag = useSetDeconsolidationFlag()
  const updateField = useUpdateDeconsolidationField()

  const isDefaultState =
    statuses.length === DEFAULT_STATUSES.length &&
    DEFAULT_STATUSES.every((s) => statuses.includes(s)) &&
    !collaboratorId &&
    !dateFrom && !dateTo && !searchInput

  const hasFilters = !isDefaultState

  function setCollaborator(value: string) {
    filterStore.deconsolidationCollaboratorId = value
    setCollaboratorId(value)
  }

  function clearFilters() {
    filterStore.deconsolidationStatuses = [...DEFAULT_STATUSES]
    filterStore.deconsolidationSearch = ''
    filterStore.deconsolidationDateFrom = ''
    filterStore.deconsolidationDateTo = ''
    setStatuses(DEFAULT_STATUSES)
    setCollaborator('')
    setDateFrom('')
    setDateTo('')
    setSearchInput('')
    setSearch('')
    setPage(1)
  }

  async function handleDelete() {
    if (!toDelete) return
    await deleteRecord.mutateAsync(toDelete.id)
    setToDelete(null)
  }

  function myFlagColor(record: DeconsolidationRecord): FlagColor | null {
    if (!user) return null
    return record.flags.find((f) => f.user_id === user.id)?.color ?? null
  }

  function handleFlagButtonClick(recordId: string, e: React.MouseEvent<HTMLButtonElement>) {
    if (flagMenuId === recordId) {
      setFlagMenuId(null)
      setFlagMenuPos(null)
    } else {
      const rect = e.currentTarget.getBoundingClientRect()
      setFlagMenuPos({ top: rect.bottom + 4, left: rect.left })
      setFlagMenuId(recordId)
    }
  }

  function handleFlagSelect(recordId: string, color: FlagColor | null) {
    setFlag.mutate({ id: recordId, color })
    setFlagMenuId(null)
    setFlagMenuPos(null)
  }

  function canEdit(record: DeconsolidationRecord) {
    return user?.role === 'admin' || user?.role === 'manager' || record.status !== 'completed'
  }

  function handleStatusButtonClick(recordId: string, e: React.MouseEvent<HTMLButtonElement>) {
    if (editingStatusId === recordId) {
      setEditingStatusId(null)
      setDropdownPos(null)
    } else {
      const rect = e.currentTarget.getBoundingClientRect()
      setDropdownPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
      setEditingStatusId(recordId)
    }
  }

  function handleStatusChange(recordId: string, newStatus: DeconsolidationStatus) {
    updateField.mutate({ id: recordId, payload: { status: newStatus } })
    setEditingStatusId(null)
    setDropdownPos(null)
  }

  const editingRecord = data?.items.find((r) => r.id === editingStatusId) ?? null
  const flagMenuRecord = data?.items.find((r) => r.id === flagMenuId) ?? null
  const flagMenuColor = flagMenuRecord ? myFlagColor(flagMenuRecord) : null

  return (
    <div>
      <PageHeader
        title="Fichas de Desconsolidação"
        action={{ label: 'Nova ficha', onClick: () => navigate('/deconsolidations/new') }}
      />

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {/* Filter bar */}
        <div className="px-4 py-3 border-b border-slate-200 space-y-2">
          <div className="flex flex-wrap gap-2 items-center">
            <input
              type="text"
              placeholder="Buscar por cliente, referência ou consignatário..."
              value={searchInput}
              onChange={(e) => { filterStore.deconsolidationSearch = e.target.value; setSearchInput(e.target.value) }}
              className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 w-72"
            />
            <StatusMultiSelect
              options={FILTERABLE_STATUS_OPTIONS}
              value={statuses}
              onChange={(v) => {
                const s = v as DeconsolidationStatus[]
                filterStore.deconsolidationStatuses = s
                setStatuses(s)
                setPage(1)
              }}
              className="w-56"
            />
            <Select
              options={collaboratorOptions}
              value={collaboratorId}
              onChange={(e) => { setCollaborator(e.target.value); setPage(1) }}
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

          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 whitespace-nowrap">Data:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { filterStore.deconsolidationDateFrom = e.target.value; setDateFrom(e.target.value); setPage(1) }}
                className="border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
              <span className="text-slate-400 text-xs">–</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { filterStore.deconsolidationDateTo = e.target.value; setDateTo(e.target.value); setPage(1) }}
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
                <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Consignatário</th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Modal.</th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Data</th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Master</th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">House</th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Armador</th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Agência</th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Responsável</th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-16">Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((record) => {
                const flagColor = myFlagColor(record)
                const rowFlagClass =
                  flagColor === 'red'
                    ? 'bg-red-50 hover:bg-red-100'
                    : flagColor === 'yellow'
                      ? 'bg-yellow-50 hover:bg-yellow-100'
                      : ''
                return (
                <tr
                  key={record.id}
                  className={`table-row cursor-pointer ${rowFlagClass}`}
                  onDoubleClick={() => navigate(`/deconsolidations/${record.id}`)}
                >
                  <td className="px-2 py-2 text-xs text-slate-700">
                    <button
                      type="button"
                      title={flagColor ? 'Alterar bandeira' : 'Marcar com bandeira'}
                      onClick={(e) => handleFlagButtonClick(record.id, e)}
                      className="text-base leading-none focus:outline-none"
                    >
                      <span
                        className={
                          flagColor === 'red'
                            ? 'text-red-500'
                            : flagColor === 'yellow'
                              ? 'text-yellow-500'
                              : 'text-slate-300 hover:text-red-400'
                        }
                      >
                        ⚑
                      </span>
                    </button>
                  </td>
                  <td className="px-2 py-2 text-xs text-slate-700 font-medium">{record.reference ?? '—'}</td>
                  <td className="px-2 py-2 text-xs text-slate-700">{record.client.name}</td>
                  <td className="px-2 py-2 text-xs text-slate-500">{record.consignee ?? '—'}</td>
                  <td className="px-2 py-2 text-xs text-slate-500">
                    {record.modality ? DECONSOLIDATION_MODALITY_LABELS[record.modality] : '—'}
                  </td>
                  <td className="px-2 py-2 text-xs text-slate-500">{formatDate(record.date)}</td>
                  <td className="px-2 py-2 text-xs text-slate-500">{record.master_bl ?? '—'}</td>
                  <td className="px-2 py-2 text-xs text-slate-500">{record.house_bl ?? '—'}</td>
                  <td className="px-2 py-2 text-xs text-slate-500">{record.shipping_company ?? '—'}</td>
                  <td className="px-2 py-2 text-xs text-slate-500">{record.agency ?? '—'}</td>
                  <td className="px-2 py-2 text-xs text-slate-500">{record.collaborator?.full_name ?? '—'}</td>

                  {/* Inline status editing */}
                  <td
                    className="px-2 py-2 text-xs text-slate-700"
                    onClick={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => canEdit(record) && handleStatusButtonClick(record.id, e)}
                      title={canEdit(record) ? 'Clique para alterar o status' : undefined}
                      className={!canEdit(record) ? 'cursor-default' : undefined}
                    >
                      <StatusBadge status={record.status} />
                    </button>
                  </td>

                  <td className="px-2 py-2 text-xs text-slate-700">
                    {canEdit(record) && (
                      <Button size="sm" variant="ghost" className="text-red-500" onClick={() => setToDelete(record)}>
                        ×
                      </Button>
                    )}
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {data && <Pagination page={data.page} pages={data.pages} total={data.total} onPageChange={setPage} />}
      </div>

      {/* Status dropdown rendered via portal so it's never clipped by table overflow */}
      {editingStatusId && dropdownPos && ReactDOM.createPortal(
        <div
          ref={statusDropdownRef}
          style={{ position: 'fixed', top: dropdownPos.top, right: dropdownPos.right, zIndex: 9999 }}
          className="bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-52 max-h-72 overflow-y-auto"
        >
          {ALL_STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 transition-colors ${
                editingRecord?.status === opt.value ? 'font-semibold text-brand-700 bg-brand-50' : 'text-slate-700'
              }`}
              onClick={() => handleStatusChange(editingStatusId, opt.value as DeconsolidationStatus)}
            >
              {opt.label}
            </button>
          ))}
        </div>,
        document.body
      )}

      {/* Flag color mini-menu rendered via portal */}
      {flagMenuId && flagMenuPos && ReactDOM.createPortal(
        <div
          ref={flagMenuRef}
          style={{ position: 'fixed', top: flagMenuPos.top, left: flagMenuPos.left, zIndex: 9999 }}
          className="bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-44"
        >
          <button
            className={`flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-slate-50 transition-colors ${
              flagMenuColor === 'red' ? 'font-semibold text-brand-700 bg-brand-50' : 'text-slate-700'
            }`}
            onClick={() => handleFlagSelect(flagMenuId, 'red')}
          >
            <span className="text-red-500 text-base leading-none">⚑</span>
            Bandeira vermelha
          </button>
          <button
            className={`flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-slate-50 transition-colors ${
              flagMenuColor === 'yellow' ? 'font-semibold text-brand-700 bg-brand-50' : 'text-slate-700'
            }`}
            onClick={() => handleFlagSelect(flagMenuId, 'yellow')}
          >
            <span className="text-yellow-500 text-base leading-none">⚑</span>
            Bandeira amarela
          </button>
          {flagMenuColor && (
            <button
              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 transition-colors border-t border-slate-100"
              onClick={() => handleFlagSelect(flagMenuId, null)}
            >
              Remover bandeira
            </button>
          )}
        </div>,
        document.body
      )}

      {toDelete && (
        <ConfirmModal
          title="Remover ficha de desconsolidação"
          description={`Remover a ficha "${toDelete.reference ?? toDelete.id}"?`}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
          loading={deleteRecord.isPending}
        />
      )}
    </div>
  )
}
