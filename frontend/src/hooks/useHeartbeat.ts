import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { userApi } from '../api/user';

const HEARTBEAT_INTERVAL = 30000;

export function useHeartbeat() {
  const { isAuthenticated } = useAuthStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sendHeartbeat = useCallback(async () => {
    try {
      await userApi.heartbeat();
    } catch {
      // 静默失败，不影响用户体验
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    sendHeartbeat();
    timerRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    };

    const handleBeforeUnload = () => {
      navigator.sendBeacon(
        `${import.meta.env.VITE_API_BASE_URL}/user/heartbeat`,
        JSON.stringify({ token: useAuthStore.getState().token })
      );
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isAuthenticated, sendHeartbeat]);
}
