import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { importService } from '@/services/import.service'
import type { ImportRecordPayload } from '@/types/import'
import type { ImportStatus } from '@/types/common'

export const IMPORT_KEYS = {
  all: ['imports'] as const,
  list: (params: object) => ['imports', 'list', params] as const,
  detail: (id: string) => ['imports', id] as const,
}

export function useImportList(params: {
  page?: number
  page_size?: number
  client_id?: string
  status?: ImportStatus
  search?: string
  date_from?: string
  date_to?: string
} = {}) {
  return useQuery({
    queryKey: IMPORT_KEYS.list(params),
    queryFn: () => importService.list(params),
  })
}

export function useImport(id: string) {
  return useQuery({
    queryKey: IMPORT_KEYS.detail(id),
    queryFn: () => importService.getById(id),
    enabled: !!id,
  })
}

export function useCreateImport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ImportRecordPayload) => importService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: IMPORT_KEYS.all }),
  })
}

export function useUpdateImport(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<ImportRecordPayload>) => importService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: IMPORT_KEYS.all })
      qc.invalidateQueries({ queryKey: IMPORT_KEYS.detail(id) })
    },
  })
}

export function useDeleteImport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => importService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: IMPORT_KEYS.all }),
  })
}

export function useToggleImportFlag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => importService.toggleFlag(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: IMPORT_KEYS.all }),
  })
}
