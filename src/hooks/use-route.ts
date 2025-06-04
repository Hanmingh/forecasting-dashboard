import { useState } from 'react';
import { getRoutes, getRoute, createRoute, updateRoute, updateRouteLocation, deleteRoute } from '../api';
import type { RouteResponse, RouteCreate } from './types';

export function useRoute() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchRoutes = async (params?: {
    skip?: number;
    limit?: number;
    vessel_id?: number;
    departure_port_id?: number;
    arrival_port_id?: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRoutes(params);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch routes'));
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchRoute = async (routeId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRoute(routeId);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch route'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const addRoute = async (route: RouteCreate) => {
    setLoading(true);
    setError(null);
    try {
      const data = await createRoute(route);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create route'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const modifyRoute = async (routeId: number, route: RouteCreate) => {
    setLoading(true);
    setError(null);
    try {
      const data = await updateRoute(routeId, route);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update route'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateLocation = async (
    routeId: number,
    location: { current_latitude: number; current_longitude: number }
  ) => {
    setLoading(true);
    setError(null);
    try {
      const data = await updateRouteLocation(routeId, location);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update route location'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const removeRoute = async (routeId: number) => {
    setLoading(true);
    setError(null);
    try {
      await deleteRoute(routeId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete route'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    fetchRoutes,
    fetchRoute,
    addRoute,
    modifyRoute,
    updateLocation,
    removeRoute,
  };
}
