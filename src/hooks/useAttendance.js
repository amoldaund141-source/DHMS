/**
 * useAttendance — doctor attendance hooks
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { attendanceApi, doctorsApi } from '@/lib/api'
import { MOCK_ATTENDANCE, MOCK_ATTENDANCE_HISTORY } from '@/mocks/attendance.mock'

/** Today's doctor attendance for a hospital */
export function useAttendance(hospitalId, params = {}) {
  return useQuery({
    queryKey: ['attendance', hospitalId, params],
    queryFn: () => attendanceApi.list(hospitalId, params).then((r) => r.data),
    enabled: !!hospitalId,
  })
}

/** 7-day attendance history (for bar chart) */
export function useAttendanceHistory(hospitalId) {
  return useQuery({
    queryKey: ['attendance-history', hospitalId],
    queryFn: () => attendanceApi.history(hospitalId).then((r) => r.data),
    enabled: !!hospitalId,
  })
}

/** Mutation: mark a doctor present or absent */
export function useMarkAttendance(hospitalId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ doctorId, status }) =>
      doctorsApi.markAttendance(hospitalId, doctorId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', hospitalId] })
      queryClient.invalidateQueries({ queryKey: ['attendance-history', hospitalId] })
    },
  })
}
