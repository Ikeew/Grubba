import { api } from '@/lib/axios'
import type { User } from '@/types/auth'
import type { UserCreatePayload } from '@/types/user'
import type { PaginatedResponse } from '@/types/common'

export const userService = {
  async list(
    params: { page?: number; page_size?: number; is_active?: boolean } = {},
  ): Promise<PaginatedResponse<User>> {
    const { data } = await api.get<PaginatedResponse<User>>('/users', { params })
    return data
  },

  async create(payload: UserCreatePayload): Promise<User> {
    const { data } = await api.post<User>('/users', payload)
    return data
  },

  async deactivate(id: string): Promise<void> {
    await api.delete(`/users/${id}`)
  },
}
