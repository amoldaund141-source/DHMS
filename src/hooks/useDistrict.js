/**
 * useDistrict — district data hooks (admin-facing)
 */
import { useQuery } from '@tanstack/react-query'
import { districtsApi, hospitalsApi } from '@/lib/api'
import { MOCK_DISTRICT_STATS } from '@/mocks/hospitals.mock'

/** All districts (state admin only) */
export function useDistricts() {
  return useQuery({
    queryKey: ['districts'],
    queryFn: () => districtsApi.list().then((r) => r.data),
  })
}

/** Single district detail */
export function useDistrict(id) {
  return useQuery({
    queryKey: ['district', id],
    queryFn: () => districtsApi.detail(id).then((r) => r.data),
    enabled: !!id,
  })
}

/** District-wide aggregate stats from the dedicated endpoint */
export function useDistrictStats() {
  return useQuery({
    queryKey: ['district-stats'],
    queryFn: () => hospitalsApi.footfallTrend().then((r) => r.data),
  })
}
