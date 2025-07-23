import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosError } from 'axios';
import { ACCESS_TOKEN, REFRESH_TOKEN } from './components/constants';
import type { Forecast, VesselResponse, VesselCreate, OilIndicesResponse } from './hooks/types'

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(ACCESS_TOKEN);
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem(REFRESH_TOKEN);
      if (refreshToken) {
        try {
          const res = await axios.post(
            `${import.meta.env.VITE_API_URL}/auth/refresh`,
            null,
            { headers: { Authorization: `Bearer ${refreshToken}` } }
          );
          const { access_token, refresh_token } = res.data;
          localStorage.setItem(ACCESS_TOKEN, access_token);
          if (refresh_token) localStorage.setItem(REFRESH_TOKEN, refresh_token);
          originalRequest.headers = originalRequest.headers ?? {};
          (originalRequest.headers as Record<string, string>)['Authorization'] = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export async function getForecast(product?: string, n_days_ahead?: number, current_date?: string, predicted_date?: string  /*'YYYY-MM-DD'*/, head?:number): Promise<Forecast[]> {
  const res = await api.get<Forecast[]>('/forecast', {
    params: { product, n_days_ahead, current_date, predicted_date, head }
  })
  return res.data
}

export async function getLatestForecasts(): Promise<Forecast[]> {
  const res = await api.get<Forecast[]>('/forecast/latest')
  return res.data
}

export async function getUniqueProducts(): Promise<string[]> {
  const res = await api.get<{ products: string[] }>('/forecast/products')
  return res.data.products
}

export async function getProductDateRange(product: string): Promise<{ earliest_date: string; latest_date: string }> {
  const res = await api.get<{ earliest_date: string; latest_date: string }>(`/forecast/date-range/${product}`)
  return res.data
}

export async function getAccuracy(product?: string, n_days_ahead?: number) {
  const res = await api.get('/accuracy', { params: { product, n_days_ahead } })
  return res.data
}

export async function getVessels(params?: {
  skip?: number;
  limit?: number;
}): Promise<VesselResponse[]> {
  const res = await api.get<VesselResponse[]>('/vessels', { params });
  return res.data;
}

export async function getVessel(vesselId: number): Promise<VesselResponse> {
  const res = await api.get<VesselResponse>(`/vessels/${vesselId}`);
  return res.data;
}

export async function createVessel(vessel: VesselCreate): Promise<VesselResponse> {
  const res = await api.post<VesselResponse>('/vessels', vessel);
  return res.data;
}

export async function updateVessel(vesselId: number, vessel: VesselCreate): Promise<VesselResponse> {
  const res = await api.put<VesselResponse>(`/vessels/${vesselId}`, vessel);
  return res.data;
}

export async function deleteVessel(vesselId: number): Promise<void> {
  await api.delete(`/vessels/${vesselId}`);
}



// Oil Indices APIs
export async function getOilIndices(params?: {
  symbol?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}): Promise<OilIndicesResponse[]> {
  const res = await api.get<OilIndicesResponse[]>('/oil_indices', { params });
  return res.data;
}

export async function getLatestOilIndices(): Promise<OilIndicesResponse[]> {
  const res = await api.get<OilIndicesResponse[]>('/oil_indices/latest');
  return res.data;
}

export async function getOilIndicesBySymbol(
  symbol: string,
  params?: {
    start_date?: string;
    end_date?: string;
    limit?: number;
  }
): Promise<OilIndicesResponse[]> {
  const res = await api.get<OilIndicesResponse[]>(`/oil_indices/${symbol}`, { params });
  return res.data;
}

export async function getOilIndicesSummary(): Promise<any> {
  const res = await api.get('/oil_indices/summary/all');
  return res.data;
}

export default api;