import { useEffect, useCallback, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/**
 * Hook for real-time blockchain updates
 * Periodically refreshes data when app is active
 */

interface UseRealTimeUpdatesOptions {
  enabled?: boolean;
  interval?: number; // milliseconds
  onUpdate?: () => void | Promise<void>;
}

export function useRealTimeUpdates({
  enabled = true,
  interval = 30000, // 30 seconds default
  onUpdate,
}: UseRealTimeUpdatesOptions) {
  const appState = useRef(AppState.currentState);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startPolling = useCallback(() => {
    if (!enabled || !onUpdate) return;

    console.log('🔄 Starting real-time updates');

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set new interval
    intervalRef.current = setInterval(async () => {
      console.log('🔄 Polling for updates...');
      try {
        await onUpdate();
      } catch (error) {
        console.error('Real-time update error:', error);
      }
    }, interval);
  }, [enabled, interval, onUpdate]);

  const stopPolling = useCallback(() => {
    console.log('⏸️ Stopping real-time updates');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          // App came to foreground - resume polling and trigger immediate update
          console.log('📱 App foregrounded - resuming updates');
          if (onUpdate) {
            onUpdate();
          }
          startPolling();
        } else if (nextAppState.match(/inactive|background/)) {
          // App went to background - stop polling
          console.log('📱 App backgrounded - pausing updates');
          stopPolling();
        }

        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [startPolling, stopPolling, onUpdate]);

  // Start/stop polling based on enabled state
  useEffect(() => {
    if (enabled && onUpdate) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enabled, onUpdate, startPolling, stopPolling]);

  return {
    startPolling,
    stopPolling,
  };
}

/**
 * Hook for manual refresh with pull-to-refresh pattern
 */
export function useManualRefresh(onRefresh: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Manual refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, onRefresh]);

  return {
    isRefreshing,
    refresh,
  };
}
