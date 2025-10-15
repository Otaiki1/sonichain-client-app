/**
 * useRoundTimer Hook
 *
 * Calculates real-time countdown and round information from blockchain data
 * Uses epoch timestamps from smart contract to show accurate time remaining
 */

import { useState, useEffect } from 'react';

export interface RoundTimerData {
  // Time remaining
  timeRemainingSeconds: number;
  timeRemainingFormatted: string; // "2h 34m" or "45m 23s" or "23s"
  isExpired: boolean;

  // Round info
  currentRoundNumber: number;
  totalBlocks: number;
  votingWindowHours: number;

  // Progress
  roundProgressPercentage: number; // 0-100
}

interface UseRoundTimerProps {
  roundStartTime?: number; // Epoch timestamp (seconds)
  roundEndTime?: number; // Epoch timestamp (seconds)
  currentRound?: number;
  totalBlocks?: number;
  votingWindow?: number; // Duration in seconds
}

/**
 * Calculate time remaining and format it nicely
 */
function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return 'Expired';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

/**
 * useRoundTimer Hook
 *
 * @param props - Round timing data from blockchain
 * @returns Real-time countdown and round information
 *
 * @example
 * ```typescript
 * const roundTimer = useRoundTimer({
 *   roundStartTime: 1760537685,
 *   roundEndTime: 1760624085,
 *   currentRound: 2,
 *   totalBlocks: 5,
 *   votingWindow: 86400
 * });
 *
 * console.log(roundTimer.timeRemainingFormatted); // "23h 45m"
 * console.log(roundTimer.currentRoundNumber);     // 2
 * console.log(roundTimer.roundProgressPercentage); // 15.5
 * ```
 */
export function useRoundTimer(
  props: UseRoundTimerProps | null = null
): RoundTimerData {
  const {
    roundStartTime,
    roundEndTime,
    currentRound = 1,
    totalBlocks = 0,
    votingWindow = 86400, // Default 24 hours
  } = props || {};

  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));

  // Update current time every second for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Calculate time remaining (handle null/undefined gracefully)
  const timeRemainingSeconds =
    roundEndTime && roundEndTime > 0
      ? Math.max(0, roundEndTime - currentTime)
      : 0;

  const isExpired =
    timeRemainingSeconds <= 0 && roundEndTime && roundEndTime > 0;

  // Calculate round progress (0-100%)
  let roundProgressPercentage = 0;
  if (
    roundStartTime &&
    roundEndTime &&
    roundStartTime > 0 &&
    roundEndTime > 0
  ) {
    const totalDuration = roundEndTime - roundStartTime;
    const elapsed = currentTime - roundStartTime;
    roundProgressPercentage = Math.min(
      100,
      Math.max(0, (elapsed / totalDuration) * 100)
    );
  }

  // Convert voting window to hours (default to 24 if not set)
  const votingWindowHours =
    votingWindow && votingWindow > 0 ? Math.floor(votingWindow / 3600) : 24;

  return {
    timeRemainingSeconds,
    timeRemainingFormatted:
      roundEndTime && roundEndTime > 0
        ? formatTimeRemaining(timeRemainingSeconds)
        : 'Loading...',
    isExpired,
    currentRoundNumber: currentRound || 1,
    totalBlocks: totalBlocks || 0,
    votingWindowHours,
    roundProgressPercentage,
  };
}

/**
 * Extract round timing data from blockchain response
 * Handles nested blockchain data structure
 */
export function extractRoundTimingData(roundData: any, storyData: any) {
  // Extract from nested structure
  const startTime =
    roundData?.value?.['start-time']?.value ||
    roundData?.['start-time']?.value ||
    roundData?.['start-time'] ||
    0;

  const endTime =
    roundData?.value?.['end-time']?.value ||
    roundData?.['end-time']?.value ||
    roundData?.['end-time'] ||
    0;

  const currentRound =
    storyData?.value?.['current-round']?.value ||
    storyData?.['current-round']?.value ||
    storyData?.['current-round'] ||
    1;

  const totalBlocks =
    storyData?.value?.['total-blocks']?.value ||
    storyData?.['total-blocks']?.value ||
    storyData?.['total-blocks'] ||
    0;

  const votingWindow =
    storyData?.value?.['voting-window']?.value ||
    storyData?.['voting-window']?.value ||
    storyData?.['voting-window'] ||
    86400;

  console.log('⏰ Extracted round timing:', {
    startTime,
    endTime,
    currentRound,
    totalBlocks,
    votingWindow,
    startDate: new Date(startTime * 1000).toISOString(),
    endDate: new Date(endTime * 1000).toISOString(),
  });

  return {
    roundStartTime: Number(startTime),
    roundEndTime: Number(endTime),
    currentRound: Number(currentRound),
    totalBlocks: Number(totalBlocks),
    votingWindow: Number(votingWindow),
  };
}
