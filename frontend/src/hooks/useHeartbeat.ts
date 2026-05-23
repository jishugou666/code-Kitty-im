import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { userApi } from '../api/user';
import { getPusher } from './useWebSocket';

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const KEEPALIVE_MS = 25000;

export function useHeartbeat() {
  const { isAuthenticated, token } = useAuthStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pusherBound = useRef(false);

  const sendHeartbeat = useCallback(async () => {
    try {
      await userApi.heartbeat();
    } catch {
      // 静默失败
    }
  }, []);

  const markOffline = useCallback(() => {
    if (!token) return;
    try {
      const body = JSON.stringify({ token });
      navigator.sendBeacon(`${API_BASE}/user/offline`, body);
    } catch {
      // sendBeacon 可能失败，忽略
    }
  }, [token]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // 1. 启动短间隔心跳保活定时器
    sendHeartbeat();
    timerRef.current = setInterval(sendHeartbeat, KEEPALIVE_MS);

    // 2. 监听 Pusher 连接状态变化（最可靠的在线信号）
    const pusher = getPusher();
    if (!pusherBound.current) {
      pusherBound.current = true;
      pusher.connection.bind('state_change', (states: { current: string; previous: string }) => {
        console.log(`[Heartbeat] Pusher: ${states.previous} -> ${states.current}`);
        if (states.current === 'connected') {
          sendHeartbeat();
        }
        if (
          (states.previous === 'connected') &&
          (states.current === 'disconnected' || states.current === 'unavailable' || states.current === 'failed')
        ) {
          markOffline();
        }
      });

      // 连接出错时也标记离线
      pusher.connection.bind('error', (err: any) => {
        console.error('[Heartbeat] Pusher connection error:', err?.error?.message);
        markOffline();
      });
    }

    // 3. 页面可见时立即心跳（从后台切回）
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    };

    // 4. pagehide 比 beforeunload 更可靠（支持移动端）
    const handlePageHide = () => {
      markOffline();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [isAuthenticated, sendHeartbeat, markOffline]);
}
