import { useState } from 'react';
import { getVessels, getVessel, createVessel, updateVessel, deleteVessel } from '../api';
import type { VesselResponse, VesselCreate } from './types';

export function useVessel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchVessels = async (params?: {
    skip?: number;
    limit?: number;
    vessel_type?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getVessels(params);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch vessels'));
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchVessel = async (vesselId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getVessel(vesselId);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch vessel'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const addVessel = async (vessel: VesselCreate) => {
    setLoading(true);
    setError(null);
    try {
      const data = await createVessel(vessel);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create vessel'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const modifyVessel = async (vesselId: number, vessel: VesselCreate) => {
    setLoading(true);
    setError(null);
    try {
      const data = await updateVessel(vesselId, vessel);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update vessel'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const removeVessel = async (vesselId: number) => {
    setLoading(true);
    setError(null);
    try {
      await deleteVessel(vesselId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete vessel'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    fetchVessels,
    fetchVessel,
    addVessel,
    modifyVessel,
    removeVessel,
  };
}
