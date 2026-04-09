import { api } from '@/lib/axios'
import type { Port, PortCreatePayload, PortUpdatePayload } from '@/types/port'

export const portService = {
  async list(): Promise<Port[]> {
    const { data } = await api.get<Port[]>('/ports')
    return data
  },

  async create(payload: PortCreatePayload): Promise<Port> {
    const { data } = await api.post<Port>('/ports', payload)
    return data
  },

  async update(id: string, payload: PortUpdatePayload): Promise<Port> {
    const { data } = await api.patch<Port>(`/ports/${id}`, payload)
    return data
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/ports/${id}`)
  },
}
