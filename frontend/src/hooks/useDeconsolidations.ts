import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deconsolidationService } from '@/services/deconsolidation.service'
import type { DeconsolidationRecordPayload } from '@/types/deconsolidation'
import type { DeconsolidationStatus, FlagColor } from '@/types/common'

export const DECONSOLIDATION_KEYS = {
  all: ['deconsolidations'] as const,
  list: (params: object) => ['deconsolidations', 'list', params] as const,
  detail: (id: string) => ['deconsolidations', id] as const,
  files: (id: string) => ['deconsolidations', id, 'files'] as const,
}

export function useDeconsolidationList(params: {
  page?: number
  page_size?: number
  client_id?: string
  status?: DeconsolidationStatus[]
  collaborator_id?: string
  search?: string
  date_from?: string
  date_to?: string
  completed_from?: string
  completed_to?: string
  created_from?: string
  created_to?: string
  billing_completed?: boolean
} = {}) {
  return useQuery({
    queryKey: DECONSOLIDATION_KEYS.list(params),
    queryFn: () => deconsolidationService.list(params),
  })
}

export function useDeconsolidation(id: string) {
  return useQuery({
    queryKey: DECONSOLIDATION_KEYS.detail(id),
    queryFn: () => deconsolidationService.getById(id),
    enabled: !!id,
  })
}

export function useCreateDeconsolidation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: DeconsolidationRecordPayload) => deconsolidationService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: DECONSOLIDATION_KEYS.all }),
  })
}

export function useUpdateDeconsolidation(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<DeconsolidationRecordPayload>) =>
      deconsolidationService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DECONSOLIDATION_KEYS.all })
      qc.invalidateQueries({ queryKey: DECONSOLIDATION_KEYS.detail(id) })
    },
  })
}

export function useDeleteDeconsolidation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deconsolidationService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: DECONSOLIDATION_KEYS.all }),
  })
}

export function useSetDeconsolidationFlag() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, color }: { id: string; color: FlagColor | null }) =>
      deconsolidationService.setFlag(id, color),
    onSuccess: () => qc.invalidateQueries({ queryKey: DECONSOLIDATION_KEYS.all }),
  })
}

export function useToggleDeconsolidationBilling() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deconsolidationService.toggleBilling(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: DECONSOLIDATION_KEYS.all }),
  })
}

export function useUpdateDeconsolidationField() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<DeconsolidationRecordPayload> }) =>
      deconsolidationService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: DECONSOLIDATION_KEYS.all }),
  })
}

export function useDeconsolidationFiles(id: string) {
  return useQuery({
    queryKey: DECONSOLIDATION_KEYS.files(id),
    queryFn: () => deconsolidationService.listFiles(id),
    enabled: !!id,
  })
}

export function useUploadDeconsolidationFile(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => deconsolidationService.uploadFile(id, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: DECONSOLIDATION_KEYS.files(id) }),
  })
}

export function useDeleteDeconsolidationFile(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (fileId: string) => deconsolidationService.removeFile(fileId),
    onSuccess: () => qc.invalidateQueries({ queryKey: DECONSOLIDATION_KEYS.files(id) }),
  })
}
