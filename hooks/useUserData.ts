import { useState, useEffect, useCallback } from 'react';
import { useContract } from './useContract';
import { useAppStore } from '@/store/useAppStore';

/**
 * Custom hook for fetching and managing user data from the blockchain
 * Replaces mock user data with real blockchain data
 */
export function useUserData() {
  const { address, fetchUserData, fetchContributorStats } = useContract();
  const { user, updateUser } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch user registration data from blockchain
   */
  const fetchUserRegistration = useCallback(async () => {
    if (!address) return null;

    try {
      const userData = await fetchUserData(address);
      return userData;
    } catch (err: any) {
      console.error('Error fetching user registration:', err);
      setError('Failed to fetch user registration data');
      return null;
    }
  }, [address, fetchUserData]);

  /**
   * Calculate user stats from blockchain activity
   * This would need to be implemented by querying all stories and submissions
   * For now, we'll return placeholder data that can be updated
   */
  const calculateUserStats = useCallback(async () => {
    if (!address) return null;

    try {
      // TODO: Implement actual blockchain queries to calculate:
      // - Total recordings (submissions across all stories)
      // - Total votes cast
      // - Stories created by user
      // - Successfully finalized blocks
      // - XP and level calculations

      // For now, return initial stats that will be updated as user interacts
      return {
        totalRecordings: 0,
        totalVotes: 0,
        totalStoriesCreated: 0,
        totalBlocksFinalized: 0,
        xp: 0,
        level: 1,
      };
    } catch (err: any) {
      console.error('Error calculating user stats:', err);
      return null;
    }
  }, [address]);

  /**
   * Fetch user's NFTs from blockchain
   * This would query the NFT contract for tokens owned by the user
   */
  const fetchUserNFTs = useCallback(async () => {
    if (!address) return [];

    try {
      // TODO: Implement NFT fetching from the Soni_NFT contract
      // Query for all NFTs owned by the user address

      // For now, return empty array
      return [];
    } catch (err: any) {
      console.error('Error fetching user NFTs:', err);
      return [];
    }
  }, [address]);

  /**
   * Fetch complete user profile from blockchain
   */
  const fetchCompleteUserProfile = useCallback(async () => {
    if (!address) return null;

    setIsLoading(true);
    setError(null);

    try {
      const [registrationData, userStats, userNFTs] = await Promise.all([
        fetchUserRegistration(),
        calculateUserStats(),
        fetchUserNFTs(),
      ]);

      if (!registrationData) {
        throw new Error('User not registered on blockchain');
      }

      const completeUserData = {
        id: user?.id || Date.now().toString(),
        username: registrationData.username,
        walletAddress: address,
        privateKey: user?.privateKey || '',
        walletBalance: user?.walletBalance || 0,
        profileIcon: user?.profileIcon || '👤',
        badges: user?.badges || [],
        totalRecordings: userStats?.totalRecordings || 0,
        totalVotes: userStats?.totalVotes || 0,
        totalStoriesCreated: userStats?.totalStoriesCreated || 0,
        xp: userStats?.xp || 0,
        level: userStats?.level || 1,
        nfts: userNFTs || [],
        createdAt: user?.createdAt || new Date().toISOString(),
        registeredAt: registrationData['registered-at'],
      };

      // Update the user in the store
      updateUser(completeUserData);

      return completeUserData;
    } catch (err: any) {
      console.error('Error fetching complete user profile:', err);
      setError(err.message || 'Failed to fetch user profile');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [
    address,
    user,
    fetchUserRegistration,
    calculateUserStats,
    fetchUserNFTs,
    updateUser,
  ]);

  /**
   * Update user stats after performing an action
   * This should be called after user performs actions like:
   * - Creating a story
   * - Submitting a recording
   * - Voting
   * - Having a block finalized
   */
  const updateUserStats = useCallback(
    (updates: {
      totalRecordings?: number;
      totalVotes?: number;
      totalStoriesCreated?: number;
      xp?: number;
      level?: number;
    }) => {
      if (!user) return;

      const newStats = {
        totalRecordings: user.totalRecordings + (updates.totalRecordings || 0),
        totalVotes: user.totalVotes + (updates.totalVotes || 0),
        totalStoriesCreated:
          user.totalStoriesCreated + (updates.totalStoriesCreated || 0),
        xp: user.xp + (updates.xp || 0),
        level: updates.level || user.level,
      };

      updateUser(newStats);
    },
    [user, updateUser]
  );

  /**
   * Refresh user data from blockchain
   */
  const refreshUserData = useCallback(async () => {
    return await fetchCompleteUserProfile();
  }, [fetchCompleteUserProfile]);

  /**
   * Auto-fetch user data when address changes
   * DISABLED to prevent rate limiting - call manually when needed
   */
  // useEffect(() => {
  //   if (address && user?.walletAddress === address) {
  //     // Only refresh if we have a user but want to update their data
  //     fetchCompleteUserProfile();
  //   }
  // }, [address, user?.walletAddress, fetchCompleteUserProfile]);

  return {
    // State
    isLoading,
    error,

    // Data
    userRegistration: fetchUserRegistration,
    userStats: calculateUserStats,
    userNFTs: fetchUserNFTs,

    // Actions
    fetchCompleteUserProfile,
    updateUserStats,
    refreshUserData,

    // Utilities
    clearError: () => setError(null),
  };
}
