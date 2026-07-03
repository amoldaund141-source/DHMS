/**
 * useBeds — bed occupancy hooks
 */
import { useQuery } from '@tanstack/react-query'
import { bedsApi } from '@/lib/api'

// Inline placeholder since beds come embedded inside hospital detail
const BED_PLACEHOLDER = {
  general: { total: 20, occupied: 14 },
  semi:    { total: 10, occupied: 7 },
  special: { total: 5,  occupied: 2 },
}

/** Bed summary for a single hospital */
export function useBeds(hospitalId) {
  return useQuery({
    queryKey: ['beds', hospitalId],
    queryFn: () => bedsApi.summary(hospitalId).then((r) => r.data),
    enabled: !!hospitalId,
  })
}
