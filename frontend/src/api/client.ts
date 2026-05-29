import axios, { AxiosRequestConfig, AxiosError } from 'axios';

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
      showUserFriendlyError(res.msg || '操作失败，请稍后重试');
      return Promise.reject(new Error(res.msg || 'Unknown error'));
    }
    return res;
  },
  (error: AxiosError) => {
    if (error.response) {
      const { status, data } = error.response;
      let userMessage = '网络异常，请稍后重试';

      switch (status) {
        case 400:
          userMessage = (data as { msg?: string })?.msg || '请求参数有误，请检查输入';
          break;
        case 401:
          userMessage = '登录已过期，请重新登录';
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('auth-storage');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          showUserFriendlyError(userMessage);
          return Promise.reject({ ...error, userMessage });
        case 403:
          userMessage = '没有权限执行此操作';
          break;
        case 404:
          userMessage = '请求的资源不存在';
          break;
        case 429:
          userMessage = (data as { msg?: string })?.msg || '操作过于频繁，请稍后再试';
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
          userMessage = '服务器内部错误，请联系管理员';
          break;
        case 502:
        case 503:
        case 504:
          userMessage = '服务暂时不可用，请稍后重试';
          break;
        default:
          userMessage = (data as { msg?: string })?.msg || '未知错误，请稍后重试';
      }

      console.error(`API Error [${status}]:`, userMessage);
      showUserFriendlyError(userMessage);
      return Promise.reject({ ...error, userMessage });

    } else if (error.code === 'ECONNABORTED') {
      const userMessage = '请求超时，请检查网络连接';
      console.error('Timeout Error:', userMessage);
      showUserFriendlyError(userMessage);
      return Promise.reject({ ...error, userMessage });

    } else if (error.request) {
      const userMessage = '网络连接失败，请检查网络设置';
      console.error('Network Error:', userMessage);
      showUserFriendlyError(userMessage);
      return Promise.reject({ ...error, userMessage });

    } else {
      const userMessage = '请求发生错误，请稍后重试';
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