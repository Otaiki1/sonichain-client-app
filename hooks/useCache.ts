import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Simple caching system for blockchain data
 * Reduces redundant blockchain calls and improves performance
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const CACHE_PREFIX = '@sonichain_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export function useCache() {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Get data from cache
   */
  const getFromCache = useCallback(
    async <T>(key: string): Promise<T | null> => {
      try {
        const cacheKey = `${CACHE_PREFIX}${key}`;
        const cached = await AsyncStorage.getItem(cacheKey);

        if (!cached) return null;

        const entry: CacheEntry<T> = JSON.parse(cached);

        // Check if cache has expired
        if (Date.now() > entry.expiresAt) {
          await AsyncStorage.removeItem(cacheKey);
          return null;
        }

        console.log(`📦 Cache HIT: ${key}`);
        return entry.data;
      } catch (error) {
        console.error('Cache read error:', error);
        return null;
      }
    },
    []
  );

  /**
   * Save data to cache
   */
  const saveToCache = useCallback(
    async <T>(
      key: string,
      data: T,
      ttl: number = DEFAULT_TTL
    ): Promise<void> => {
      try {
        const cacheKey = `${CACHE_PREFIX}${key}`;
        const entry: CacheEntry<T> = {
          data,
          timestamp: Date.now(),
          expiresAt: Date.now() + ttl,
        };

        await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
        console.log(`💾 Cache SAVE: ${key}`);
      } catch (error) {
        console.error('Cache write error:', error);
      }
    },
    []
  );

  /**
   * Invalidate specific cache entry
   */
  const invalidateCache = useCallback(async (key: string): Promise<void> => {
    try {
      const cacheKey = `${CACHE_PREFIX}${key}`;
      await AsyncStorage.removeItem(cacheKey);
      console.log(`🗑️ Cache INVALIDATE: ${key}`);
    } catch (error) {
      console.error('Cache invalidate error:', error);
    }
  }, []);

  /**
   * Clear all cache
   */
  const clearAllCache = useCallback(async (): Promise<void> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
      console.log('🗑️ Cache CLEARED');
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }, []);

  /**
   * Fetch with cache (cache-first strategy)
   */
  const fetchWithCache = useCallback(
    async <T>(
      key: string,
      fetcher: () => Promise<T>,
      ttl: number = DEFAULT_TTL
    ): Promise<T | null> => {
      setIsLoading(true);

      try {
        // Try cache first
        const cached = await getFromCache<T>(key);
        if (cached !== null) {
          setIsLoading(false);
          return cached;
        }

        // Fetch from source
        console.log(`🌐 Cache MISS: ${key} - Fetching from source`);
        const data = await fetcher();

        // Save to cache
        await saveToCache(key, data, ttl);

        setIsLoading(false);
        return data;
      } catch (error) {
        console.error('Fetch with cache error:', error);
        setIsLoading(false);
        return null;
      }
    },
    [getFromCache, saveToCache]
  );

  return {
    isLoading,
    getFromCache,
    saveToCache,
    invalidateCache,
    clearAllCache,
    fetchWithCache,
  };
}

/**
 * Cache key generators
 */
export const CacheKeys = {
  story: (storyId: number) => `story_${storyId}`,
  round: (storyId: number, roundNum: number) => `round_${storyId}_${roundNum}`,
  submissions: (storyId: number, roundNum: number) =>
    `submissions_${storyId}_${roundNum}`,
  user: (address: string) => `user_${address}`,
  userStories: (address: string) => `user_stories_${address}`,
};
