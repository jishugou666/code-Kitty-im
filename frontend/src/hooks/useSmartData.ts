import { useCallback, useRef, useEffect } from 'react';
import { aiScheduler, useAIScheduler } from '../lib/aiScheduler';

interface UseSmartDataOptions<T> {
  key: string;
  fetcher: () => Promise<T>;
  priority?: 'high' | 'medium' | 'low';
  ttl?: number;
  prefetch?: boolean;
  dependencies?: any[];
}

export function useSmartData<T>(options: UseSmartDataOptions<T>) {
  const { key, fetcher, priority = 'medium', ttl = 300000, prefetch = false, dependencies = [] } = options;
  const { request, prefetch: doPrefetch, invalidate } = useAIScheduler();
  const dataRef = useRef<T | null>(null);
  const loadingRef = useRef(false);
  const errorRef = useRef<Error | null>(null);

  const load = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      invalidate(key);
    }

    loadingRef.current = true;
    errorRef.current = null;

    try {
      const data = await request<T>({ key, fetcher, priority, ttl, prefetch });
      dataRef.current = data;
      return data;
    } catch (err) {
      errorRef.current = err as Error;
      throw err;
    } finally {
      loadingRef.current = false;
    }
  }, [key, fetcher, priority, ttl, prefetch, request, invalidate]);

  useEffect(() => {
    load();
  }, dependencies);

  useEffect(() => {
    if (prefetch) {
      doPrefetch({ key, fetcher, priority, ttl, prefetch: true });
    }
  }, [key, fetcher, priority, ttl, prefetch, doPrefetch]);

  return {
    data: dataRef.current,
    loading: loadingRef.current,
    error: errorRef.current,
    reload: () => load(true),
  };
}

export function usePredictivePrefetch(basePath: string, items: string[]) {
  const { predictNextAccess, prefetch } = useAIScheduler();

  useEffect(() => {
    const predictions = predictNextAccess(basePath);
    predictions.forEach(path => {
      const item = items.find(i => path.endsWith(i));
    });
  }, [basePath, items, predictNextAccess]);
}

export function useSmartCache() {
  const scheduler = useAIScheduler();

  const cacheUserData = useCallback(<T>(userId: number, data: T) => {
    aiScheduler.request({
      key: `/user/${userId}`,
      fetcher: async () => data,
      priority: 'high',
      ttl: 600000,
    });
  }, []);

  const cacheConversation = useCallback(<T>(convId: number, data: T) => {
    aiScheduler.request({
      key: `/conversation/${convId}`,
      fetcher: async () => data,
      priority: 'high',
      ttl: 300000,
    });
  }, []);

  const invalidateUserCache = useCallback((userId?: number) => {
    if (userId) {
      aiScheduler.invalidate(`^/user/${userId}$`);
    } else {
      aiScheduler.invalidate('^/user/');
    }
  }, []);

  const invalidateConversationCache = useCallback((convId?: number) => {
    if (convId) {
      aiScheduler.invalidate(`^/conversation/${convId}$`);
    } else {
      aiScheduler.invalidate('^/conversation/');
    }
  }, []);

  return {
    cacheUserData,
    cacheConversation,
    invalidateUserCache,
    invalidateConversationCache,
    getStats: () => scheduler.getStats(),
  };
}

export function useAIRecommendations(userId: number, userBehavior: string[]) {
  const { predictNextAccess } = useAIScheduler();

  const getRecommendations = useCallback(() => {
    const predictions = predictNextAccess(`/user/${userId}`);
    return predictions.map(path => {
      const parts = path.split('/');
      return {
        type: parts[2],
        id: parts[3],
        score: Math.random() * 0.3 + 0.7,
      };
    });
  }, [userId, predictNextAccess]);

  return { getRecommendations };
}