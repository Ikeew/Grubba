import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useCancelReceipt, useDownloadReceiptPdf, useReceiptList } from '@/hooks/useReceipts'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader } from '@/components/layout/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { formatBRL, formatDate } from '@/utils/format'
import { parseApiError } from '@/utils/parseApiError'
import { canManageBilling } from '@/utils/permissions'
import type { ReceiptListItem } from '@/types/receipt'

const PAGE_SIZE = 50

export default function ReceiptList() {
  const { user } = useAuth()
  const location = useLocation()
  const created = (location.state as { created?: string } | null)?.created

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [includeCancelled, setIncludeCancelled] = useState(true)
  const [toCancel, setToCancel] = useState<ReceiptListItem | null>(null)
  const [actionError, setActionError] = useState('')

  const { data, isLoading } = useReceiptList({
    page,
    page_size: PAGE_SIZE,
    search: search || undefined,
    include_cancelled: includeCancelled,
  })
  const cancelReceipt = useCancelReceipt()
  const downloadPdf = useDownloadReceiptPdf()

  if (!canManageBilling(user)) return <Navigate to="/billing" replace />

  async function confirmCancel() {
    if (!toCancel) return
    setActionError('')
    try {
      await cancelReceipt.mutateAsync(toCancel.id)
    } catch (err) {
      setActionError(parseApiError(err))
    }
    setToCancel(null)
  }

  const receipts = data?.items ?? []

  return (
    <div>
      <PageHeader title="Recibos emitidos" backTo="/billing" />

      {created && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
          Recibo <strong>{created}</strong> gerado com sucesso.
        </div>
      )}
      {actionError && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{actionError}</div>
      )}

      <div className="flex flex-wrap gap-3 items-center mb-3">
        <input
          type="text"
          placeholder="Buscar por número ou cliente..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 w-64"
        />
        <label className="inline-flex items-center gap-1.5 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={includeCancelled}
            onChange={(e) => { setIncludeCancelled(e.target.checked); setPage(1) }}
            className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Mostrar cancelados
        </label>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : !receipts.length ? (
          <EmptyState title="Nenhum recibo encontrado." />
        ) : (
          <>
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wider">Número</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wider">Emissão</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wider">Fichas</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wider">Gerado por</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wider">Situação</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {receipts.map((r) => (
                  <tr key={r.id} className={`border-b border-slate-100 ${r.is_cancelled ? 'text-slate-400' : ''}`}>
                    <td className={`px-3 py-2 font-medium ${r.is_cancelled ? 'line-through' : 'text-slate-700'}`}>{r.number}</td>
                    <td className="px-3 py-2">{r.client_name}</td>
                    <td className="px-3 py-2">{formatDate(r.issue_date)}</td>
                    <td className="px-3 py-2">{r.items_count}</td>
                    <td className="px-3 py-2 text-right font-medium">{formatBRL(r.total)}</td>
                    <td className="px-3 py-2">{r.created_by?.full_name ?? '—'}</td>
                    <td className="px-3 py-2">
                      {r.is_cancelled ? (
                        <span className="px-2 py-0.5 rounded bg-red-50 text-red-600 font-medium">Cancelado</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-green-50 text-green-700 font-medium">Emitido</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => downloadPdf.mutate({ id: r.id, number: r.number })}
                          className="px-2.5 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600 hover:bg-brand-100 hover:text-brand-700 transition-colors"
                        >
                          Baixar PDF
                        </button>
                        {!r.is_cancelled && (
                          <button
                            onClick={() => setToCancel(r)}
                            className="px-2.5 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-700 transition-colors"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              page={page}
              pages={data?.pages ?? 1}
              total={data?.total ?? 0}
              pageSize={PAGE_SIZE}
              onPage={setPage}
            />
          </>
        )}
      </div>

      {toCancel && (
        <ConfirmModal
          title={`Cancelar recibo ${toCancel.number}?`}
          description="As fichas voltam a ficar disponíveis para um novo recibo. O número não será reaproveitado."
          onConfirm={confirmCancel}
          onCancel={() => setToCancel(null)}
          loading={cancelReceipt.isPending}
        />
      )}
    </div>
  )
}
