import { useQuery, UseQueryOptions, useQueries, UseQueryResult } from '@tanstack/react-query'
import { getForecast, getLatestForecasts, getUniqueProducts, getProductDateRange, getAccuracy } from '@/api'
import type { Forecast, Accuracy } from './types.ts'

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

export function useUniqueProducts(
  queryOptions?: UseQueryOptions<string[], Error>
) {
  return useQuery<string[], Error>({
    queryKey: ['unique-products'] as const,
    queryFn: getUniqueProducts,
    staleTime: 1000 * 60 * 10, // 10 minutes (products don't change often)
    refetchOnWindowFocus: false,
    ...queryOptions,
  })
}

export function useProductDateRange(
  product: string,
  queryOptions?: UseQueryOptions<{ earliest_date: string; latest_date: string }, Error>
) {
  return useQuery<{ earliest_date: string; latest_date: string }, Error>({
    queryKey: ['product-date-range', product] as const,
    queryFn: () => getProductDateRange(product),
    enabled: !!product, // Only run query when product is provided
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    ...queryOptions,
  })
}

export function useAccuracy(
  product?: string,
  n_days_ahead?: number,
  queryOptions?: UseQueryOptions<Accuracy[], Error>
) {
  return useQuery<Accuracy[], Error>({
    queryKey: ['accuracy', product, n_days_ahead] as const,
    queryFn: () => getAccuracy(product, n_days_ahead),
    enabled: !!product, // Only run query when product is provided
    staleTime: 1000 * 60 * 10, // 10 minutes
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