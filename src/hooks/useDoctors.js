/**
 * useDoctors — doctor list and attendance hooks
 */
import { useQuery } from '@tanstack/react-query'
import { doctorsApi } from '@/lib/api'
import { MOCK_ATTENDANCE } from '@/mocks/attendance.mock'

/** All doctors at a hospital (with their latest attendance status) */
export function useDoctors(hospitalId) {
  return useQuery({
    queryKey: ['doctors', hospitalId],
    queryFn: () => doctorsApi.list(hospitalId).then((r) => r.data),
    enabled: !!hospitalId,
  })
}
