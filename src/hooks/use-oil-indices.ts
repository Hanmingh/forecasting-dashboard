import { useQuery } from '@tanstack/react-query';
import { getOilIndices, getLatestOilIndices, getOilIndicesBySymbol, getOilIndicesSummary } from '@/api';
import type { OilIndicesResponse } from './types';

interface UseOilIndicesParams {
  symbol?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}

export function useOilIndices(params?: UseOilIndicesParams) {
  return useQuery({
    queryKey: ['oil-indices', params],
    queryFn: () => getOilIndices(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useLatestOilIndices() {
  return useQuery({
    queryKey: ['oil-indices', 'latest'],
    queryFn: getLatestOilIndices,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useOilIndicesBySymbol(symbol: string, params?: {
  start_date?: string;
  end_date?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['oil-indices', symbol, params],
    queryFn: () => getOilIndicesBySymbol(symbol, params),
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useOilIndicesSummary() {
  return useQuery({
    queryKey: ['oil-indices', 'summary'],
    queryFn: getOilIndicesSummary,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
} 