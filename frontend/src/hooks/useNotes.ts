import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { noteService } from '@/services/note.service'
import type { NotePayload } from '@/types/note'

export const NOTE_KEYS = {
  byExport: (id: string) => ['notes', 'export', id] as const,
  byImport: (id: string) => ['notes', 'import', id] as const,
}

export function useExportNotes(exportRecordId: string) {
  return useQuery({
    queryKey: NOTE_KEYS.byExport(exportRecordId),
    queryFn: () => noteService.listByExport(exportRecordId),
    enabled: !!exportRecordId,
  })
}

export function useImportNotes(importRecordId: string) {
  return useQuery({
    queryKey: NOTE_KEYS.byImport(importRecordId),
    queryFn: () => noteService.listByImport(importRecordId),
    enabled: !!importRecordId,
  })
}

export function useCreateNote(options: { exportRecordId?: string; importRecordId?: string }) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: NotePayload) => noteService.create(payload),
    onSuccess: () => {
      if (options.exportRecordId)
        qc.invalidateQueries({ queryKey: NOTE_KEYS.byExport(options.exportRecordId) })
      if (options.importRecordId)
        qc.invalidateQueries({ queryKey: NOTE_KEYS.byImport(options.importRecordId) })
    },
  })
}

export function useDeleteNote(options: { exportRecordId?: string; importRecordId?: string }) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (noteId: string) => noteService.remove(noteId),
    onSuccess: () => {
      if (options.exportRecordId)
        qc.invalidateQueries({ queryKey: NOTE_KEYS.byExport(options.exportRecordId) })
      if (options.importRecordId)
        qc.invalidateQueries({ queryKey: NOTE_KEYS.byImport(options.importRecordId) })
    },
  })
}
