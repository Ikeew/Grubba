import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExportList, useToggleExportBilling } from '@/hooks/useExports'
import { useImportList, useToggleImportBilling } from '@/hooks/useImports'
import { useUserList } from '@/hooks/useUsers'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatDate } from '@/utils/format'
import { MODALITY_LABELS } from '@/utils/constants'
import { filterStore } from '@/lib/filterStore'
import type { ExportRecord } from '@/types/export'
import type { ImportRecord } from '@/types/import'

type Tab = 'exports' | 'imports'

function sortItems<T extends { billing_completed: boolean; collaborator?: { id: string } | null }>(
  items: T[],
  currentUserId?: string,
): T[] {
  return [...items].sort((a, b) => {
    const aIsMine = currentUserId && a.collaborator?.id === currentUserId ? 0 : 1
    const bIsMine = currentUserId && b.collaborator?.id === currentUserId ? 0 : 1
    if (aIsMine !== bIsMine) return aIsMine - bIsMine
    return Number(a.billing_completed) - Number(b.billing_completed)
  })
}

export default function BillingList() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('exports')

  // Filters (client-side for client/reference, server-side for collaborator/dates)
  const [clientSearch, setClientSearch] = useState('')
  const [referenceSearch, setReferenceSearch] = useState('')
  const [collaboratorId, setCollaboratorId] = useState(filterStore.billingCollaboratorId)
  const [completedFrom, setCompletedFrom] = useState('')
  const [completedTo, setCompletedTo] = useState('')

  const hasFilters = clientSearch || referenceSearch || collaboratorId || completedFrom || completedTo

  const { data: users } = useUserList()
  const collaboratorOptions = [
    { value: '', label: 'Todos os colaboradores' },
    ...(users?.items ?? []).map((u) => ({ value: u.id, label: u.full_name })),
  ]

  const { data: exportData, isLoading: exportLoading } = useExportList({
    status: ['completed'],
    page_size: 500,
    collaborator_id: collaboratorId || undefined,
    completed_from: completedFrom || undefined,
    completed_to: completedTo || undefined,
  })

  const { data: importData, isLoading: importLoading } = useImportList({
    status: ['completed'],
    page_size: 500,
    collaborator_id: collaboratorId || undefined,
    completed_from: completedFrom || undefined,
    completed_to: completedTo || undefined,
  })

  const toggleExportBilling = useToggleExportBilling()
  const toggleImportBilling = useToggleImportBilling()

  function setCollaborator(value: string) {
    filterStore.billingCollaboratorId = value
    setCollaboratorId(value)
  }

  function clearFilters() {
    setClientSearch('')
    setReferenceSearch('')
    setCollaborator('')
    setCompletedFrom('')
    setCompletedTo('')
  }

  function filterExports(items: ExportRecord[]) {
    return items.filter((r) => {
      if (clientSearch && !r.client.name.toLowerCase().includes(clientSearch.toLowerCase())) return false
      if (referenceSearch && !(r.reference ?? '').toLowerCase().includes(referenceSearch.toLowerCase())) return false
      return true
    })
  }

  function filterImports(items: ImportRecord[]) {
    return items.filter((r) => {
      if (clientSearch && !r.client.name.toLowerCase().includes(clientSearch.toLowerCase())) return false
      if (referenceSearch && !(r.reference ?? '').toLowerCase().includes(referenceSearch.toLowerCase())) return false
      return true
    })
  }

  const exports = sortItems(filterExports(exportData?.items ?? []), user?.id)
  const imports = sortItems(filterImports(importData?.items ?? []), user?.id)

  return (
    <div>
      <PageHeader title="Faturamento" />

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-slate-200">
        {(['exports', 'imports'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'exports' ? 'Exportação' : 'Importação'}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
              tab === t ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {t === 'exports' ? exports.length : imports.length}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center mb-3">
        <input
          type="text"
          placeholder="Filtrar por cliente..."
          value={clientSearch}
          onChange={(e) => setClientSearch(e.target.value)}
          className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 w-52"
        />
        <input
          type="text"
          placeholder="Filtrar por referência..."
          value={referenceSearch}
          onChange={(e) => setReferenceSearch(e.target.value)}
          className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 w-48"
        />
        <Select
          options={collaboratorOptions}
          value={collaboratorId}
          onChange={(e) => setCollaborator(e.target.value)}
          className="w-52"
        />
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-500 whitespace-nowrap">Concluído de</span>
          <input
            type="date"
            value={completedFrom}
            onChange={(e) => setCompletedFrom(e.target.value)}
            className="border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
          <span className="text-xs text-slate-500">até</span>
          <input
            type="date"
            value={completedTo}
            onChange={(e) => setCompletedTo(e.target.value)}
            className="border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-1.5 rounded-md text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Exports tab */}
      {tab === 'exports' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          {exportLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : !exports.length ? (
            <EmptyState title="Nenhuma exportação concluída." />
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Referência</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Data</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Navio</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Porto</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ETS</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Colaborador</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Vistoria</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Faturamento</th>
                </tr>
              </thead>
              <tbody>
                {exports.map((record: ExportRecord) => (
                  <tr
                    key={record.id}
                    onDoubleClick={() => navigate(`/exports/${record.id}`)}
                    className={`border-b border-slate-100 cursor-pointer transition-colors ${
                      record.billing_completed
                        ? 'bg-green-50 hover:bg-green-100'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-3 py-2 font-medium text-slate-700">{record.reference ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-700">{record.client.name}</td>
                    <td className="px-3 py-2 text-slate-500">{formatDate(record.date)}</td>
                    <td className="px-3 py-2 text-slate-500">{record.cargo_type ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-500">{record.vessel ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-500">{record.port?.name ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-500">{formatDate(record.ets)}</td>
                    <td className="px-3 py-2 text-slate-500">{record.collaborator?.full_name ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-500">{formatDate(record.inspection_date)}</td>
                    <td className="px-3 py-2"><StatusBadge status={record.status} /></td>
                    <td className="px-3 py-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleExportBilling.mutate(record.id) }}
                        onDoubleClick={(e) => e.stopPropagation()}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                          record.billing_completed
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-slate-100 text-slate-600 hover:bg-green-100 hover:text-green-700'
                        }`}
                      >
                        {record.billing_completed ? '✓ Faturado' : 'Marcar faturado'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Imports tab */}
      {tab === 'imports' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          {importLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : !imports.length ? (
            <EmptyState title="Nenhuma importação concluída." />
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Referência</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Modal.</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Data</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Navio</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ETB</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Colaborador</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Vistoria</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Faturamento</th>
                </tr>
              </thead>
              <tbody>
                {imports.map((record: ImportRecord) => (
                  <tr
                    key={record.id}
                    onDoubleClick={() => navigate(`/imports/${record.id}`)}
                    className={`border-b border-slate-100 cursor-pointer transition-colors ${
                      record.billing_completed
                        ? 'bg-green-50 hover:bg-green-100'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-3 py-2 font-medium text-slate-700">{record.reference ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-700">{record.client.name}</td>
                    <td className="px-3 py-2 text-slate-500">
                      {record.modality ? MODALITY_LABELS[record.modality] : '—'}
                    </td>
                    <td className="px-3 py-2 text-slate-500">{formatDate(record.date)}</td>
                    <td className="px-3 py-2 text-slate-500">{record.cargo_type ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-500">{record.vessel ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-500">{formatDate(record.etb)}</td>
                    <td className="px-3 py-2 text-slate-500">{record.collaborator?.full_name ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-500">{formatDate(record.inspection_date)}</td>
                    <td className="px-3 py-2"><StatusBadge status={record.status} /></td>
                    <td className="px-3 py-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleImportBilling.mutate(record.id) }}
                        onDoubleClick={(e) => e.stopPropagation()}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                          record.billing_completed
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-slate-100 text-slate-600 hover:bg-green-100 hover:text-green-700'
                        }`}
                      >
                        {record.billing_completed ? '✓ Faturado' : 'Marcar faturado'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
