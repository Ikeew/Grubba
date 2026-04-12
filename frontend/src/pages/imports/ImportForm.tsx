import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useImport, useCreateImport, useUpdateImport } from '@/hooks/useImports'
import { useClientList } from '@/hooks/useClients'
import { useUserList } from '@/hooks/useUsers'
import { usePortList } from '@/hooks/usePorts'
import { importSchema, type ImportFormValues } from '@/schemas/import.schema'
import { PageHeader } from '@/components/layout/PageHeader'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { ClientCombobox } from '@/components/ui/ClientCombobox'
import { PortCombobox } from '@/components/ui/PortCombobox'
import type { ImportRecordPayload } from '@/types/import'
import { IMPORT_STATUS_LABELS, MAP_TYPE_LABELS, MODALITY_LABELS } from '@/utils/constants'
import { parseApiError } from '@/utils/parseApiError'

const STATUS_OPTIONS = Object.entries(IMPORT_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))
const MAP_OPTIONS = [{ value: '', label: 'Selecionar...' }, ...Object.entries(MAP_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))]
const MODALITY_OPTIONS = [{ value: '', label: 'Selecionar...' }, ...Object.entries(MODALITY_LABELS).map(([v, l]) => ({ value: v, label: l }))]

export default function ImportForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id
  const { user } = useAuth()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const isAdmin = user?.role === 'admin'
  const today = new Date().toISOString().slice(0, 10)

  const { data: record, isLoading: loadingRecord } = useImport(id ?? '')
  const { data: clients } = useClientList({ page_size: 100 })
  const { data: users } = useUserList(isAdmin)
  const { data: ports } = usePortList()
  const createImport = useCreateImport()
  const updateImport = useUpdateImport(id ?? '')

  const clientOptions = (clients?.items ?? []).map((c) => ({ value: c.id, label: c.name }))
  const portOptions = (ports ?? []).map((p) => ({ value: p.id, label: p.name }))
  const userOptions = [
    { value: '', label: 'Selecionar responsável...' },
    ...(users?.items ?? []).map((u) => ({ value: u.id, label: u.full_name })),
  ]

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ImportFormValues>({
    resolver: zodResolver(importSchema),
    defaultValues: { date: today },
  })

  useEffect(() => {
    if (!isEditing && user) {
      setValue('collaborator_id', user.id)
    }
  }, [isEditing, user, setValue])

  useEffect(() => {
    if (record) {
      reset({
        client_id: record.client.id,
        reference: record.reference ?? '',
        date: record.date ?? '',
        status: record.status,
        cargo_type: (record.cargo_type as 'FCL' | 'LCL' | '') ?? '',
        importer: record.importer ?? '',
        ce_mercante: record.ce_mercante ?? '',
        awb_bl: record.awb_bl ?? '',
        di_duimp_dta: record.di_duimp_dta ?? '',
        numero_li: record.numero_li ?? '',
        dta: record.dta ?? '',
        dtc: record.dtc ?? '',
        shipping_company: record.shipping_company ?? '',
        vessel: record.vessel ?? '',
        port_id: record.port_id ?? '',
        eta: record.eta ?? '',
        etb: record.etb ?? '',
        containers: record.containers ?? '',
        local_ioa: record.local_ioa ?? '',
        lpco_packaging: record.lpco_packaging ?? '',
        lpco_number: record.lpco_number ?? '',
        collaborator_id: record.collaborator?.id ?? '',
        map_type: record.map_type ?? '',
        modality: record.modality ?? '',
        map_packaging_released: record.map_packaging_released,
        selected_unit: record.selected_unit ?? '',
        inspection_date: record.inspection_date ?? '',
        cargo_presence_date: record.cargo_presence_date ?? '',
        released_at: record.released_at ?? '',
        comex_informed_date: record.comex_informed_date ?? '',
        comex_released: record.comex_released,
        guide_sent: record.guide_sent,
        finalized_at: record.finalized_at ?? '',
        observations: record.observations ?? '',
      })
    }
  }, [record, reset])

  async function onSubmit(values: ImportFormValues) {
    setSubmitError(null)
    const clean = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== '' && v !== undefined),
    ) as Partial<ImportRecordPayload>

    try {
      if (isEditing) {
        await updateImport.mutateAsync(clean)
      } else {
        await createImport.mutateAsync({ ...clean, client_id: values.client_id } as ImportRecordPayload)
      }
      navigate('/imports')
    } catch (err) {
      setSubmitError(parseApiError(err))
    }
  }

  if (isEditing && loadingRecord) {
    return <div className="flex justify-center py-12"><Spinner /></div>
  }

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={isEditing ? 'Editar ficha de importação' : 'Nova ficha de importação'}
        backTo="/imports"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Identificação */}
        <div className="form-section">
          <p className="form-section-title">Identificação</p>
          <div className="grid grid-cols-2 gap-4">
            <Controller
              control={control}
              name="client_id"
              render={({ field }) => (
                <ClientCombobox
                  label="Cliente *"
                  value={field.value}
                  onChange={field.onChange}
                  clients={clientOptions}
                  error={errors.client_id?.message}
                />
              )}
            />
            <Input label="Referência" {...register('reference')} />
            <Input label="Data" type="date" disabled {...register('date')} />
            <Select label="Status" options={STATUS_OPTIONS} {...register('status')} />
            <Select label="Modalidade" options={MODALITY_OPTIONS} {...register('modality')} />
            <Input label="Importador" {...register('importer')} />
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Tipo de carga</p>
              <div className="flex gap-4">
                {(['FCL', 'LCL'] as const).map((opt) => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value={opt}
                      {...register('cargo_type')}
                      className="h-4 w-4 border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm text-slate-700">{opt}</span>
                  </label>
                ))}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value=""
                    {...register('cargo_type')}
                    className="h-4 w-4 border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm text-slate-500">Nenhum</span>
                </label>
              </div>
            </div>
            {isAdmin ? (
              <Select
                label="Responsável"
                options={userOptions}
                {...register('collaborator_id')}
              />
            ) : (
              <Input
                label="Responsável"
                value={user?.full_name ?? ''}
                disabled
                readOnly
              />
            )}
          </div>
        </div>

        {/* Documentos */}
        <div className="form-section">
          <p className="form-section-title">Documentação</p>
          <div className="grid grid-cols-3 gap-4">
            <Input label="CE Mercante" {...register('ce_mercante')} />
            <Input label="AWB / BL" {...register('awb_bl')} />
            <Input label="DI / DUIMP / DTA" {...register('di_duimp_dta')} />
            <Input label="Número LI" {...register('numero_li')} />
            <Input label="DTA" {...register('dta')} />
            <Input label="DTC" {...register('dtc')} />
          </div>
        </div>

        {/* Logística */}
        <div className="form-section">
          <p className="form-section-title">Logística</p>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Navio" {...register('vessel')} />
            <Controller
              control={control}
              name="port_id"
              render={({ field }) => (
                <PortCombobox
                  label="Porto de Entrada"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  ports={portOptions}
                  canCreate={isAdmin}
                />
              )}
            />
            <Input label="Armador" {...register('shipping_company')} />
            <Input label="ETA" type="date" {...register('eta')} />
            <Input label="ETB" type="date" {...register('etb')} />
            <div className="col-span-3">
              <Textarea label="Containers" rows={2} {...register('containers')} />
            </div>
            <div className="col-span-3">
              <Input label="Local de armazenamento" {...register('local_ioa')} />
            </div>
          </div>
        </div>

        {/* LPCO / Mapa */}
        <div className="form-section">
          <p className="form-section-title">LPCO e Mapa</p>
          <div className="grid grid-cols-3 gap-4">
            <Input label="LPCO Embalagem" {...register('lpco_packaging')} />
            <Input label="Número LPCO" {...register('lpco_number')} />
            <Select label="Tipo de mapa" options={MAP_OPTIONS} {...register('map_type')} />
            <Input label="Unidade selecionada" {...register('selected_unit')} />
            <Input label="Data de vistoria" type="date" {...register('inspection_date')} />
            <label className="flex items-center gap-2 col-span-2 mt-6">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-600" {...register('map_packaging_released')} />
              <span className="text-sm text-slate-700">Mapa embalagem liberado</span>
            </label>
          </div>
        </div>

        {/* Datas de liberação */}
        <div className="form-section">
          <p className="form-section-title">Liberação e finalização</p>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Data presença da carga" type="date" {...register('cargo_presence_date')} />
            <Input label="Liberado em" type="date" {...register('released_at')} />
            <Input label="Comex informado em" type="date" {...register('comex_informed_date')} />
            <Input label="Finalizado em" type="datetime-local" {...register('finalized_at')} />
            <label className="flex items-center gap-2 mt-6">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-600" {...register('comex_released')} />
              <span className="text-sm text-slate-700">Comex liberado</span>
            </label>
            <label className="flex items-center gap-2 mt-6">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-600" {...register('guide_sent')} />
              <span className="text-sm text-slate-700">Guia enviada</span>
            </label>
          </div>
        </div>

        {/* Observações */}
        <div className="form-section">
          <p className="form-section-title">Observações</p>
          <Textarea label="Observações" rows={4} {...register('observations')} />
        </div>

        {submitError && (
          <div className="rounded-md bg-red-50 border border-red-300 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/imports')}>
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEditing ? 'Salvar alterações' : 'Criar ficha'}
          </Button>
        </div>
      </form>
    </div>
  )
}
