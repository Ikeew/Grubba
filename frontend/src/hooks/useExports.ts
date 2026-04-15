import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { exportService } from '@/services/export.service'
import type { ExportRecordPayload } from '@/types/export'
import type { ExportStatus } from '@/types/common'

export const EXPORT_KEYS = {
  all: ['exports'] as const,
  list: (params: object) => ['exports', 'list', params] as const,
  detail: (id: string) => ['exports', id] as const,
}

export function useExportList(params: {
  page?: number
  page_size?: number
  client_id?: string
  status?: ExportStatus[]
  collaborator_id?: string
  search?: string
  vessel?: string
  date_from?: string
  date_to?: string
  ets_from?: string
  ets_to?: string
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

export function useToggleExportFlag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => exportService.toggleFlag(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: EXPORT_KEYS.all }),
  })
}

export function useToggleExportBilling() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => exportService.toggleBilling(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: EXPORT_KEYS.all }),
  })
}

export function useUpdateExportField() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ExportRecordPayload> }) =>
      exportService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: EXPORT_KEYS.all }),
  })
}
