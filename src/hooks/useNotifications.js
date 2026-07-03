/**
 * useNotifications — notification hooks (list + mark read)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '@/lib/api'
import { MOCK_NOTIFICATIONS } from '@/mocks/notifications.mock'

/** Fetch notifications, optionally filtered to unread only */
export function useNotifications(params = {}) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationsApi.list(params).then((r) => r.data),
    refetchInterval: 60_000, // poll every 60s for new notifications
  })
}

/** Mutation: mark a single notification read */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

/** Mutation: mark ALL notifications read */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
