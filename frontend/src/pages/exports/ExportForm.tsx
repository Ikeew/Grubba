import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useExport, useCreateExport, useUpdateExport } from '@/hooks/useExports'
import { useClientList } from '@/hooks/useClients'
import { useUserList } from '@/hooks/useUsers'
import { usePortList } from '@/hooks/usePorts'
import { exportSchema, type ExportFormValues } from '@/schemas/export.schema'
import { PageHeader } from '@/components/layout/PageHeader'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { ClientCombobox } from '@/components/ui/ClientCombobox'
import { PortCombobox } from '@/components/ui/PortCombobox'
import { EXPORT_SERVICE_LABELS, type ExportRecordPayload, type ExportService } from '@/types/export'
import { EXPORT_STATUS_LABELS, MAP_TYPE_LABELS } from '@/utils/constants'
import { parseApiError } from '@/utils/parseApiError'

const STATUS_OPTIONS = Object.entries(EXPORT_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))
const MAP_OPTIONS = [{ value: '', label: 'Selecionar...' }, ...Object.entries(MAP_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))]
const ALL_SERVICES = Object.entries(EXPORT_SERVICE_LABELS) as [ExportService, string][]

export default function ExportForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id
  const { user } = useAuth()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const isAdmin = user?.role === 'admin'
  const today = new Date().toISOString().slice(0, 10)

  const { data: record, isLoading: loadingRecord } = useExport(id ?? '')
  const { data: clients } = useClientList({ page_size: 100 })
  const { data: users } = useUserList(isAdmin)
  const { data: ports } = usePortList()
  const createExport = useCreateExport()
  const updateExport = useUpdateExport(id ?? '')

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
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ExportFormValues>({
    resolver: zodResolver(exportSchema),
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
        lpco: record.lpco ?? '',
        vessel: record.vessel ?? '',
        booking: record.booking ?? '',
        port_id: record.port_id ?? '',
        due_25br: record.due_25br ?? '',
        eta: record.eta ?? '',
        ddl_carga: record.ddl_carga ?? '',
        shipping_company: record.shipping_company ?? '',
        etb: record.etb ?? '',
        et5: record.et5 ?? '',
        collaborator_id: record.collaborator?.id ?? '',
        map_type: record.map_type ?? '',
        services: record.services as ExportService[],
        selected_unit: record.selected_unit ?? '',
        new_seal: record.new_seal ?? '',
        inspection_date: record.inspection_date ?? '',
        comex_released_date: record.comex_released_date ?? '',
        finalized_at: record.finalized_at ?? '',
        observations: record.observations ?? '',
      })
    }
  }, [record, reset])

  async function onSubmit(values: ExportFormValues) {
    setSubmitError(null)
    const clean = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== '' && v !== undefined),
    ) as Partial<ExportRecordPayload>

    try {
      if (isEditing) {
        await updateExport.mutateAsync(clean)
      } else {
        await createExport.mutateAsync({ ...clean, client_id: values.client_id } as ExportRecordPayload)
      }
      navigate('/exports')
    } catch (err) {
      setSubmitError(parseApiError(err))
    }
  }

  const selectedServices = watch('services') ?? []

  function toggleService(service: ExportService) {
    const current = selectedServices as ExportService[]
    const updated = current.includes(service)
      ? current.filter((s) => s !== service)
      : [...current, service]
    setValue('services', updated)
  }

  if (isEditing && loadingRecord) {
    return <div className="flex justify-center py-12"><Spinner /></div>
  }

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={isEditing ? 'Editar ficha de exportação' : 'Nova ficha de exportação'}
        backTo="/exports"
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
            <Input label="Referência *" error={errors.reference?.message} {...register('reference')} />
            <Input label="Data" type="date" disabled {...register('date')} />
            <Select label="Status *" options={STATUS_OPTIONS} error={errors.status?.message} {...register('status')} />
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

        {/* Logística marítima */}
        <div className="form-section">
          <p className="form-section-title">Logística marítima</p>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Navio" {...register('vessel')} />
            <Controller
              control={control}
              name="port_id"
              render={({ field }) => (
                <PortCombobox
                  label="Porto"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  ports={portOptions}
                  canCreate={isAdmin}
                />
              )}
            />
            <Input label="Armador" {...register('shipping_company')} />
            <Input label="Booking" {...register('booking')} />
            <Input label="LPCO" {...register('lpco')} />
            <Input label="DUE 25BR" {...register('due_25br')} />
            <Input label="ETA" type="date" {...register('eta')} />
            <Input label="ETB" type="date" {...register('etb')} />
            <Input label="ET5" type="date" {...register('et5')} />
            <Input label="DDL Carga" type="date" {...register('ddl_carga')} />
          </div>
        </div>

        {/* Serviços */}
        <div className="form-section">
          <p className="form-section-title">Serviços solicitados *</p>
          <div className="grid grid-cols-2 gap-3">
            {ALL_SERVICES.map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 cursor-pointer">
                <Controller
                  control={control}
                  name="services"
                  render={() => (
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      checked={(selectedServices as ExportService[]).includes(value)}
                      onChange={() => toggleService(value)}
                    />
                  )}
                />
                <span className="text-sm text-slate-700">{label}</span>
              </label>
            ))}
          </div>
          {errors.services && (
            <p className="mt-1 text-sm text-red-600">{errors.services.message}</p>
          )}
        </div>

        {/* Vistoria / Mapa */}
        <div className="form-section">
          <p className="form-section-title">Vistoria e liberação</p>
          <div className="grid grid-cols-3 gap-4">
            <Select label="Tipo de mapa *" options={MAP_OPTIONS} error={errors.map_type?.message} {...register('map_type')} />
            <Input label="Unidade selecionada" {...register('selected_unit')} />
            <Input label="Novo lacre" {...register('new_seal')} />
            <Input label="Data da vistoria" type="date" {...register('inspection_date')} />
            <Input label="Comex liberado em" type="date" {...register('comex_released_date')} />
            <Input label="Data finalizada" type="datetime-local" {...register('finalized_at')} />
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
          <Button type="button" variant="secondary" onClick={() => navigate('/exports')}>
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
