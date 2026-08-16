import type { UserRole } from './common'

export interface UserCreatePayload {
  email: string
  full_name: string
  password: string
  role: UserRole
}
