import { api } from '@/lib/axios'
import type { HistoryEntry } from '@/types/history'

export const historyService = {
  async listByExport(exportRecordId: string): Promise<HistoryEntry[]> {
    const { data } = await api.get<HistoryEntry[]>(`/export-records/${exportRecordId}/history`)
    return data
  },

  async listByImport(importRecordId: string): Promise<HistoryEntry[]> {
    const { data } = await api.get<HistoryEntry[]>(`/import-records/${importRecordId}/history`)
    return data
  },
}
