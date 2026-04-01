import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fileService } from '@/services/file.service'

export const FILE_KEYS = {
  byRecord: (id: string) => ['files', id] as const,
}

export function useFiles(importRecordId: string) {
  return useQuery({
    queryKey: FILE_KEYS.byRecord(importRecordId),
    queryFn: () => fileService.list(importRecordId),
    enabled: !!importRecordId,
  })
}

export function useUploadFile(importRecordId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => fileService.upload(importRecordId, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: FILE_KEYS.byRecord(importRecordId) }),
  })
}

export function useDeleteFile(importRecordId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (fileId: string) => fileService.remove(fileId),
    onSuccess: () => qc.invalidateQueries({ queryKey: FILE_KEYS.byRecord(importRecordId) }),
  })
}
