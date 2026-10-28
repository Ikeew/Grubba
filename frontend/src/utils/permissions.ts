import type { User } from '@/types/auth'

/** Recibos e valores padrão de serviço: somente admin e manager. */
export function canManageBilling(user: Pick<User, 'role'> | null | undefined): boolean {
  return user?.role === 'admin' || user?.role === 'manager'
}
