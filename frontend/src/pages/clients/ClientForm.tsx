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

export default function ClientForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id

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
    if (client) reset(client)
  }, [client, reset])

  async function onSubmit(values: ClientFormValues) {
    if (isEditing) {
      await updateClient.mutateAsync(values)
    } else {
      await createClient.mutateAsync(values)
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
