import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useDeconsolidation,
  useCreateDeconsolidation,
  useUpdateDeconsolidation,
} from '@/hooks/useDeconsolidations'
import { useClientList } from '@/hooks/useClients'
import { useUserList } from '@/hooks/useUsers'
import {
  deconsolidationSchema,
  type DeconsolidationFormValues,
} from '@/schemas/deconsolidation.schema'
import { PageHeader } from '@/components/layout/PageHeader'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { ClientCombobox } from '@/components/ui/ClientCombobox'
import {
  DECONSOLIDATION_SERVICE_LABELS,
  type DeconsolidationRecordPayload,
  type DeconsolidationService,
} from '@/types/deconsolidation'
import {
  DECONSOLIDATION_MODALITY_LABELS,
  DECONSOLIDATION_STATUS_LABELS,
} from '@/utils/constants'
import { parseApiError } from '@/utils/parseApiError'

const STATUS_OPTIONS = Object.entries(DECONSOLIDATION_STATUS_LABELS).map(([v, l]) => ({
  value: v,
  label: l,
}))
const ALL_SERVICES = Object.entries(DECONSOLIDATION_SERVICE_LABELS) as [
  DeconsolidationService,
  string,
][]
const MODALITY_OPTIONS = [
  { value: '', label: 'Selecionar...' },
  ...Object.entries(DECONSOLIDATION_MODALITY_LABELS).map(([v, l]) => ({ value: v, label: l })),
]

export default function DeconsolidationForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id
  const { user } = useAuth()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const isAdmin = user?.role === 'admin'
  const canEditCompleted = isAdmin || user?.role === 'manager'
  const today = new Date().toISOString().slice(0, 10)

  const { data: record, isLoading: loadingRecord } = useDeconsolidation(id ?? '')
  const { data: clients } = useClientList({ page_size: 100 })
  const { data: users } = useUserList(isAdmin)
  const createRecord = useCreateDeconsolidation()
  const updateRecord = useUpdateDeconsolidation(id ?? '')

  const clientOptions = (clients?.items ?? []).map((c) => ({ value: c.id, label: c.name }))
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
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DeconsolidationFormValues>({
    resolver: zodResolver(deconsolidationSchema),
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
        modality: record.modality ?? '',
        consignee: record.consignee ?? '',
        services: record.services ?? [],
        ce_mercante: record.ce_mercante ?? '',
        master_bl: record.master_bl ?? '',
        house_bl: record.house_bl ?? '',
        agency: record.agency ?? '',
        shipping_company: record.shipping_company ?? '',
        collaborator_id: record.collaborator?.id ?? '',
        observations: record.observations ?? '',
      })
    }
  }, [record, reset])

  const selectedServices = (watch('services') ?? []) as DeconsolidationService[]

  function toggleService(service: DeconsolidationService) {
    const updated = selectedServices.includes(service)
      ? selectedServices.filter((s) => s !== service)
      : [...selectedServices, service]
    setValue('services', updated)
  }

  const isCompletedLocked = isEditing && record?.status === 'completed' && !canEditCompleted

  async function onSubmit(values: DeconsolidationFormValues) {
    setSubmitError(null)
    const clean = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== '' && v !== undefined),
    ) as Partial<DeconsolidationRecordPayload>

    try {
      if (isEditing) {
        await updateRecord.mutateAsync(clean)
      } else {
        await createRecord.mutateAsync({
          ...clean,
          client_id: values.client_id,
        } as DeconsolidationRecordPayload)
      }
      navigate('/deconsolidations')
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
        title={isEditing ? 'Editar ficha de desconsolidação' : 'Nova ficha de desconsolidação'}
        backTo="/deconsolidations"
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
            <Input label="Consignatário" {...register('consignee')} />
            {isAdmin ? (
              <Select label="Responsável" options={userOptions} {...register('collaborator_id')} />
            ) : (
              <Input label="Responsável" value={user?.full_name ?? ''} disabled readOnly />
            )}
          </div>
        </div>

        {/* Documentação */}
        <div className="form-section">
          <p className="form-section-title">Documentação</p>
          <div className="grid grid-cols-3 gap-4">
            <Input label="CE Mercante" {...register('ce_mercante')} />
            <Input label="AWB / BL Master" {...register('master_bl')} />
            <Input label="AWB / BL House" {...register('house_bl')} />
          </div>
        </div>

        {/* Serviços */}
        <div className="form-section">
          <p className="form-section-title">Serviços solicitados</p>
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
                      checked={selectedServices.includes(value)}
                      onChange={() => toggleService(value)}
                    />
                  )}
                />
                <span className="text-sm text-slate-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Representação */}
        <div className="form-section">
          <p className="form-section-title">Representação</p>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Agência representante" {...register('agency')} />
            <Input label="Armador" {...register('shipping_company')} />
          </div>
        </div>

        {/* Observações */}
        <div className="form-section">
          <p className="form-section-title">Observações</p>
          <Textarea label="Observações" rows={4} {...register('observations')} />
        </div>

        {isCompletedLocked && (
          <div className="rounded-md bg-amber-50 border border-amber-300 px-4 py-3 text-sm text-amber-800">
            Esta ficha está concluída e não pode ser editada. Apenas administradores podem fazer alterações.
          </div>
        )}

        {submitError && (
          <div className="rounded-md bg-red-50 border border-red-300 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/deconsolidations')}>
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting} disabled={isCompletedLocked}>
            {isEditing ? 'Salvar alterações' : 'Criar ficha'}
          </Button>
        </div>
      </form>
    </div>
  )
}
