import { api } from '@/lib/axios'
import type { ExportRecord, ExportRecordPayload } from '@/types/export'
import type { PaginatedResponse, RecordStatus } from '@/types/common'

interface ListParams {
  page?: number
  page_size?: number
  client_id?: string
  status?: RecordStatus
  collaborator_id?: string
  search?: string
  date_from?: string
  date_to?: string
}

export const exportService = {
  async list(params: ListParams = {}): Promise<PaginatedResponse<ExportRecord>> {
    const { data } = await api.get<PaginatedResponse<ExportRecord>>('/export-records', { params })
    return data
  },

  async getById(id: string): Promise<ExportRecord> {
    const { data } = await api.get<ExportRecord>(`/export-records/${id}`)
    return data
  },

  async create(payload: ExportRecordPayload): Promise<ExportRecord> {
    const { data } = await api.post<ExportRecord>('/export-records', payload)
    return data
  },

  async update(id: string, payload: Partial<ExportRecordPayload>): Promise<ExportRecord> {
    const { data } = await api.patch<ExportRecord>(`/export-records/${id}`, payload)
    return data
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/export-records/${id}`)
  },
}
