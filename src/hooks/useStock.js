/**
 * useStock — stock management hooks
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { stockApi } from '@/lib/api'
import { MOCK_STOCK } from '@/mocks/stock.mock'

/** Full stock list for a hospital */
export function useStock(hospitalId) {
  return useQuery({
    queryKey: ['stock', hospitalId],
    queryFn: () => stockApi.list(hospitalId).then((r) => r.data),
    enabled: !!hospitalId,
  })
}

/** Stock summary (low-stock count, healthy count) */
export function useStockSummary(hospitalId) {
  return useQuery({
    queryKey: ['stock-summary', hospitalId],
    queryFn: () => stockApi.summary(hospitalId).then((r) => r.data),
    enabled: !!hospitalId,
  })
}

/** Mutation: update a single stock item */
export function useUpdateStock(hospitalId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, data }) => stockApi.update(hospitalId, itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock', hospitalId] })
      queryClient.invalidateQueries({ queryKey: ['stock-summary', hospitalId] })
    },
  })
}
