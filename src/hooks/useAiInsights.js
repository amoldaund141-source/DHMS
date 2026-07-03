/**
 * useAiInsights — AI-generated insights hooks
 */
import { useQuery } from '@tanstack/react-query'
import { aiApi } from '@/lib/api'
import {
  MOCK_AI_INSIGHTS,
  MOCK_AI_FORECAST,
  MOCK_REDISTRIBUTION,
  MOCK_FLAGGED_HOSPITALS,
} from '@/mocks/hospitals.mock'

/** District-wide AI insights (summary paragraph + action items) */
export function useAiInsights(params = {}) {
  return useQuery({
    queryKey: ['ai-insights', params],
    queryFn: () => aiApi.insights(params).then((r) => r.data),
    staleTime: 1000 * 60 * 10, // AI responses are expensive — cache 10 min
  })
}

/** AI-generated stock forecast for a hospital */
export function useAiForecast(params = {}) {
  return useQuery({
    queryKey: ['ai-forecast', params],
    queryFn: () => aiApi.forecast(params).then((r) => r.data),
    staleTime: 1000 * 60 * 10,
    enabled: !!(params.hospital_id),
  })
}

/** AI redistribution suggestions (move supplies between hospitals) */
export function useRedistribution(params = {}) {
  return useQuery({
    queryKey: ['redistribution', params],
    queryFn: () => aiApi.redistribution(params).then((r) => r.data),
    staleTime: 1000 * 60 * 10,
  })
}

/** AI-flagged underperforming hospitals */
export function useFlaggedHospitals(params = {}) {
  return useQuery({
    queryKey: ['ai-flagged', params],
    queryFn: () => aiApi.flagged(params).then((r) => r.data),
    staleTime: 1000 * 60 * 10,
  })
}
