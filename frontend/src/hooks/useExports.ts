import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { exportService } from '@/services/export.service'
import type { ExportRecordPayload } from '@/types/export'
import type { RecordStatus } from '@/types/common'

export const EXPORT_KEYS = {
  all: ['exports'] as const,
  list: (params: object) => ['exports', 'list', params] as const,
  detail: (id: string) => ['exports', id] as const,
}

export function useExportList(params: {
  page?: number
  page_size?: number
  client_id?: string
  status?: RecordStatus
  search?: string
  date_from?: string
  date_to?: string
} = {}) {
  return useQuery({
    queryKey: EXPORT_KEYS.list(params),
    queryFn: () => exportService.list(params),
  })
}

export function useExport(id: string) {
  return useQuery({
    queryKey: EXPORT_KEYS.detail(id),
    queryFn: () => exportService.getById(id),
    enabled: !!id,
  })
}

export function useCreateExport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ExportRecordPayload) => exportService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: EXPORT_KEYS.all }),
  })
}

export function useUpdateExport(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<ExportRecordPayload>) => exportService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EXPORT_KEYS.all })
      qc.invalidateQueries({ queryKey: EXPORT_KEYS.detail(id) })
    },
  })
}

export function useDeleteExport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => exportService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: EXPORT_KEYS.all }),
  })
}
