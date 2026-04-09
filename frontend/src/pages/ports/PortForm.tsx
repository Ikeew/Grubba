import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { usePortList, useCreatePort, useUpdatePort } from '@/hooks/usePorts'
import { PageHeader } from '@/components/layout/PageHeader'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

const portSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
})
type PortFormValues = z.infer<typeof portSchema>

export default function PortForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id

  const { data: ports, isLoading } = usePortList()
  const port = ports?.find((p) => p.id === id)

  const createPort = useCreatePort()
  const updatePort = useUpdatePort(id ?? '')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PortFormValues>({ resolver: zodResolver(portSchema) })

  useEffect(() => {
    if (port) reset({ name: port.name })
  }, [port, reset])

  async function onSubmit(values: PortFormValues) {
    if (isEditing) {
      await updatePort.mutateAsync(values)
    } else {
      await createPort.mutateAsync(values)
    }
    navigate('/ports')
  }

  if (isEditing && isLoading) {
    return <div className="flex justify-center py-12"><Spinner /></div>
  }

  return (
    <div className="max-w-md">
      <PageHeader
        title={isEditing ? 'Editar porto' : 'Novo porto'}
        backTo="/ports"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="form-section">
          <p className="form-section-title">Dados do porto</p>
          <Input label="Nome *" error={errors.name?.message} {...register('name')} />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/ports')}>
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEditing ? 'Salvar alterações' : 'Cadastrar porto'}
          </Button>
        </div>
      </form>
    </div>
  )
}
