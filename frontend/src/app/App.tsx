import { useEffect, useState, useRef, useCallback } from 'react';
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { BanOverlay } from './components/BanOverlay';
import { RateLimitOverlay } from './components/RateLimitOverlay';
import { apiClient } from '../api/client';

export default function App() {
  const [showBanOverlay, setShowBanOverlay] = useState(false);
  const [showRateLimit, setShowRateLimit] = useState(false);
  const [rateLimitReason, setRateLimitReason] = useState('');
  const pendingRetryRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('banned') === '1') {
      setShowBanOverlay(true);
    }
  }, []);

  const handleUnblockAndRetry = useCallback(async () => {
    try {
      await apiClient.get('/api/rate-limit/unblock');
      console.log('[RateLimit] Unblock API called');
    } catch (err) {
      console.error('[RateLimit] Unblock API failed:', err);
    }

    if (pendingRetryRef.current) {
      pendingRetryRef.current();
      pendingRetryRef.current = null;
    }
    setShowRateLimit(false);
  }, []);

  useEffect(() => {
    const handleShowRateLimit = (event: CustomEvent) => {
      const { reason = '', onRetry } = event.detail || {};
      setRateLimitReason(reason);
      pendingRetryRef.current = onRetry || null;
      setShowRateLimit(true);
    };

    window.addEventListener('showRateLimit' as any, handleShowRateLimit);
    return () => window.removeEventListener('showRateLimit' as any, handleShowRateLimit);
  }, []);

  if (showBanOverlay) {
    return <BanOverlay />;
  }

  return (
    <div className="w-screen h-screen bg-[#F4F5F9] dark:bg-[#0A0C10] text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500/30 overflow-hidden flex">
      <RouterProvider router={router} />
      <RateLimitOverlay
        isVisible={showRateLimit}
        retryAfter={5}
        reason={rateLimitReason}
        onRetry={handleUnblockAndRetry}
      />
    </div>
  );
}