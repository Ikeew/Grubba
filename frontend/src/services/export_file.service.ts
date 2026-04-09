import { api } from '@/lib/axios'
import type { ExportFile } from '@/types/file'

export const exportFileService = {
  async list(exportRecordId: string): Promise<ExportFile[]> {
    const { data } = await api.get<ExportFile[]>(`/export-records/${exportRecordId}/files`)
    return data
  },

  async upload(exportRecordId: string, file: File): Promise<ExportFile> {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post<ExportFile>(
      `/export-records/${exportRecordId}/files`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return data
  },

  async remove(fileId: string): Promise<void> {
    await api.delete(`/export-records/files/${fileId}`)
  },
}
