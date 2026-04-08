import { api } from '@/lib/axios'
import type { User } from '@/types/auth'
import type { PaginatedResponse } from '@/types/common'

export const userService = {
  async list(params: { page?: number; page_size?: number } = {}): Promise<PaginatedResponse<User>> {
    const { data } = await api.get<PaginatedResponse<User>>('/users', { params })
    return data
  },
}
