import { api } from '@/lib/axios'
import type { Client, ClientCreatePayload, ClientUpdatePayload } from '@/types/client'
import type { PaginatedResponse } from '@/types/common'

interface ListParams {
  page?: number
  page_size?: number
  search?: string
}

export const clientService = {
  async list(params: ListParams = {}): Promise<PaginatedResponse<Client>> {
    const { data } = await api.get<PaginatedResponse<Client>>('/clients', { params })
    return data
  },

  async getById(id: string): Promise<Client> {
    const { data } = await api.get<Client>(`/clients/${id}`)
    return data
  },

  async create(payload: ClientCreatePayload): Promise<Client> {
    const { data } = await api.post<Client>('/clients', payload)
    return data
  },

  async update(id: string, payload: ClientUpdatePayload): Promise<Client> {
    const { data } = await api.patch<Client>(`/clients/${id}`, payload)
    return data
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/clients/${id}`)
  },
}
