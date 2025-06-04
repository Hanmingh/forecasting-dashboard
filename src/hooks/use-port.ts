import { useState } from 'react';
import { getPorts, getPort } from '../api';
import type { PortResponse } from './types';

export function usePort() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPorts = async (params?: {
    skip?: number;
    limit?: number;
    port_type?: string;
    country?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPorts(params);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch ports'));
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchPort = async (portId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPort(portId);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch port'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    fetchPorts,
    fetchPort,
  };
} 