import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAvailableRecords, useCreateReceipt } from '@/hooks/useReceipts'
import { receiptService } from '@/services/receipt.service'
import { useAuth } from '@/contexts/AuthContext'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatBRL, formatDate, toApiMoney } from '@/utils/format'
import { parseApiError } from '@/utils/parseApiError'
import { canManageBilling } from '@/utils/permissions'
import type { AvailableRecord, ReceiptRecordType } from '@/types/receipt'

const TYPE_LABELS: Record<ReceiptRecordType, string> = {
  import: 'Importação',
  export: 'Exportação',
  deconsolidation: 'Desconsolidação',
}
const TYPES: ReceiptRecordType[] = ['import', 'export', 'deconsolidation']

type TypeFilter = 'all' | ReceiptRecordType

interface ExtraCost {
  key: number
  description: string
  amount: string
}

const recordKey = (type: ReceiptRecordType, id: string) => `${type}:${id}`

function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Texto do input -> número (vazio/inválido conta como 0 no total exibido). */
function amountOf(value: string): number {
  const n = Number(value.replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

export default function ReceiptBuilder() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [params] = useSearchParams()
  const clientId = params.get('client') ?? ''
  const initialType = params.get('type') as ReceiptRecordType | null
  const initialId = params.get('record')

  const { data, isLoading, error } = useAvailableRecords(clientId)
  const createReceipt = useCreateReceipt()

  // Fichas selecionadas: chave "tipo:id" -> valor digitado ('' = em branco)
  const [selected, setSelected] = useState<Record<string, string>>({})
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [search, setSearch] = useState('')
  const [issueDate, setIssueDate] = useState(todayIso())
  const [cnpj, setCnpj] = useState('')
  const [email, setEmail] = useState('')
  const [clientFields, setClientFields] = useState<string[]>([])
  const [recordFields, setRecordFields] = useState<Record<ReceiptRecordType, string[]>>({
    import: [], export: [], deconsolidation: [],
  })
  const [extras, setExtras] = useState<ExtraCost[]>([])
  const [submitError, setSubmitError] = useState('')
  const [initialized, setInitialized] = useState(false)

  // Inicializa com a ficha clicada + dados do cadastro do cliente
  useEffect(() => {
    if (!data || initialized) return
    setCnpj(data.client.cnpj ?? '')
    setEmail(data.client.email ?? '')
    setClientFields(data.default_client_fields)
    setRecordFields({ ...data.default_record_fields })
    const clicked = data.records.find((r) => r.record_type === initialType && r.id === initialId)
    if (clicked) setSelected({ [recordKey(clicked.record_type, clicked.id)]: clicked.suggested_amount ?? '' })
    setInitialized(true)
  }, [data, initialized, initialType, initialId])

  const recordsByKey = useMemo(() => {
    const map = new Map<string, AvailableRecord>()
    data?.records.forEach((r) => map.set(recordKey(r.record_type, r.id), r))
    return map
  }, [data])

  const visibleRecords = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (data?.records ?? []).filter((r) => {
      if (typeFilter !== 'all' && r.record_type !== typeFilter) return false
      if (!term) return true
      return [r.reference, r.description].some((v) => v?.toLowerCase().includes(term))
    })
  }, [data, typeFilter, search])

  const countByType = useMemo(() => {
    const counts: Record<ReceiptRecordType, number> = { import: 0, export: 0, deconsolidation: 0 }
    data?.records.forEach((r) => { counts[r.record_type] += 1 })
    return counts
  }, [data])

  const selectedRecords = Object.keys(selected)
    .map((k) => recordsByKey.get(k))
    .filter((r): r is AvailableRecord => !!r)
  const selectedTypes = TYPES.filter((t) => selectedRecords.some((r) => r.record_type === t))

  const subtotal = Object.values(selected).reduce((acc, v) => acc + amountOf(v), 0)
  const extrasTotal = extras.reduce((acc, e) => acc + amountOf(e.amount), 0)
  const total = subtotal + extrasTotal

  if (!canManageBilling(user)) return <Navigate to="/billing" replace />
  if (!clientId) return <Navigate to="/billing" replace />

  function toggleRecord(record: AvailableRecord) {
    const key = recordKey(record.record_type, record.id)
    setSelected((prev) => {
      const next = { ...prev }
      if (key in next) delete next[key]
      else next[key] = record.suggested_amount ?? ''
      return next
    })
  }

  function toggleIn(list: string[], key: string): string[] {
    return list.includes(key) ? list.filter((k) => k !== key) : [...list, key]
  }

  function updateExtra(key: number, patch: Partial<ExtraCost>) {
    setExtras((prev) => prev.map((e) => (e.key === key ? { ...e, ...patch } : e)))
  }

  async function handleSubmit() {
    setSubmitError('')
    if (!selectedRecords.length) {
      setSubmitError('Selecione ao menos uma ficha.')
      return
    }
    const missing = selectedRecords.find((r) => !toApiMoney(selected[recordKey(r.record_type, r.id)]))
    if (missing) {
      setSubmitError(`Informe o valor da ficha ${missing.reference ?? ''}.`.replace(' .', '.'))
      return
    }
    const badExtra = extras.find((e) => !e.description.trim() || !toApiMoney(e.amount))
    if (badExtra) {
      setSubmitError('Preencha descrição e valor de todos os custos extras (ou remova as linhas vazias).')
      return
    }

    try {
      const receipt = await createReceipt.mutateAsync({
        client_id: clientId,
        issue_date: issueDate || undefined,
        client_cnpj: cnpj.trim() || null,
        client_email: email.trim() || null,
        client_fields: clientFields,
        record_fields: Object.fromEntries(selectedTypes.map((t) => [t, recordFields[t]])),
        items: selectedRecords.map((r) => ({
          record_type: r.record_type,
          record_id: r.id,
          amount: toApiMoney(selected[recordKey(r.record_type, r.id)]),
        })),
        extra_costs: extras.map((e) => ({
          description: e.description.trim(),
          amount: toApiMoney(e.amount) as string,
        })),
      })
      await receiptService.downloadPdf(receipt.id, receipt.number).catch(() => undefined)
      navigate('/billing/receipts', { state: { created: receipt.number } })
    } catch (err) {
      setSubmitError(parseApiError(err))
    }
  }

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>
  if (error || !data) {
    return (
      <div>
        <PageHeader title="Gerar recibo" backTo="/billing" />
        <EmptyState title={parseApiError(error)} />
      </div>
    )
  }

  const clickedMissing = initialType && initialId && !recordsByKey.has(recordKey(initialType, initialId))

  return (
    <div>
      <PageHeader
        title="Gerar recibo"
        description={`Cliente: ${data.client.name}`}
        backTo="/billing"
      />

      {clickedMissing && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          A ficha selecionada não está mais disponível (já possui recibo ou saiu do faturamento).
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Coluna principal */}
        <div className="xl:col-span-2 space-y-6">
          {/* a) + b) Fichas e valores */}
          <div className="form-section">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="form-section-title border-none pb-0">Fichas do cliente</p>
              <span className="text-xs text-slate-500">
                {selectedRecords.length} selecionada{selectedRecords.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(['all', ...TYPES] as TypeFilter[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    typeFilter === t
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t === 'all' ? `Todas (${data.records.length})` : `${TYPE_LABELS[t]} (${countByType[t]})`}
                </button>
              ))}
              <input
                type="text"
                placeholder="Buscar por referência, BL, navio..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ml-auto border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 w-64"
              />
            </div>

            {!visibleRecords.length ? (
              <EmptyState title="Nenhuma ficha disponível para este filtro." />
            ) : (
              <div className="border border-slate-200 rounded-md overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="w-8 px-3 py-2" />
                      <th className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wider">Referência</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wider">Data</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wider">Detalhes</th>
                      <th className="px-3 py-2 text-right font-semibold text-slate-500 uppercase tracking-wider w-36">Valor (R$)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRecords.map((r) => {
                      const key = recordKey(r.record_type, r.id)
                      const isSelected = key in selected
                      const blank = isSelected && !selected[key]
                      return (
                        <tr
                          key={key}
                          onClick={() => toggleRecord(r)}
                          className={`border-b border-slate-100 cursor-pointer transition-colors ${
                            isSelected ? 'bg-brand-50/60' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleRecord(r)}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                            />
                          </td>
                          <td className="px-3 py-2 text-slate-500">{TYPE_LABELS[r.record_type]}</td>
                          <td className="px-3 py-2 font-medium text-slate-700">{r.reference ?? '—'}</td>
                          <td className="px-3 py-2 text-slate-500">{formatDate(r.date)}</td>
                          <td className="px-3 py-2 text-slate-500">{r.description ?? '—'}</td>
                          <td className="px-3 py-1.5 text-right" onClick={(e) => e.stopPropagation()}>
                            {isSelected ? (
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="Informe"
                                value={selected[key]}
                                onChange={(e) => setSelected((prev) => ({ ...prev, [key]: e.target.value }))}
                                className={`w-full rounded-md border px-2 py-1 text-right text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                                  blank ? 'border-amber-400 bg-amber-50' : 'border-slate-300'
                                }`}
                              />
                            ) : (
                              <span className="text-slate-400">
                                {r.suggested_amount ? formatBRL(r.suggested_amount) : 'sem valor padrão'}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-xs text-slate-500">
              Alterar o valor aqui vale só para este recibo — o valor padrão do cadastro do cliente não muda.
            </p>
          </div>

          {/* c) Custos extras */}
          <div className="form-section">
            <div className="flex items-center justify-between">
              <p className="form-section-title border-none pb-0">Custos extras</p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setExtras((prev) => [...prev, { key: Date.now(), description: '', amount: '' }])}
              >
                + Adicionar custo
              </Button>
            </div>
            {!extras.length ? (
              <p className="text-sm text-slate-400">Nenhum custo extra.</p>
            ) : (
              <div className="space-y-2">
                {extras.map((e) => (
                  <div key={e.key} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Descrição (ex.: Taxa de armazenagem)"
                      value={e.description}
                      onChange={(ev) => updateExtra(e.key, { description: ev.target.value })}
                      className="flex-1 border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      value={e.amount}
                      onChange={(ev) => updateExtra(e.key, { amount: ev.target.value })}
                      className="w-36 border border-slate-300 rounded-md px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <button
                      type="button"
                      onClick={() => setExtras((prev) => prev.filter((x) => x.key !== e.key))}
                      className="px-2 py-1 text-slate-400 hover:text-red-600"
                      aria-label="Remover custo"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* e) Campos das fichas no recibo */}
          <div className="form-section">
            <p className="form-section-title">Campos das fichas no recibo</p>
            {!selectedTypes.length ? (
              <p className="text-sm text-slate-400">Selecione fichas para escolher os campos.</p>
            ) : (
              selectedTypes.map((t) => (
                <div key={t}>
                  <p className="text-xs font-semibold text-slate-600 mb-2">{TYPE_LABELS[t]}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                    {data.record_field_options[t].map((f) => (
                      <label key={f.key} className="inline-flex items-center gap-1.5 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={recordFields[t].includes(f.key)}
                          onChange={() => setRecordFields((prev) => ({ ...prev, [t]: toggleIn(prev[t], f.key) }))}
                          className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        />
                        {f.label}
                      </label>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Coluna lateral: cliente + total */}
        <div className="space-y-6 xl:sticky xl:top-4">
          {/* f) Dados do cliente */}
          <div className="form-section">
            <p className="form-section-title">Dados do cliente</p>
            <p className="text-sm font-medium text-slate-800">{data.client.name}</p>
            <Input label="CNPJ" value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0001-00" />
            <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <p className="text-xs text-slate-500">CNPJ e e-mail editados aqui valem só para este recibo.</p>
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">Exibir no recibo</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {data.client_field_options.map((f) => (
                  <label key={f.key} className="inline-flex items-center gap-1.5 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={clientFields.includes(f.key)}
                      onChange={() => setClientFields((prev) => toggleIn(prev, f.key))}
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    {f.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* d) Total */}
          <div className="form-section">
            <p className="form-section-title">Resumo</p>
            <Input label="Data de emissão" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <dt>Fichas ({selectedRecords.length})</dt>
                <dd>{formatBRL(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-slate-600">
                <dt>Custos extras ({extras.length})</dt>
                <dd>{formatBRL(extrasTotal)}</dd>
              </div>
              <div className="flex justify-between items-baseline border-t border-slate-200 pt-2 mt-2">
                <dt className="font-semibold text-slate-800">Total</dt>
                <dd className="text-xl font-bold text-brand-700">{formatBRL(total)}</dd>
              </div>
            </dl>
            {submitError && (
              <p className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{submitError}</p>
            )}
            <Button
              type="button"
              className="w-full justify-center"
              onClick={handleSubmit}
              loading={createReceipt.isPending}
            >
              Gerar recibo
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
