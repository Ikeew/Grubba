import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExportList } from '@/hooks/useExports'
import { useImportList } from '@/hooks/useImports'
import { useUserList } from '@/hooks/useUsers'
import { PageHeader } from '@/components/layout/PageHeader'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { formatDate } from '@/utils/format'
import { MODALITY_LABELS } from '@/utils/constants'
import { filterStore } from '@/lib/filterStore'
import type { ExportRecord } from '@/types/export'
import type { ImportRecord } from '@/types/import'

type Tab = 'exports' | 'imports'

const PAGE_SIZE = 50

export default function CompletedList() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>((filterStore.completedTab as Tab) || 'exports')

  const [search, setSearch] = useState(filterStore.completedClientSearch ?? '')
  const [collaboratorId, setCollaboratorId] = useState(filterStore.completedCollaboratorId ?? '')
  const [completedFrom, setCompletedFrom] = useState(filterStore.completedCompletedFrom ?? '')
  const [completedTo, setCompletedTo] = useState(filterStore.completedCompletedTo ?? '')
  const [createdFrom, setCreatedFrom] = useState(filterStore.completedCreatedFrom ?? '')
  const [createdTo, setCreatedTo] = useState(filterStore.completedCreatedTo ?? '')

  const [exportPage, setExportPage] = useState(1)
  const [importPage, setImportPage] = useState(1)

  const hasFilters = search || collaboratorId || completedFrom || completedTo || createdFrom || createdTo

  const { data: users } = useUserList()
  const collaboratorOptions = [
    { value: '', label: 'Todos os colaboradores' },
    ...(users?.items ?? []).map((u) => ({ value: u.id, label: u.full_name })),
  ]

  const { data: exportData, isLoading: exportLoading } = useExportList({
    status: ['completed'],
    billing_completed: true,
    page: exportPage,
    page_size: PAGE_SIZE,
    collaborator_id: collaboratorId || undefined,
    search: search || undefined,
    completed_from: completedFrom || undefined,
    completed_to: completedTo || undefined,
    created_from: createdFrom || undefined,
    created_to: createdTo || undefined,
  })

  const { data: importData, isLoading: importLoading } = useImportList({
    status: ['completed'],
    billing_completed: true,
    page: importPage,
    page_size: PAGE_SIZE,
    collaborator_id: collaboratorId || undefined,
    search: search || undefined,
    completed_from: completedFrom || undefined,
    completed_to: completedTo || undefined,
    created_from: createdFrom || undefined,
    created_to: createdTo || undefined,
  })

  function setCollaborator(value: string) {
    filterStore.completedCollaboratorId = value
    setCollaboratorId(value)
    setExportPage(1)
    setImportPage(1)
  }

  function handleSearch(value: string) {
    filterStore.completedClientSearch = value
    setSearch(value)
    setExportPage(1)
    setImportPage(1)
  }

  function clearFilters() {
    filterStore.completedClientSearch = ''
    filterStore.completedCollaboratorId = ''
    filterStore.completedCompletedFrom = ''
    filterStore.completedCompletedTo = ''
    filterStore.completedCreatedFrom = ''
    filterStore.completedCreatedTo = ''
    handleSearch('')
    setCollaborator('')
    setCompletedFrom('')
    setCompletedTo('')
    setCreatedFrom('')
    setCreatedTo('')
  }

  const exports = exportData?.items ?? []
  const imports = importData?.items ?? []

  return (
    <div>
      <PageHeader title="Fichas Concluídas" />

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-slate-200">
        {(['exports', 'imports'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { filterStore.completedTab = t; setTab(t) }}
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
              {t === 'exports' ? (exportData?.total ?? 0) : (importData?.total ?? 0)}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center mb-3">
        <input
          type="text"
          placeholder="Filtrar por cliente ou referência..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 w-60"
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
            onChange={(e) => {
              filterStore.completedCompletedFrom = e.target.value
              setCompletedFrom(e.target.value)
              setExportPage(1); setImportPage(1)
            }}
            className="border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
          <span className="text-xs text-slate-500">até</span>
          <input
            type="date"
            value={completedTo}
            onChange={(e) => {
              filterStore.completedCompletedTo = e.target.value
              setCompletedTo(e.target.value)
              setExportPage(1); setImportPage(1)
            }}
            className="border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-500 whitespace-nowrap">Criado de</span>
          <input
            type="date"
            value={createdFrom}
            onChange={(e) => {
              filterStore.completedCreatedFrom = e.target.value
              setCreatedFrom(e.target.value)
              setExportPage(1); setImportPage(1)
            }}
            className="border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
          <span className="text-xs text-slate-500">até</span>
          <input
            type="date"
            value={createdTo}
            onChange={(e) => {
              filterStore.completedCreatedTo = e.target.value
              setCreatedTo(e.target.value)
              setExportPage(1); setImportPage(1)
            }}
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
            <EmptyState title="Nenhuma exportação faturada." />
          ) : (
            <>
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
                  </tr>
                </thead>
                <tbody>
                  {exports.map((record: ExportRecord) => (
                    <tr
                      key={record.id}
                      onDoubleClick={() => navigate(`/exports/${record.id}`)}
                      className="border-b border-slate-100 cursor-pointer bg-green-50 hover:bg-green-100 transition-colors"
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
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination
                page={exportPage}
                pages={exportData?.pages ?? 1}
                total={exportData?.total ?? 0}
                pageSize={PAGE_SIZE}
                onPage={setExportPage}
              />
            </>
          )}
        </div>
      )}

      {/* Imports tab */}
      {tab === 'imports' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          {importLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : !imports.length ? (
            <EmptyState title="Nenhuma importação faturada." />
          ) : (
            <>
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Referência</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Modal.</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Data</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Navio</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">DI/DUIMP</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Porto</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Colaborador</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Vistoria</th>
                  </tr>
                </thead>
                <tbody>
                  {imports.map((record: ImportRecord) => (
                    <tr
                      key={record.id}
                      onDoubleClick={() => navigate(`/imports/${record.id}`)}
                      className="border-b border-slate-100 cursor-pointer bg-green-50 hover:bg-green-100 transition-colors"
                    >
                      <td className="px-3 py-2 font-medium text-slate-700">{record.reference ?? '—'}</td>
                      <td className="px-3 py-2 text-slate-700">{record.client.name}</td>
                      <td className="px-3 py-2 text-slate-500">
                        {record.modality ? MODALITY_LABELS[record.modality] : '—'}
                      </td>
                      <td className="px-3 py-2 text-slate-500">{formatDate(record.date)}</td>
                      <td className="px-3 py-2 text-slate-500">{record.cargo_type ?? '—'}</td>
                      <td className="px-3 py-2 text-slate-500">{record.vessel ?? '—'}</td>
                      <td className="px-3 py-2 text-slate-500">{record.di_duimp_dta ?? '—'}</td>
                      <td className="px-3 py-2 text-slate-500">{record.port?.name ?? '—'}</td>
                      <td className="px-3 py-2 text-slate-500">{record.collaborator?.full_name ?? '—'}</td>
                      <td className="px-3 py-2 text-slate-500">{formatDate(record.inspection_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination
                page={importPage}
                pages={importData?.pages ?? 1}
                total={importData?.total ?? 0}
                pageSize={PAGE_SIZE}
                onPage={setImportPage}
              />
            </>
          )}
        </div>
      )}
    </div>
  )
}
