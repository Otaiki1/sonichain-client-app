import { useState, useEffect, useCallback } from 'react';
import { useContract } from './useContract';
import { useAppStore } from '@/store/useAppStore';
import { StoryChain, VoiceBlock } from '@/types';
import { useCache, CacheKeys } from './useCache';
import { usePinata } from './usePinata';
import * as ContractUtils from '@/lib/contract-utils';

/**
 * Helper function to extract data from nested blockchain response
 * Handles the structure: {id, type, value: {field: {type, value}}}
 *
 * This is exported so it can be used in other files that fetch blockchain data
 */
export function extractBlockchainData(blockchainResponse: any): any {
  if (!blockchainResponse) return null;

  // Extract the outer value wrapper
  const data = blockchainResponse.value || blockchainResponse;

  // If it's not an object with nested structure, return as is
  if (typeof data !== 'object' || !data) return data;

  // Extract nested values
  const extracted: any = {};
  for (const key in data) {
    const field = data[key];
    // If field has a value property, extract it, otherwise use as is
    extracted[key] = field?.value !== undefined ? field.value : field;
  }

  return extracted;
}

/**
 * Custom hook for fetching and managing stories from the blockchain
 * Replaces mock story data with real blockchain data
 */
export function useStories() {
  const {
    fetchStory,
    fetchRound,
    fetchRoundSubmissions,
    fetchCompleteStory,
    address,
  } = useContract();
  const { storyChains, addStoryChain, updateStoryChain } = useAppStore();
  const { fetchWithCache, invalidateCache } = useCache();
  const { getFromIPFS } = usePinata();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Convert blockchain story data to app-friendly format
   * Maps authentic contract data to UI structure
   */
  const convertBlockchainStory = useCallback(
    async (blockchainStory: any, storyId: number): Promise<StoryChain> => {
      // Contract returns:
      // {
      //   id: number,
      //   type: string,
      //   value: {
      //     prompt: {type: string, value: string},
      //     creator: {type: string, value: principal},
      //     is-sealed: {type: string, value: bool},
      //     created-at: {type: string, value: uint},
      //     total-blocks: {type: string, value: uint},
      //     bounty-pool: {type: string, value: uint},
      //     current-round: {type: string, value: uint}
      //   }
      // }
      console.log(
        '🔍 Blockchain story raw:',
        JSON.stringify(blockchainStory, null, 2)
      );

      // Extract the nested blockchain data structure
      const storyData = extractBlockchainData(blockchainStory);
      console.log('🔍 Extracted story data:', storyData);

      // Get values with proper fallbacks
      const prompt = storyData?.prompt || '';
      const isSealed = storyData?.['is-sealed'] ?? false;
      const bountyPool = Number(storyData?.['bounty-pool'] ?? 0);
      const creator = storyData?.creator || '';
      const createdAt = Number(storyData?.['created-at'] ?? 0);
      const totalBlocks = Number(storyData?.['total-blocks'] ?? 0);
      const currentRound = Number(storyData?.['current-round'] ?? 1);

      console.log('🔍 Parsed values:', {
        prompt,
        isSealed,
        bountyPool,
        creator,
        createdAt,
        totalBlocks,
        currentRound,
      });

      // Initialize metadata variables with blank values
      let ipfsMetadata: any = null;
      let title = '';
      let description = '';
      let coverArt = '';
      let category = '';

      if (prompt) {
        // Check if prompt is an IPFS hash (Qm... or baf... format)
        const isIPFSHash =
          /^Qm[a-zA-Z0-9]{44}$/.test(prompt) ||
          /^baf[a-zA-Z0-9]{52,}$/.test(prompt);

        if (isIPFSHash) {
          console.log(
            `🔍 Parsing IPFS metadata for story ${storyId}: ${prompt}`
          );
          try {
            ipfsMetadata = await getFromIPFS(prompt);

            if (ipfsMetadata) {
              // Extract metadata from IPFS content - use blank if not available
              title = ipfsMetadata.title || ipfsMetadata.name || '';
              description =
                ipfsMetadata.description || ipfsMetadata.summary || '';
              coverArt = ipfsMetadata.coverArt || ipfsMetadata.image || '';
              category = ipfsMetadata.category || ipfsMetadata.genre || '';

              console.log('✅ IPFS metadata parsed:', {
                title: title || '(empty)',
                description: description
                  ? description.substring(0, Math.min(50, description.length)) +
                    (description.length > 50 ? '...' : '')
                  : '(empty)',
                coverArt: coverArt || '(empty)',
                category: category || '(empty)',
              });
            }
          } catch (error) {
            console.warn('⚠️ Failed to parse IPFS metadata:', error);
            // Leave all fields blank if IPFS parsing fails
            title = '';
            description = '';
            coverArt = '';
            category = '';
          }
        } else {
          // If prompt is not an IPFS hash, use it as title/description
          title = prompt.length > 50 ? prompt.substring(0, 47) + '...' : prompt;
          description = prompt;
        }
      }

      return {
        id: storyId.toString(),
        title,
        description,
        coverArt,
        blocks: [], // Will be populated by fetching story chain
        maxBlocks: 10, // From contract constant MAX_BLOCKS_PER_STORY
        status: isSealed ? 'sealed' : 'active',
        category,
        totalDuration: 0, // Calculated from voice blocks
        bountyStx: bountyPool, // ✅ Use real bounty from contract
        votingWindowHours: 24, // From contract constant VOTING_PERIOD (~144 blocks)
        creatorUsername: 'Unknown', // Will be fetched from user data using creator principal
        nftMinted: isSealed, // NFT minted when story is sealed
        // Store additional blockchain data
        creator: creator, // Creator's principal address
        createdAt: createdAt, // Block height when created
        totalBlocks: totalBlocks, // Finalized blocks count
        currentRound: currentRound, // Current voting round
        // Store IPFS metadata for reference
        ipfsHash: prompt, // The prompt IS the IPFS hash from the contract
        ipfsMetadata,
      };
    },
    [getFromIPFS]
  );

  /**
   * Convert blockchain submission to VoiceBlock format
   * Maps authentic contract submission data to UI structure
   *
   * IMPORTANT: submission-id is NOT in the returned data from get-submission
   * It's the key used to fetch the data, so we need to pass it separately
   */
  const convertBlockchainSubmission = useCallback(
    (submission: any, submissionId?: number): VoiceBlock => {
      // Contract returns from get-submission(submission-id):
      // {
      //   story-id: uint,           ✅ Included in response
      //   round-num: uint,          ✅ Included in response
      //   uri: string-ascii,        ✅ Included in response
      //   contributor: principal,   ✅ Included in response
      //   submitted-at: uint,       ✅ Included in response
      //   vote-count: uint          ✅ Included in response
      // }
      //
      // NOTE: submission-id is NOT included - it's the map key!

      // Extract values from nested blockchain response structure
      const contributor =
        submission.contributor?.value || submission.contributor;
      const uri = submission.uri?.value || submission.uri;
      const submittedAt =
        submission['submitted-at']?.value ?? submission['submitted-at'] ?? 0;
      const voteCount =
        submission['vote-count']?.value ?? submission['vote-count'] ?? 0;

      // Reconstruct full Supabase URL from stored path
      // If uri is a path like "uploads/xxx.m4a", prepend Supabase URL
      // If uri is already a full URL (legacy), use as-is
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
      const fullAudioUri = uri.startsWith('http')
        ? uri
        : `${supabaseUrl}/storage/v1/object/public/audio-files/${uri}`;

      return {
        id:
          submissionId?.toString() ||
          submission['submission-id']?.toString() ||
          '0',
        username: contributor || 'Unknown', // Use principal address temporarily
        audioUri: fullAudioUri, // ✅ Full URL for playback
        audioCid: uri, // Store original path/CID for reference
        duration: 0, // Will be fetched from metadata
        timestamp: submittedAt
          ? new Date(submittedAt * 1000).toISOString()
          : new Date().toISOString(),
        votes: voteCount, // ✅ Real vote count from contract
      };
    },
    []
  );

  /**
   * Fetch a single story from blockchain (with caching)
   */
  const fetchStoryFromBlockchain = useCallback(
    async (
      storyId: number,
      useCache: boolean = true
    ): Promise<StoryChain | null> => {
      try {
        // Try cache first if enabled
        if (useCache) {
          const cached = await fetchWithCache<StoryChain | null>(
            CacheKeys.story(storyId),
            async () => {
              const blockchainStory = await fetchStory(storyId);
              if (!blockchainStory) return null;

              const appStory = await convertBlockchainStory(
                blockchainStory,
                storyId
              );
              const storyChain = await fetchCompleteStory(storyId);
              console.log('🔍 Fetched Story from blockchain:', storyChain);
              if (storyChain && Array.isArray(storyChain)) {
                // storyChain now includes full submission data with 'id' field
                appStory.blocks = storyChain.map((block) =>
                  convertBlockchainSubmission(
                    block,
                    block.id || block['submission-id']
                  )
                );
              }

              return appStory;
            },
            5 * 60 * 1000 // 5 minutes cache
          );

          return cached;
        }

        // Fetch without cache
        const blockchainStory = await fetchStory(storyId);
        if (!blockchainStory) {
          return null;
        }

        const appStory = await convertBlockchainStory(blockchainStory, storyId);
        const storyChain = await fetchCompleteStory(storyId);
        if (storyChain && Array.isArray(storyChain)) {
          // storyChain now includes full submission data with 'id' field
          appStory.blocks = storyChain.map((block) =>
            convertBlockchainSubmission(
              block,
              block.id || block['submission-id']
            )
          );
        }

        // ✅ AUTO-UPDATE: Update app store with this story
        if (appStory) {
          updateStoryChain(storyId.toString(), appStory);
          console.log('🔄 App store updated with individual story');
        }

        return appStory;
      } catch (err: any) {
        console.error('Error fetching story from blockchain:', err);
        return null;
      }
    },
    [
      fetchStory,
      fetchCompleteStory,
      convertBlockchainStory,
      convertBlockchainSubmission,
      fetchWithCache,
      updateStoryChain,
    ]
  );

  /**
   * PRODUCTION: Fetch all available stories from blockchain using story-counter
   * This is the proper way to get all stories in production
   */
  const fetchAllStories = useCallback(async (): Promise<StoryChain[]> => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('📚 PRODUCTION: Fetching all stories from blockchain...');

      // Get all story IDs from blockchain using story-counter
      const allStories = await ContractUtils.getAllStoriesFromBlockchain();

      if (allStories.length === 0) {
        console.log('ℹ️ No stories found on blockchain');
        return [];
      }

      // Convert blockchain stories to app format
      const appStories: StoryChain[] = [];

      for (const blockchainStory of allStories) {
        const storyId = blockchainStory.id;
        const appStory = await convertBlockchainStory(blockchainStory, storyId);

        // // Fetch story chain (finalized blocks)
        // const storyChain = await fetchCompleteStory(storyId);
        // if (storyChain && Array.isArray(storyChain)) {
        //   appStory.blocks = storyChain.map((block) =>
        //     convertBlockchainSubmission(
        //       block,
        //       block.id || block['submission-id']
        //     )
        //   );
        // }

        appStories.push(appStory);
      }

      console.log(
        `✅ Successfully loaded ${appStories.length} stories from blockchain`,
        appStories
      );

      // ✅ AUTO-UPDATE: Update app store with fresh blockchain data
      appStories.forEach((story) => {
        updateStoryChain(story.id, story);
      });
      console.log('🔄 App store updated with blockchain stories', appStories);

      return appStories;
    } catch (err: any) {
      console.error('❌ Error fetching all stories from blockchain:', err);
      setError(err.message || 'Failed to fetch stories from blockchain');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [
    convertBlockchainStory,
    convertBlockchainSubmission,
    fetchCompleteStory,
    updateStoryChain,
  ]);

  /**
   * Fetch current round data for a story
   */
  const fetchCurrentRound = useCallback(
    async (storyId: number, roundNum: number) => {
      try {
        console.log(`🔍 Fetching round ${roundNum} for story ${storyId}...`);

        const roundData = await fetchRound(storyId, roundNum);
        const submissions = await fetchRoundSubmissions(storyId, roundNum);

        console.log('✅ Round data fetched successfully');
        return {
          round: roundData,
          submissions: submissions || [],
        };
      } catch (err: any) {
        console.error('❌ Error fetching round data:', err);

        // Show user-friendly error message
        if (err.message?.includes('timed out')) {
          console.warn(
            '⚠️ Blockchain request timed out. This might mean:\n' +
              '  1. The contract is not deployed\n' +
              '  2. The Stacks testnet is slow\n' +
              '  3. The network connection is poor'
          );
        }

        return null;
      }
    },
    [fetchRound, fetchRoundSubmissions]
  );

  /**
   * Refresh a specific story from blockchain (bypasses cache)
   */
  const refreshStory = useCallback(
    async (storyId: number) => {
      try {
        // Invalidate cache before refreshing
        await invalidateCache(CacheKeys.story(storyId));

        // Fetch fresh data (bypass cache)
        const updatedStory = await fetchStoryFromBlockchain(storyId, false);

        if (updatedStory) {
          // ✅ AUTO-UPDATE: Store is already updated by fetchStoryFromBlockchain
          console.log('🔄 Story refreshed and store updated');
          return updatedStory;
        }

        return null;
      } catch (err: any) {
        console.error('Error refreshing story:', err);
        return null;
      }
    },
    [fetchStoryFromBlockchain, updateStoryChain, invalidateCache]
  );

  /**
   * Refresh all stories from blockchain
   * Note: fetchAllStories already auto-updates the store
   */
  const refreshAllStories = useCallback(async () => {
    console.log('🔄 Refreshing all stories from blockchain...');
    const updatedStories = await fetchAllStories();
    console.log('✅ All stories refreshed and store updated');
    return updatedStories;
  }, [fetchAllStories]);

  /**
   * Get stories created by current user
   */
  const getUserStories = useCallback(async () => {
    if (!address) return [];

    try {
      console.log(`🔍 Fetching stories for user: ${address}`);
      const allStories = await fetchAllStories();

      // Filter stories created by current user
      const userStories = allStories.filter(
        (story) => story.creator === address
      );

      console.log(`✅ Found ${userStories.length} stories for user`);
      console.log('🔄 App store already updated with all stories');
      return userStories;
    } catch (err: any) {
      console.error('Error fetching user stories:', err);
      return [];
    }
  }, [address, fetchAllStories]);

  /**
   * Get stories the user has contributed to
   */
  const getContributedStories = useCallback(async () => {
    if (!address) return [];

    try {
      console.log(`🔍 Fetching contributed stories for user: ${address}`);
      const allStories = await fetchAllStories();

      // Filter stories where user has contributed (has blocks with user as contributor)
      const contributedStories = allStories.filter((story) =>
        story.blocks.some((block) => block.username === address)
      );

      console.log(`✅ Found ${contributedStories.length} contributed stories`);
      console.log('🔄 App store already updated with all stories');
      return contributedStories;
    } catch (err: any) {
      console.error('Error fetching contributed stories:', err);
      return [];
    }
  }, [address, fetchAllStories]);

  /**
   * Auto-refresh stories when component mounts
   * DISABLED to prevent rate limiting - use manual refresh instead
   */
  // useEffect(() => {
  //   // Only refresh if we have stories in local state but want to update them
  //   if (storyChains.length > 0) {
  //     refreshAllStories();
  //   }
  // }, [storyChains.length, refreshAllStories]);

  return {
    // State
    isLoading,
    error,
    stories: storyChains, // Current stories from local store

    // Actions
    fetchStoryFromBlockchain,
    fetchAllStories,
    fetchCurrentRound,
    refreshStory,
    refreshAllStories,
    getUserStories,
    getContributedStories,

    // Utilities
    clearError: () => setError(null),
  };
}
