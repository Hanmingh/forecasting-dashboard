import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosError } from 'axios';
import { ACCESS_TOKEN, REFRESH_TOKEN } from './components/constants';
import type { Forecast } from './hooks/types'

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

export async function getForecast(product?: string, days?: 1|5|10|15|20, current_date?: string, predicted_date?: string  /*'YYYY-MM-DD'*/, head?:number): Promise<Forecast[]> {
  const res = await api.get<Forecast[]>('/forecast', {
    params: { product, days, current_date, predicted_date, head }
  })
  return res.data
}

export async function getAccuracy(product?: string, days?: 1|5|10|15|20) {
  const res = await api.get('/accuracy', { params: { product, days } })
  return res.data
}

export default api;