import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { userService } from '@/services/user.service'
import type { UserCreatePayload } from '@/types/user'

export const USER_KEYS = {
  all: ['users'] as const,
  list: (params: object) => ['users', 'list', params] as const,
}

export function useUserList(enabled = true, activeOnly = true) {
  return useQuery({
    queryKey: USER_KEYS.list({ activeOnly }),
    queryFn: () =>
      userService.list({ page_size: 100, ...(activeOnly ? { is_active: true } : {}) }),
    enabled,
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UserCreatePayload) => userService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: USER_KEYS.all }),
  })
}

export function useDeactivateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => userService.deactivate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: USER_KEYS.all }),
  })
}
