import { api } from '@/lib/axios'
import type {
  DeconsolidationFile,
  DeconsolidationRecord,
  DeconsolidationRecordPayload,
} from '@/types/deconsolidation'
import type { DeconsolidationStatus, FlagColor, PaginatedResponse } from '@/types/common'

interface ListParams {
  page?: number
  page_size?: number
  client_id?: string
  status?: DeconsolidationStatus[]
  collaborator_id?: string
  search?: string
  date_from?: string
  date_to?: string
  completed_from?: string
  completed_to?: string
  created_from?: string
  created_to?: string
  billing_completed?: boolean
}

export const deconsolidationService = {
  async list(params: ListParams = {}): Promise<PaginatedResponse<DeconsolidationRecord>> {
    const { data } = await api.get<PaginatedResponse<DeconsolidationRecord>>(
      '/deconsolidation-records',
      { params },
    )
    return data
  },

  async getById(id: string): Promise<DeconsolidationRecord> {
    const { data } = await api.get<DeconsolidationRecord>(`/deconsolidation-records/${id}`)
    return data
  },

  async create(payload: DeconsolidationRecordPayload): Promise<DeconsolidationRecord> {
    const { data } = await api.post<DeconsolidationRecord>('/deconsolidation-records', payload)
    return data
  },

  async update(
    id: string,
    payload: Partial<DeconsolidationRecordPayload>,
  ): Promise<DeconsolidationRecord> {
    const { data } = await api.patch<DeconsolidationRecord>(
      `/deconsolidation-records/${id}`,
      payload,
    )
    return data
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/deconsolidation-records/${id}`)
  },

  async setFlag(id: string, color: FlagColor | null): Promise<{ flag_color: FlagColor | null }> {
    const { data } = await api.post<{ flag_color: FlagColor | null }>(
      `/deconsolidation-records/${id}/flag`,
      { color },
    )
    return data
  },

  async toggleBilling(id: string): Promise<{ billing_completed: boolean }> {
    const { data } = await api.post<{ billing_completed: boolean }>(
      `/deconsolidation-records/${id}/billing`,
    )
    return data
  },

  async listFiles(id: string): Promise<DeconsolidationFile[]> {
    const { data } = await api.get<DeconsolidationFile[]>(
      `/deconsolidation-records/${id}/files`,
    )
    return data
  },

  async uploadFile(id: string, file: File): Promise<DeconsolidationFile> {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post<DeconsolidationFile>(
      `/deconsolidation-records/${id}/files`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return data
  },

  async removeFile(fileId: string): Promise<void> {
    await api.delete(`/deconsolidation-records/files/${fileId}`)
  },
}
