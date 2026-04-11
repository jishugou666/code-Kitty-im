import { useState, useEffect, useCallback, useRef } from 'react';
import { RateLimitOverlay } from '../components/RateLimitOverlay';

interface RateLimitOptions {
  retryAfter?: number;
  message?: string;
}

export function useRateLimit() {
  const [isActive, setIsActive] = useState(false);
  const [options, setOptions] = useState<RateLimitOptions>({ retryAfter: 30, message: '请求频率过快，正在重新加载...' });
  const [countdown, setCountdown] = useState(30);
  const retryFnRef = useRef<(() => void) | null>(null);

  const show = useCallback((opts: RateLimitOptions = {}) => {
    setOptions({
      retryAfter: opts.retryAfter || 30,
      message: opts.message || '请求频率过快，正在重新加载...'
    });
    setCountdown(opts.retryAfter || 30);
    setIsActive(true);
  }, []);

  const hide = useCallback(() => {
    setIsActive(false);
  }, []);

  const handleRetry = useCallback(() => {
    setIsActive(false);
    if (retryFnRef.current) {
      retryFnRef.current();
      retryFnRef.current = null;
    }
  }, []);

  const withRetry = useCallback((fn: () => void) => {
    retryFnRef.current = fn;
    return fn;
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent;
      show(customEvent.detail || {});
    };

    window.addEventListener('show-rate-limit', handler);
    return () => window.removeEventListener('show-rate-limit', handler);
  }, [show]);

  useEffect(() => {
    if (!isActive || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleRetry();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, countdown, handleRetry]);

  return {
    isActive,
    countdown,
    options,
    show,
    hide,
    handleRetry,
    withRetry
  };
}

export function RateLimitProvider() {
  const { isActive, countdown, options, handleRetry } = useRateLimit();

  return (
    <RateLimitOverlay
      isActive={isActive}
      message={options.message}
      autoRetrySeconds={options.retryAfter || 30}
      countdown={countdown}
      onRetry={handleRetry}
    />
  );
}

export default useRateLimit;