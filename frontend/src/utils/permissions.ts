import type { User } from '@/types/auth'

/** Faturamento, recibos e valores padrão de serviço: somente admin. */
export function canManageBilling(user: Pick<User, 'role'> | null | undefined): boolean {
  return user?.role === 'admin'
}
