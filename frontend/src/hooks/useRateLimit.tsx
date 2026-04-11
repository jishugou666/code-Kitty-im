import { useState, useCallback, useRef } from 'react';

interface RateLimitState {
  isVisible: boolean;
  retryAfter: number;
  reason: string;
  retryCallback: (() => void) | null;
}

export function useRateLimit() {
  const [state, setState] = useState<RateLimitState>({
    isVisible: false,
    retryAfter: 5,
    reason: '',
    retryCallback: null
  });

  const retryRef = useRef<(() => void) | null>(null);

  const showRateLimit = useCallback((retryAfter: number = 5, reason: string = '', onRetry: () => void = () => {}) => {
    setState({
      isVisible: true,
      retryAfter,
      reason,
      retryCallback: onRetry
    });
    retryRef.current = onRetry;
  }, []);

  const hideRateLimit = useCallback(() => {
    setState(prev => ({
      ...prev,
      isVisible: false
    }));
    retryRef.current = null;
  }, []);

  const handleRetry = useCallback(() => {
    if (retryRef.current) {
      retryRef.current();
    }
    hideRateLimit();
  }, [hideRateLimit]);

  return {
    ...state,
    showRateLimit,
    hideRateLimit,
    handleRetry
  };
}

export default useRateLimit;