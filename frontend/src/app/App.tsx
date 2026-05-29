import { useEffect, useState, useRef, useCallback } from 'react';
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { BanOverlay } from './components/BanOverlay';
import { RateLimitOverlay } from './components/RateLimitOverlay';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { apiClient } from '../api/client';
import { useHeartbeat } from '../hooks/useHeartbeat';
import { useToast } from '../hooks/useToast';

export default function App() {
  const [showBanOverlay, setShowBanOverlay] = useState(false);
  const [showRateLimit, setShowRateLimit] = useState(false);
  const [rateLimitReason, setRateLimitReason] = useState('');
  const pendingRetryRef = useRef<(() => void) | null>(null);
  const [isStudio, setIsStudio] = useState(false);
  const { toast } = useToast();

  useHeartbeat();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('banned') === '1') {
      setShowBanOverlay(true);
    }
  }, []);

  useEffect(() => {
    const checkStudio = () => setIsStudio(window.location.pathname === '/studio');
    checkStudio();
    window.addEventListener('popstate', checkStudio);
    return () => {
      window.removeEventListener('popstate', checkStudio);
    };
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

  useEffect(() => {
    const handleApiError = (event: CustomEvent) => {
      const { message = '操作失败，请稍后重试' } = event.detail || {};
      toast(message, 'error');
    };

    window.addEventListener('api-error' as any, handleApiError);
    return () => window.removeEventListener('api-error' as any, handleApiError);
  }, [toast]);

  if (showBanOverlay) {
    return <BanOverlay />;
  }

  if (isStudio) {
    return (
      <div className="w-screen h-screen">
        <ErrorBoundary>
          <RouterProvider router={router} />
        </ErrorBoundary>
        <RateLimitOverlay
          isVisible={showRateLimit}
          retryAfter={5}
          reason={rateLimitReason}
          onRetry={handleUnblockAndRetry}
        />
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-[#F4F5F9] dark:bg-[#0A0C10] text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500/30 overflow-hidden flex">
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
      <RateLimitOverlay
        isVisible={showRateLimit}
        retryAfter={5}
        reason={rateLimitReason}
        onRetry={handleUnblockAndRetry}
      />
    </div>
  );
}