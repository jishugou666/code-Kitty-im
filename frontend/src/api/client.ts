import axios, { AxiosRequestConfig, AxiosError } from 'axios';
import i18n from '../i18n';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
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
      showUserFriendlyError(res.msg || i18n.t('errors.defaultError'));
      return Promise.reject(new Error(res.msg || i18n.t('errors.defaultError')));
    }
    return res;
  },
  (error: AxiosError) => {
    if (error.response) {
      const { status, data } = error.response;
      let userMessage = i18n.t('errors.network');

      switch (status) {
        case 400:
          userMessage = (data as { msg?: string })?.msg || i18n.t('errors.400');
          break;
        case 401:
          userMessage = i18n.t('errors.401');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('auth-storage');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          showUserFriendlyError(userMessage);
          return Promise.reject({ ...error, userMessage });
        case 403:
          userMessage = i18n.t('errors.403');
          break;
        case 404:
          userMessage = i18n.t('errors.404');
          break;
        case 429:
          userMessage = (data as { msg?: string })?.msg || i18n.t('errors.429');
          pendingRetryConfig = error.config || null;
          window.dispatchEvent(new CustomEvent('showRateLimit', {
            detail: {
              retryAfter: (data as { data?: { retryAfter?: number } })?.data?.retryAfter || 10,
              reason: userMessage,
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
          showUserFriendlyError(userMessage);
          return Promise.reject({ ...error, userMessage });
        case 500:
          userMessage = i18n.t('errors.500');
          break;
        case 502:
        case 503:
        case 504:
          userMessage = i18n.t('errors.502');
          break;
        default:
          userMessage = (data as { msg?: string })?.msg || i18n.t('errors.unknownError');
      }

      console.error(`API Error [${status}]:`, userMessage);
      showUserFriendlyError(userMessage);
      return Promise.reject({ ...error, userMessage });

    } else if (error.code === 'ECONNABORTED') {
      const userMessage = i18n.t('errors.timeout');
      console.error('Timeout Error:', userMessage);
      showUserFriendlyError(userMessage);
      return Promise.reject({ ...error, userMessage });

    } else if (error.request) {
      const userMessage = i18n.t('errors.network');
      console.error('Network Error:', userMessage);
      showUserFriendlyError(userMessage);
      return Promise.reject({ ...error, userMessage });

    } else {
      const userMessage = i18n.t('errors.requestError');
      console.error('Request Error:', error.message);
      showUserFriendlyError(userMessage);
      return Promise.reject({ ...error, userMessage });
    }
  }
);

function showUserFriendlyError(message: string) {
  if (typeof window !== 'undefined') {
    try {
      const event = new CustomEvent('api-error', { detail: { message } });
      window.dispatchEvent(event);
    } catch (e) {
      console.warn('Failed to dispatch error event:', e);
    }
  }
}

export function createRetryPromise(config: AxiosRequestConfig): Promise<unknown> {
  return new Promise((resolve, reject) => {
    pendingRetryConfig = config;
    retryResolve = resolve;
    retryReject = reject;
  });
}

export default apiClient;