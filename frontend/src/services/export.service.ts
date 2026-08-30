import { api } from '@/lib/axios'
import type { ExportRecord, ExportRecordPayload } from '@/types/export'
import type { ExportStatus, FlagColor, PaginatedResponse } from '@/types/common'

interface ListParams {
  page?: number
  page_size?: number
  client_id?: string
  status?: ExportStatus[]
  collaborator_id?: string
  search?: string
  vessel?: string
  date_from?: string
  date_to?: string
  ets_from?: string
  ets_to?: string
  completed_from?: string
  completed_to?: string
  created_from?: string
  created_to?: string
  billing_completed?: boolean
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

  async setFlag(id: string, color: FlagColor | null): Promise<{ flag_color: FlagColor | null }> {
    const { data } = await api.post<{ flag_color: FlagColor | null }>(
      `/export-records/${id}/flag`,
      { color },
    )
    return data
  },

  async toggleBilling(id: string): Promise<{ billing_completed: boolean }> {
    const { data } = await api.post<{ billing_completed: boolean }>(`/export-records/${id}/billing`)
    return data
  },
}
