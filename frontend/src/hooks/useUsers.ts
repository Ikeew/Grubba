import { useQuery } from '@tanstack/react-query'
import { userService } from '@/services/user.service'

export function useUserList(enabled = true, activeOnly = true) {
  return useQuery({
    queryKey: ['users', 'list', { activeOnly }],
    queryFn: () =>
      userService.list({ page_size: 100, ...(activeOnly ? { is_active: true } : {}) }),
    enabled,
  })
}
