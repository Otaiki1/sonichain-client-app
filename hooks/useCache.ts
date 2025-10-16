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

// OPTIMIZATION: In-memory cache for faster access
const memoryCache = new Map<string, CacheEntry<any>>();
const MAX_MEMORY_CACHE_SIZE = 50; // Limit memory cache size

export function useCache() {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Get data from cache - OPTIMIZED with memory cache
   */
  const getFromCache = useCallback(
    async <T>(key: string): Promise<T | null> => {
      try {
        // OPTIMIZATION: Check memory cache first (fastest)
        const memoryKey = `memory_${key}`;
        if (memoryCache.has(memoryKey)) {
          const entry = memoryCache.get(memoryKey)!;
          if (Date.now() <= entry.expiresAt) {
            console.log(`⚡ Memory cache HIT: ${key}`);
            return entry.data;
          } else {
            memoryCache.delete(memoryKey);
          }
        }

        // Check AsyncStorage cache
        const cacheKey = `${CACHE_PREFIX}${key}`;
        const cached = await AsyncStorage.getItem(cacheKey);

        if (!cached) return null;

        const entry: CacheEntry<T> = JSON.parse(cached);

        // Check if cache has expired
        if (Date.now() > entry.expiresAt) {
          await AsyncStorage.removeItem(cacheKey);
          return null;
        }

        console.log(`📦 Storage cache HIT: ${key}`);

        // OPTIMIZATION: Store in memory cache for faster future access
        memoryCache.set(memoryKey, entry);

        // Clean up memory cache if it gets too large
        if (memoryCache.size > MAX_MEMORY_CACHE_SIZE) {
          const firstKey = memoryCache.keys().next().value;
          memoryCache.delete(firstKey);
        }

        return entry.data;
      } catch (error) {
        console.error('Cache read error:', error);
        return null;
      }
    },
    []
  );

  /**
   * Save data to cache - OPTIMIZED with memory cache
   */
  const saveToCache = useCallback(
    async <T>(
      key: string,
      data: T,
      ttl: number = DEFAULT_TTL
    ): Promise<void> => {
      try {
        const entry: CacheEntry<T> = {
          data,
          timestamp: Date.now(),
          expiresAt: Date.now() + ttl,
        };

        // OPTIMIZATION: Save to both memory and AsyncStorage
        const memoryKey = `memory_${key}`;
        const cacheKey = `${CACHE_PREFIX}${key}`;

        // Save to memory cache (fast access)
        memoryCache.set(memoryKey, entry);

        // Save to AsyncStorage (persistent)
        await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));

        // Clean up memory cache if it gets too large
        if (memoryCache.size > MAX_MEMORY_CACHE_SIZE) {
          const firstKey = memoryCache.keys().next().value;
          memoryCache.delete(firstKey);
        }

        console.log(`💾 Cache SAVE: ${key} (memory + storage)`);
      } catch (error) {
        console.error('Cache write error:', error);
      }
    },
    []
  );

  /**
   * Invalidate specific cache entry - OPTIMIZED with memory cache
   */
  const invalidateCache = useCallback(async (key: string): Promise<void> => {
    try {
      // OPTIMIZATION: Clear from both memory and storage
      const memoryKey = `memory_${key}`;
      const cacheKey = `${CACHE_PREFIX}${key}`;

      memoryCache.delete(memoryKey);
      await AsyncStorage.removeItem(cacheKey);

      console.log(`🗑️ Cache INVALIDATE: ${key} (memory + storage)`);
    } catch (error) {
      console.error('Cache invalidate error:', error);
    }
  }, []);

  /**
   * Clear all cache - OPTIMIZED with memory cache
   */
  const clearAllCache = useCallback(async (): Promise<void> => {
    try {
      // OPTIMIZATION: Clear both memory and storage caches
      memoryCache.clear();

      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);

      console.log('🗑️ Cache CLEARED (memory + storage)');
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
