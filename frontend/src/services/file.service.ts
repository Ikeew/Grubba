import { api } from '@/lib/axios'
import type { ImportFile } from '@/types/file'

export const fileService = {
  async list(importRecordId: string): Promise<ImportFile[]> {
    const { data } = await api.get<ImportFile[]>(`/import-records/${importRecordId}/files`)
    return data
  },

  async upload(importRecordId: string, file: File): Promise<ImportFile> {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post<ImportFile>(
      `/import-records/${importRecordId}/files`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return data
  },

  async remove(fileId: string): Promise<void> {
    await api.delete(`/import-records/files/${fileId}`)
  },
}
