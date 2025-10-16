import { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import * as ContractUtils from '@/lib/contract-utils';

export interface NFTData {
  tokenId: number;
  uri: string | null;
  metadata: {
    name?: string;
    description?: string;
    image?: string;
    attributes?: Array<{
      trait_type: string;
      value: string | number;
    }>;
    story_id?: string;
    round?: number;
    winner?: string;
  } | null;
}

/**
 * Custom hook for NFT operations
 * Provides functions to fetch and display user's NFTs
 */
export function useNFT() {
  const { address } = useWallet();
  const [nfts, setNfts] = useState<NFTData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch NFTs owned by the current user
   */
  const fetchUserNFTs = useCallback(async () => {
    if (!address) {
      console.log('⚠️ No wallet address, skipping NFT fetch');
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`🎨 Fetching NFTs for user: ${address}`);
      const userNFTs = await ContractUtils.getUserNFTs(address);
      setNfts(userNFTs);
      return userNFTs;
    } catch (err: any) {
      console.error('❌ Error fetching NFTs:', err);
      setError(err.message || 'Failed to fetch NFTs');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  /**
   * Fetch NFTs owned by a specific address
   */
  const fetchNFTsByAddress = useCallback(async (ownerAddress: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`🎨 Fetching NFTs for address: ${ownerAddress}`);
      const userNFTs = await ContractUtils.getUserNFTs(ownerAddress);
      return userNFTs;
    } catch (err: any) {
      console.error('❌ Error fetching NFTs:', err);
      setError(err.message || 'Failed to fetch NFTs');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get total number of minted NFTs
   */
  const getTotalMinted = useCallback(async () => {
    try {
      const lastTokenId = await ContractUtils.getLastTokenId();
      return lastTokenId;
    } catch (err: any) {
      console.error('❌ Error fetching total minted:', err);
      return 0;
    }
  }, []);

  /**
   * Refresh NFTs (re-fetch from blockchain)
   */
  const refreshNFTs = useCallback(async () => {
    return await fetchUserNFTs();
  }, [fetchUserNFTs]);

  return {
    // State
    nfts,
    isLoading,
    error,

    // Actions
    fetchUserNFTs,
    fetchNFTsByAddress,
    getTotalMinted,
    refreshNFTs,

    // Utilities
    clearError: () => setError(null),
  };
}
