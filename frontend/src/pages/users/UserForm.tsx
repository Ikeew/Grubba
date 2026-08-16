import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCreateUser } from '@/hooks/useUsers'
import { PageHeader } from '@/components/layout/PageHeader'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

const userSchema = z.object({
  full_name: z.string().min(1, 'Nome obrigatório'),
  email: z.string().min(1, 'Email obrigatório').email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  role: z.enum(['admin', 'collaborator']),
})
type UserFormValues = z.infer<typeof userSchema>

const ROLE_OPTIONS = [
  { value: 'collaborator', label: 'Colaborador' },
  { value: 'admin', label: 'Administrador' },
]

export default function UserForm() {
  const navigate = useNavigate()
  const createUser = useCreateUser()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: 'collaborator' },
  })

  async function onSubmit(values: UserFormValues) {
    await createUser.mutateAsync(values)
    navigate('/users')
  }

  return (
    <div className="max-w-md">
      <PageHeader title="Novo usuário" backTo="/users" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="form-section">
          <p className="form-section-title">Dados do usuário</p>
          <div className="space-y-4">
            <Input label="Nome *" error={errors.full_name?.message} {...register('full_name')} />
            <Input label="Email *" type="email" error={errors.email?.message} {...register('email')} />
            <Input
              label="Senha *"
              type="password"
              error={errors.password?.message}
              {...register('password')}
            />
            <Select label="Perfil *" options={ROLE_OPTIONS} {...register('role')} />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/users')}>
            Cancelar
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Cadastrar usuário
          </Button>
        </div>
      </form>
    </div>
  )
}
