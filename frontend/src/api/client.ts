import axios, { type AxiosError } from 'axios';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { emitUnauthorized } from '@/lib/authEvents';
import { useLocaleStore } from '@/features/locale/useLocaleStore';
import { translate } from '@/lib/i18n/useTranslation';
import type { ApiError } from '@/types/api';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearToken();
      emitUnauthorized();
    }

    if (!error.response) {
      const networkError: ApiError = {
        statusCode: 0,
        message: translate(useLocaleStore.getState().locale, 'common.networkError'),
      };
      return Promise.reject(networkError);
    }

    return Promise.reject(error.response.data);
  },
);
