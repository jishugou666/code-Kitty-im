import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { RateLimitOverlay } from '../app/components/RateLimitOverlay';

interface RateLimitContextType {
  showRateLimit: (options?: { retryAfter?: number; reason?: string; onRetry?: () => void }) => void;
  hideRateLimit: () => void;
}

const RateLimitContext = createContext<RateLimitContextType | null>(null);

export function useRateLimit() {
  const context = useContext(RateLimitContext);
  if (!context) {
    return {
      showRateLimit: () => {},
      hideRateLimit: () => {}
    };
  }
  return context;
}

export function RateLimitProvider({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  const [retryAfter, setRetryAfter] = useState(5);
  const [reason, setReason] = useState('');
  const retryCallbackRef = useRef<(() => void) | null>(null);

  const showRateLimit = useCallback((options: { retryAfter?: number; reason?: string; onRetry?: () => void } = {}) => {
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

  return (
    <RateLimitContext.Provider value={{ showRateLimit, hideRateLimit }}>
      {children}
      <RateLimitOverlay
        isVisible={isVisible}
        retryAfter={retryAfter}
        reason={reason}
        onRetry={handleRetry}
      />
    </RateLimitContext.Provider>
  );
}

export default RateLimitProvider;