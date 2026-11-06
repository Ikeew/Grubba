import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useClient, useCreateClient, useUpdateClient } from '@/hooks/useClients'
import { clientSchema, type ClientFormValues } from '@/schemas/client.schema'
import { PageHeader } from '@/components/layout/PageHeader'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/contexts/AuthContext'
import { canManageBilling } from '@/utils/permissions'
import { toApiMoney } from '@/utils/format'
import type { ClientCreatePayload } from '@/types/client'

const DEFAULT_VALUE_FIELDS = [
  { name: 'valor_padrao_importacao_maritimo', label: 'Importação · Marítimo' },
  { name: 'valor_padrao_importacao_aereo', label: 'Importação · Aéreo' },
  { name: 'valor_padrao_exportacao_maritimo', label: 'Exportação · Marítimo' },
  { name: 'valor_padrao_exportacao_aereo', label: 'Exportação · Aéreo' },
  { name: 'valor_padrao_desconsolidacao_maritimo', label: 'Desconsolidação · Marítimo' },
  { name: 'valor_padrao_desconsolidacao_aereo', label: 'Desconsolidação · Aéreo' },
] as const

export default function ClientForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id
  const { user } = useAuth()
  const canEditValues = canManageBilling(user)

  const { data: client, isLoading } = useClient(id ?? '')
  const createClient = useCreateClient()
  const updateClient = useUpdateClient(id ?? '')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({ resolver: zodResolver(clientSchema) })

  useEffect(() => {
    if (client) {
      reset({
        name: client.name,
        cnpj: client.cnpj ?? undefined,
        email: client.email ?? undefined,
        phone: client.phone ?? undefined,
        address: client.address ?? undefined,
        notes: client.notes ?? undefined,
        ...Object.fromEntries(DEFAULT_VALUE_FIELDS.map((f) => [f.name, client[f.name] ?? ''])),
      })
    }
  }, [client, reset])

  async function onSubmit(values: ClientFormValues) {
    const payload: ClientCreatePayload = { ...values }
    DEFAULT_VALUE_FIELDS.forEach((f) => { delete payload[f.name] })
    // Colaborador não envia os valores padrão (o backend recusaria)
    if (canEditValues) {
      DEFAULT_VALUE_FIELDS.forEach((f) => { payload[f.name] = toApiMoney(values[f.name]) })
    }
    if (isEditing) {
      await updateClient.mutateAsync(payload)
    } else {
      await createClient.mutateAsync(payload)
    }
    navigate('/clients')
  }

  if (isEditing && isLoading) {
    return <div className="flex justify-center py-12"><Spinner /></div>
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={isEditing ? 'Editar cliente' : 'Novo cliente'}
        backTo="/clients"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="form-section">
          <p className="form-section-title">Dados principais</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input label="Nome *" error={errors.name?.message} {...register('name')} />
            </div>
            <Input label="CNPJ" placeholder="00.000.000/0001-00" {...register('cnpj')} />
            <Input label="Telefone" {...register('phone')} />
            <div className="col-span-2">
              <Input label="E-mail" type="email" {...register('email')} />
            </div>
          </div>
        </div>

        <div className="form-section">
          <p className="form-section-title">Endereço e observações</p>
          <Textarea label="Endereço" rows={2} {...register('address')} />
          <Textarea label="Observações internas" rows={3} {...register('notes')} />
        </div>

        {canEditValues && (
          <div className="form-section">
            <p className="form-section-title">Valores padrão de serviço</p>
            <p className="text-xs text-slate-500">
              Pré-preenchem o valor de cada ficha ao gerar um recibo, conforme o tipo e o transporte. Deixe em branco para informar na hora.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {DEFAULT_VALUE_FIELDS.map((f) => (
                <Input
                  key={f.name}
                  label={`${f.label} (R$)`}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  error={errors[f.name]?.message}
                  {...register(f.name)}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/clients')}>
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEditing ? 'Salvar alterações' : 'Cadastrar cliente'}
          </Button>
        </div>
      </form>
    </div>
  )
}
