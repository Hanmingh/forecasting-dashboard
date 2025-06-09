import { useQuery, UseQueryOptions, useQueries, UseQueryResult } from '@tanstack/react-query'
import { getForecast, getLatestForecasts } from '@/api'
import type { Forecast } from './types.ts'

// Helper Functions
export function formatPrediction(value?: number | null): string {
  return value != null ? value.toFixed(2) : "-";
}

export interface UseForecastReq {
  product?: string
  n_days_ahead?: number
  current_date?: string
  predicted_date?: string
  head?: number
}

export function useForecast(
  opts: UseForecastReq = {},
  queryOptions?: UseQueryOptions<Forecast[], Error>
) {
  const { product, n_days_ahead, current_date, predicted_date, head } = opts
  const queryKey = ['forecast', product, n_days_ahead, current_date, predicted_date, head] as const

  return useQuery<Forecast[], Error>({
    queryKey,
    queryFn: () => getForecast(product, n_days_ahead, current_date, predicted_date, head),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...queryOptions,
  })
}

export function useLatestForecasts(
  queryOptions?: UseQueryOptions<Forecast[], Error>
) {
  return useQuery<Forecast[], Error>({
    queryKey: ['latest-forecasts'] as const,
    queryFn: getLatestForecasts,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    ...queryOptions,
  })
}

export function useMultiForecast(
  requests: UseForecastReq[],
  options?: UseQueryOptions<Forecast[], Error>
): UseQueryResult<Forecast[], Error>[] {
  return useQueries({
    queries: requests.map((req) => ({
      queryKey: ['forecast', req.product, req.n_days_ahead, req.current_date, req.predicted_date, req.head] as const,
      queryFn: () => getForecast(req.product, req.n_days_ahead, req.current_date, req.predicted_date, req.head),
      staleTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      ...options,
    })),
  })
}