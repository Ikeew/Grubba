import { api } from '@/lib/axios'
import type { ImportRecord, ImportRecordPayload } from '@/types/import'
import type { ImportStatus, PaginatedResponse } from '@/types/common'

interface ListParams {
  page?: number
  page_size?: number
  client_id?: string
  status?: ImportStatus
  collaborator_id?: string
  search?: string
  date_from?: string
  date_to?: string
  etb_from?: string
  etb_to?: string
}

export const importService = {
  async list(params: ListParams = {}): Promise<PaginatedResponse<ImportRecord>> {
    const { data } = await api.get<PaginatedResponse<ImportRecord>>('/import-records', { params })
    return data
  },

  async getById(id: string): Promise<ImportRecord> {
    const { data } = await api.get<ImportRecord>(`/import-records/${id}`)
    return data
  },

  async create(payload: ImportRecordPayload): Promise<ImportRecord> {
    const { data } = await api.post<ImportRecord>('/import-records', payload)
    return data
  },

  async update(id: string, payload: Partial<ImportRecordPayload>): Promise<ImportRecord> {
    const { data } = await api.patch<ImportRecord>(`/import-records/${id}`, payload)
    return data
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/import-records/${id}`)
  },

  async toggleFlag(id: string): Promise<{ flagged: boolean }> {
    const { data } = await api.post<{ flagged: boolean }>(`/import-records/${id}/flag`)
    return data
  },
}
