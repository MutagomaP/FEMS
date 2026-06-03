import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { AuthResponse } from '@/types';
import { tokenStorage } from '@/utils/storage';

const baseURL = import.meta.env.VITE_API_URL || '/api';

let refreshPromise: Promise<string | null> | null = null;

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const { data } = await axios.post<AuthResponse>(
      `${baseURL}/auth/refresh`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' } },
    );
    tokenStorage.setAccessToken(data.accessToken);
    tokenStorage.setRefreshToken(data.refreshToken);
    return data.accessToken;
  } catch {
    tokenStorage.clear();
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string | string[] }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const url = originalRequest?.url ?? '';
    const isAuthRoute =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh');

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthRoute
    ) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      }

      window.dispatchEvent(new CustomEvent('auth:logout'));
    }

    const message = extractErrorMessage(error);
    return Promise.reject(new Error(message));
  },
);

type ApiErrorBody = {
  message?: string | string[];
  statusCode?: number;
};

function extractErrorMessage(error: AxiosError<ApiErrorBody>) {
  const status = error.response?.status;
  const data = error.response?.data;
  let message: string | undefined;

  if (data?.message) {
    message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
  }

  if (status === 409) {
    if (
      !message ||
      /request failed with status code/i.test(message) ||
      /conflict/i.test(message)
    ) {
      return 'This email is already registered. Please sign in instead.';
    }
    if (/already registered|already exists|already in use/i.test(message)) {
      return 'This email is already registered. Please sign in instead.';
    }
    return message;
  }

  if (message) return message;
  if (status === 400) return 'Invalid request. Please check your details and try again.';
  if (status === 401) return 'Invalid email or password.';
  if (error.message && !/request failed with status code/i.test(error.message)) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

export default apiClient;
