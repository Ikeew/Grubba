import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { exportFileService } from '@/services/export_file.service'

export const EXPORT_FILE_KEYS = {
  byRecord: (id: string) => ['export-files', id] as const,
}

export function useExportFiles(exportRecordId: string) {
  return useQuery({
    queryKey: EXPORT_FILE_KEYS.byRecord(exportRecordId),
    queryFn: () => exportFileService.list(exportRecordId),
    enabled: !!exportRecordId,
  })
}

export function useUploadExportFile(exportRecordId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => exportFileService.upload(exportRecordId, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: EXPORT_FILE_KEYS.byRecord(exportRecordId) }),
  })
}

export function useDeleteExportFile(exportRecordId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (fileId: string) => exportFileService.remove(fileId),
    onSuccess: () => qc.invalidateQueries({ queryKey: EXPORT_FILE_KEYS.byRecord(exportRecordId) }),
  })
}
