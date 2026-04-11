import axios, { AxiosRequestConfig, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

let pendingRetryConfig: AxiosRequestConfig | null = null;
let retryResolve: ((value: unknown) => void) | null = null;
let retryReject: ((reason: unknown) => void) | null = null;

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res.code !== 200) {
      console.error('API Error:', res.msg || 'Unknown error');
      return Promise.reject(new Error(res.msg || 'Unknown error'));
    }
    return res;
  },
  (error: AxiosError) => {
    if (error.response) {
      const { status, data } = error.response;
      switch (status) {
        case 401:
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;
        case 429:
          pendingRetryConfig = error.config || null;
          window.dispatchEvent(new CustomEvent('showRateLimit', {
            detail: {
              retryAfter: 5,
              reason: (data as { msg?: string })?.msg || '请求过于频繁，请稍后再试',
              onRetry: () => {
                if (pendingRetryConfig && retryResolve) {
                  const resolver = retryResolve;
                  const config = pendingRetryConfig;
                  pendingRetryConfig = null;
                  retryResolve = null;
                  retryReject = null;
                  resolver(apiClient(config));
                }
              }
            }
          }));
          break;
        case 403:
          console.error('Access forbidden');
          break;
        case 404:
          console.error('Resource not found');
          break;
        case 500:
          console.error('Server error');
          break;
        default:
          console.error('API Error:', (data as { msg?: string })?.msg || 'Unknown error');
      }
    } else if (error.request) {
      console.error('Network error - no response received');
    } else {
      console.error('Request error:', error.message);
    }
    return Promise.reject(error);
  }
);

export function createRetryPromise(config: AxiosRequestConfig): Promise<unknown> {
  return new Promise((resolve, reject) => {
    pendingRetryConfig = config;
    retryResolve = resolve;
    retryReject = reject;
  });
}

export default apiClient;