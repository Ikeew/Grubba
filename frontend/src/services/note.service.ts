import { api } from '@/lib/axios'
import type { Note, NotePayload } from '@/types/note'

export const noteService = {
  async listByExport(exportRecordId: string): Promise<Note[]> {
    const { data } = await api.get<Note[]>(`/export-records/${exportRecordId}/notes`)
    return data
  },

  async listByImport(importRecordId: string): Promise<Note[]> {
    const { data } = await api.get<Note[]>(`/import-records/${importRecordId}/notes`)
    return data
  },

  async create(payload: NotePayload): Promise<Note> {
    const { data } = await api.post<Note>('/notes', payload)
    return data
  },

  async update(noteId: string, content: string): Promise<Note> {
    const { data } = await api.patch<Note>(`/notes/${noteId}`, { content })
    return data
  },

  async remove(noteId: string): Promise<void> {
    await api.delete(`/notes/${noteId}`)
  },
}
