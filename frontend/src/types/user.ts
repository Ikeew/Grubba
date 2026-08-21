import type { UserRole } from './common'

export interface UserCreatePayload {
  email: string
  full_name: string
  password: string
  role: UserRole
}

export interface UserUpdatePayload {
  full_name?: string
  role?: UserRole
  is_active?: boolean
}
