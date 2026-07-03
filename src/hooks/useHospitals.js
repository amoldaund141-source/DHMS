/**
 * useHospitals — fetch hospital list with filters
 * Falls back to mock data (placeholderData) when the backend is offline.
 */
import { useQuery } from '@tanstack/react-query'
import { hospitalsApi, districtsApi, testsApi } from '@/lib/api'
import {
  MOCK_HOSPITALS,
  MOCK_DISTRICT_STATS,
  MOCK_FOOTFALL_TREND,
  MOCK_BED_TREND,
  MOCK_TEST_AVAILABILITY,
} from '@/mocks/hospitals.mock'

/** List of hospitals, optionally filtered by area / type / status / lat / lng */
export function useHospitals(filters = {}) {
  return useQuery({
    queryKey: ['hospitals', filters],
    queryFn: () => hospitalsApi.list(filters).then((r) => r.data),
  })
}

/** Single hospital detail by ID */
export function useHospital(id) {
  return useQuery({
    queryKey: ['hospital', id],
    queryFn: () => hospitalsApi.detail(id).then((r) => r.data),
    enabled: !!id,
  })
}

/** District-wide aggregate stats (total hospitals, avg stock health, etc.) */
export function useDistrictStats() {
  return useQuery({
    queryKey: ['district-stats'],
    queryFn: () => districtsApi.stats().then((r) => r.data),
  })
}

/** 7-day footfall trend across all hospitals */
export function useFootfallTrend() {
  return useQuery({
    queryKey: ['footfall-trend'],
    queryFn: () => hospitalsApi.footfallTrend().then((r) => r.data),
  })
}

/** 7-day bed occupancy trend */
export function useBedTrend() {
  return useQuery({
    queryKey: ['bed-trend'],
    queryFn: () => hospitalsApi.bedTrend().then((r) => r.data),
  })
}

/** Diagnostic test availability for a hospital */
export function useTestAvailability(hospitalId) {
  return useQuery({
    queryKey: ['tests', hospitalId],
    queryFn: () => testsApi.list(hospitalId).then((r) => r.data),
    enabled: !!hospitalId,
  })
}
