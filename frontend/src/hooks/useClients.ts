import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { clientService } from '@/services/client.service'
import type { ClientCreatePayload, ClientUpdatePayload } from '@/types/client'

export const CLIENT_KEYS = {
  all: ['clients'] as const,
  list: (params: object) => ['clients', 'list', params] as const,
  detail: (id: string) => ['clients', id] as const,
}

export function useClientList(params: { page?: number; page_size?: number; search?: string } = {}) {
  return useQuery({
    queryKey: CLIENT_KEYS.list(params),
    queryFn: () => clientService.list(params),
  })
}

export function useClient(id: string) {
  return useQuery({
    queryKey: CLIENT_KEYS.detail(id),
    queryFn: () => clientService.getById(id),
    enabled: !!id,
  })
}

export function useCreateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ClientCreatePayload) => clientService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENT_KEYS.all }),
  })
}

export function useUpdateClient(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ClientUpdatePayload) => clientService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CLIENT_KEYS.all })
      qc.invalidateQueries({ queryKey: CLIENT_KEYS.detail(id) })
    },
  })
}

export function useDeleteClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => clientService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENT_KEYS.all }),
  })
}
