import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { getAccuracy } from '@/api'
import type { Accuracy } from './types.ts'

// Helper Functions
export function formatAccuracy(value: number): string {
  return value.toFixed(2);
}

export interface UseAccuracyReq {
  product?: string
  days?: 1 | 5 | 10 | 15 | 20
}

export function useAccuracy(
  opts: UseAccuracyReq = {},
  queryOptions?: UseQueryOptions<Accuracy[], Error>
) {
  const { product, days } = opts
  const queryKey = ['accuracy', product, days] as const

  return useQuery<Accuracy[], Error>({
    queryKey,
    queryFn: () => getAccuracy(product, days),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...queryOptions,
  })
}