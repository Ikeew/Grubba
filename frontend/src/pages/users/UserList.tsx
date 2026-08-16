import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserList, useDeactivateUser } from '@/hooks/useUsers'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import type { User } from '@/types/auth'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  collaborator: 'Colaborador',
}

export default function UserList() {
  const navigate = useNavigate()
  const [toDeactivate, setToDeactivate] = useState<User | null>(null)

  const { data, isLoading } = useUserList()
  const deactivateUser = useDeactivateUser()

  async function handleDeactivate() {
    if (!toDeactivate) return
    await deactivateUser.mutateAsync(toDeactivate.id)
    setToDeactivate(null)
  }

  const users = data?.items ?? []

  return (
    <div>
      <PageHeader
        title="Usuários"
        description="Gerenciamento de usuários do sistema"
        action={{ label: 'Novo usuário', onClick: () => navigate('/users/new') }}
      />

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : !users.length ? (
          <EmptyState />
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="table-header-cell">Nome</th>
                <th className="table-header-cell">Email</th>
                <th className="table-header-cell">Perfil</th>
                <th className="table-header-cell w-36">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="table-row">
                  <td className="table-cell font-medium">{user.full_name}</td>
                  <td className="table-cell">{user.email}</td>
                  <td className="table-cell">{ROLE_LABELS[user.role] ?? user.role}</td>
                  <td className="table-cell">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500"
                      onClick={() => setToDeactivate(user)}
                    >
                      ×
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {toDeactivate && (
        <ConfirmModal
          title="Desativar usuário"
          description={`Desativar o usuário "${toDeactivate.full_name}"?`}
          onConfirm={handleDeactivate}
          onCancel={() => setToDeactivate(null)}
          loading={deactivateUser.isPending}
        />
      )}
    </div>
  )
}
