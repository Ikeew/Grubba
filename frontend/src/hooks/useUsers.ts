import { useQuery } from '@tanstack/react-query'
import { userService } from '@/services/user.service'

export function useUserList(enabled = true) {
  return useQuery({
    queryKey: ['users', 'list'],
    queryFn: () => userService.list({ page_size: 100 }),
    enabled,
  })
}
