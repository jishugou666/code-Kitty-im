import { useState, useCallback, useRef } from 'react';

interface RateLimitOptions {
  retryAfter?: number;
  reason?: string;
  onRetry?: () => void;
}

let globalShowRateLimit: ((options: RateLimitOptions) => void) | null = null;

export function useGlobalRateLimit() {
  return globalShowRateLimit;
}

export function RateLimitProvider({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  const [retryAfter, setRetryAfter] = useState(5);
  const [reason, setReason] = useState('');
  const retryCallbackRef = useRef<(() => void) | null>(null);

  const showRateLimit = useCallback((options: RateLimitOptions = {}) => {
    const { retryAfter: seconds = 5, reason: msg = '', onRetry } = options;
    setRetryAfter(seconds);
    setReason(msg);
    retryCallbackRef.current = onRetry || null;
    setIsVisible(true);
  }, []);

  const hideRateLimit = useCallback(() => {
    setIsVisible(false);
  }, []);

  const handleRetry = useCallback(() => {
    if (retryCallbackRef.current) {
      retryCallbackRef.current();
    }
    setIsVisible(false);
  }, []);

  globalShowRateLimit = showRateLimit;

  return (
    <>
      {children}
    </>
  );
}

export function getRateLimitHandler() {
  return globalShowRateLimit;
}

export default { RateLimitProvider, getRateLimitHandler };