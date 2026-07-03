/**
 * useAppointments — appointment hooks for staff + patient roles
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { appointmentsApi } from '@/lib/api'
import { MOCK_APPOINTMENTS, MOCK_SLOTS } from '@/mocks/appointments.mock'

/** List appointments (role-scoped on the backend) */
export function useAppointments(params = {}) {
  return useQuery({
    queryKey: ['appointments', params],
    queryFn: () => appointmentsApi.list(params).then((r) => r.data),
  })
}

/** Available slots for a hospital / doctor / date */
export function useSlots(params = {}) {
  return useQuery({
    queryKey: ['slots', params],
    queryFn: () => appointmentsApi.slots(params).then((r) => r.data),
    enabled: !!(params.hospitalId && params.doctorId && params.date),
  })
}

/** Mutation: book a new appointment */
export function useBookAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => appointmentsApi.book(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['slots'] })
    },
  })
}

/** Mutation: update appointment status (confirm / cancel) */
export function useUpdateAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => appointmentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
  })
}
