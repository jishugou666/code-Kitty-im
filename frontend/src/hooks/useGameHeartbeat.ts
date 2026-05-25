import { useEffect, useRef, useCallback } from 'react';
import { gameApi } from '../api/game';

const HEARTBEAT_INTERVAL = 10000;

export function useGameHeartbeat(matchId: number | null, isActive: boolean) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const matchIdRef = useRef(matchId);

  useEffect(() => {
    matchIdRef.current = matchId;
  }, [matchId]);

  const sendHeartbeat = useCallback(async () => {
    if (!matchIdRef.current) return;
    try {
      await gameApi.heartbeat(matchIdRef.current);
    } catch {
      // 静默失败，不影响游戏
    }
  }, []);

  const sendSurrenderOnExit = useCallback(() => {
    if (matchIdRef.current) {
      navigator.sendBeacon(
        `${import.meta.env.VITE_API_BASE_URL}/game/${matchIdRef.current}/surrender`,
        JSON.stringify({ token: localStorage.getItem('token') })
      );
    }
  }, []);

  useEffect(() => {
    if (!isActive || !matchId) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    sendHeartbeat();
    timerRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    window.addEventListener('beforeunload', sendSurrenderOnExit);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    });

    return () => {
      window.removeEventListener('beforeunload', sendSurrenderOnExit);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive, matchId, sendHeartbeat, sendSurrenderOnExit]);
}
