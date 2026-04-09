import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { portService } from '@/services/port.service'
import type { PortCreatePayload, PortUpdatePayload } from '@/types/port'

export const PORT_KEYS = {
  all: ['ports'] as const,
  list: () => ['ports', 'list'] as const,
}

export function usePortList() {
  return useQuery({
    queryKey: PORT_KEYS.list(),
    queryFn: () => portService.list(),
  })
}

export function useCreatePort() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: PortCreatePayload) => portService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: PORT_KEYS.all }),
  })
}

export function useUpdatePort(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: PortUpdatePayload) => portService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: PORT_KEYS.all }),
  })
}

export function useDeletePort() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => portService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PORT_KEYS.all }),
  })
}
