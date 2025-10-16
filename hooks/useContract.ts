import { useState } from 'react';
import { Alert } from 'react-native';
import { useWallet } from '@/contexts/WalletContext';
import { useAppStore } from '@/store/useAppStore';
import {
  broadcastTransaction,
  makeContractCall,
  AnchorMode,
  PostConditionMode,
  cvToJSON,
  cvToValue,
  cvToString,
} from '@stacks/transactions';
import { CONTRACT_CONFIG } from '@/lib/contract-config';
import * as ContractUtils from '@/lib/contract-utils';

/**
 * ⚠️ BLOCKCHAIN DATA STRUCTURE NOTE:
 *
 * Data returned from Clarity smart contracts has a nested structure:
 * {
 *   "type": "(tuple ...)",
 *   "value": {
 *     "field-name": { "type": "uint", "value": "7" },
 *     "another-field": { "type": "bool", "value": false }
 *   }
 * }
 *
 * To extract values safely, use this pattern:
 *   const fieldValue = data.value?.['field-name']?.value ??
 *                     data['field-name']?.value ??
 *                     data['field-name'];
 *
 * This handles both nested and flat structures with proper fallbacks.
 */

/**
 * Custom hook for Sonichain contract interactions
 * Provides wallet connection state and contract call functions
 *
 * Usage:
 *   const { isConnected, address, registerUser, createStory } = useContract();
 */
export function useContract() {
  const { wallet, address, mnemonic, getPrivateKey } = useWallet();
  const { user, updateUser } = useAppStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const isConnected = !!wallet && !!address;

  /**
   * Generic contract call function
   * @param functionName - Contract function to call
   * @param functionArgs - Clarity value arguments
   * @param onSuccess - Callback on successful transaction
   */
  async function callContract(
    functionName: string,
    functionArgs: any[] = [],
    onSuccess?: (txId: string) => void
  ): Promise<string | null> {
    if (!wallet || !address) {
      Alert.alert('Wallet Error', 'Please connect your wallet first');
      return null;
    }

    const privateKey = getPrivateKey();
    if (!privateKey) {
      Alert.alert('Error', 'Unable to access wallet credentials');
      return null;
    }

    setIsProcessing(true);

    try {
      console.log('📤 Starting contract call:', functionName);
      console.log('📤 Function arguments:', functionArgs);
      console.log('📤 Sender address:', address);

      // Build transaction
      const txOptions = {
        contractAddress: CONTRACT_CONFIG.CONTRACT_ADDRESS,
        contractName: CONTRACT_CONFIG.CONTRACT_NAME,
        functionName,
        functionArgs,
        senderKey: privateKey,
        network: CONTRACT_CONFIG.NETWORK,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
        fee: CONTRACT_CONFIG.DEFAULT_FEE,
      };

      const transaction = await makeContractCall(txOptions);

      // Broadcast transaction
      const broadcastResponse = await broadcastTransaction({
        transaction,
        network: CONTRACT_CONFIG.NETWORK,
      });

      if ('error' in broadcastResponse) {
        console.error('❌ Broadcast error:', broadcastResponse.error);
        console.error(
          '❌ Full response:',
          JSON.stringify(broadcastResponse, null, 2)
        );

        // Provide more helpful error messages
        let errorMessage = broadcastResponse.error;
        if (errorMessage.includes('rejected')) {
          errorMessage =
            'Transaction was rejected by the network. This might be due to:\n\n• Contract function validation failed\n• Insufficient STX balance for fees\n• Invalid parameters\n• Story may be sealed or in wrong state\n\nCheck console logs for details.';
        } else if (errorMessage.includes('ConflictingNonceInMempool')) {
          errorMessage =
            'A transaction is already pending. Please wait a moment and try again.';
        } else if (errorMessage.includes('BadNonce')) {
          errorMessage = 'Nonce error. Please try again in a few moments.';
        }

        throw new Error(errorMessage);
      }

      const txId = broadcastResponse.txid;
      console.log('✅ Transaction broadcast successfully:', txId);

      if (onSuccess) {
        onSuccess(txId);
      }

      Alert.alert(
        'Success',
        `Transaction submitted: ${txId.substring(0, 8)}...`
      );
      return txId;
    } catch (error: any) {
      console.error('❌ Contract call failed:', error);
      console.error('❌ Function:', functionName);
      console.error('❌ Args:', functionArgs);

      Alert.alert(
        'Transaction Failed',
        error.message || 'Unknown error occurred'
      );
      return null;
    } finally {
      setIsProcessing(false);
    }
  }

  /**
   * Send STX to an address
   * @param recipientAddress - Recipient's Stacks address
   * @param amount - Amount in microSTX (1 STX = 1,000,000 microSTX)
   * @param memo - Optional memo text
   */
  async function sendSTX(
    recipientAddress: string,
    amount: number,
    memo?: string
  ): Promise<string | null> {
    if (!wallet || !address) {
      Alert.alert('Wallet Error', 'Please connect your wallet first');
      return null;
    }

    const privateKey = getPrivateKey();
    if (!privateKey) {
      Alert.alert('Error', 'Unable to access wallet credentials');
      return null;
    }

    setIsProcessing(true);

    try {
      const transaction = await ContractUtils.prepareSTXTransfer(
        recipientAddress,
        amount,
        privateKey,
        memo
      );

      const broadcastResponse = await broadcastTransaction({
        transaction,
        network: CONTRACT_CONFIG.NETWORK,
      });

      if ('error' in broadcastResponse) {
        throw new Error(broadcastResponse.error);
      }

      const txId = broadcastResponse.txid;
      console.log('STX transfer successful:', txId);

      Alert.alert('Success', `Sent ${amount / 1000000} STX`);
      return txId;
    } catch (error: any) {
      console.error('STX transfer failed:', error);
      Alert.alert('Transfer Failed', error.message || 'Unknown error occurred');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }

  /**
   * Read-only contract call wrapper
   * Use this to fetch data from the blockchain
   */
  async function readContract<T = any>(
    functionName: string,
    functionArgs: any[] = []
  ): Promise<T | null> {
    try {
      return await ContractUtils.callReadOnly<T>(
        functionName,
        functionArgs,
        address || undefined
      );
    } catch (error: any) {
      console.error('Read-only call failed:', error);
      return null;
    }
  }

  // ===========================================
  // SONICHAIN CONTRACT FUNCTIONS
  // ===========================================

  /**
   * Register user with username
   * @param username - Username (max 50 characters)
   */
  async function registerUserOnChain(username: string) {
    const txOptions = await ContractUtils.registerUser(username);

    return await callContract(
      txOptions.functionName,
      txOptions.functionArgs,
      (txId) => {
        console.log('User registered on chain:', txId);
      }
    );
  }

  /**
   * Create a new story on the blockchain
   * @param prompt - Story prompt (max 500 characters)
   * @param initTime - Initial time (epoch) for the story (defaults to current time)
   * @param votingWindow - Voting window duration in seconds (defaults to 24 hours)
   * @returns The transaction ID (we'll use this as the story ID for now)
   */
  async function createStoryOnChain(
    prompt: string,
    initTime?: number,
    votingWindow?: number
  ): Promise<string | null> {
    // Default to current Unix timestamp (in seconds) if not provided
    const now = initTime || Math.floor(Date.now() / 1000);
    // Default to 24 hours (86400 seconds) if not provided
    const window = votingWindow || 86400;

    const txOptions = await ContractUtils.createStory(prompt, now, window);

    const txId = await callContract(
      txOptions.functionName,
      txOptions.functionArgs,
      (txId) => {
        console.log('Story created on chain:', txId);
      }
    );

    return txId;
  }

  /**
   * Submit a voice block to current round
   * @param storyId - Story ID
   * @param uri - URI of the voice memo (e.g., IPFS hash)
   * @param now - Current timestamp (epoch) - defaults to current time if not provided
   */
  async function submitBlockOnChain(
    storyId: number,
    uri: string,
    now?: number
  ) {
    // Pre-flight validation checks
    console.log('🔍 Pre-flight validation for story:', storyId);

    try {
      // Check if story exists and is in correct state
      const story = await fetchStory(storyId);
      if (!story) {
        Alert.alert('Error', 'Story not found on blockchain');
        return null;
      }

      // Check if story is sealed - extract from nested structure
      const isSealed =
        story.value?.['is-sealed']?.value ??
        story['is-sealed']?.value ??
        story['is-sealed'];
      if (isSealed) {
        Alert.alert(
          'Story Sealed',
          'This story has been sealed and is no longer accepting submissions.'
        );
        return null;
      }

      console.log('✅ Pre-flight validation passed');
    } catch (error) {
      console.error('⚠️ Pre-flight validation error:', error);
      // Continue anyway, let the contract reject if needed
    }

    // Default to current Unix timestamp (in seconds) if not provided
    const timestamp = now || Math.floor(Date.now() / 1000);

    const txOptions = await ContractUtils.submitBlock(storyId, uri, timestamp);

    return await callContract(
      txOptions.functionName,
      txOptions.functionArgs,
      (txId) => {
        console.log('✅ Voice block submitted:', txId);
      }
    );
  }

  /**
   * Vote for a submission
   * @param submissionId - Submission ID to vote for
   */
  async function voteOnChain(submissionId: number) {
    const txOptions = await ContractUtils.voteBlock(submissionId);

    return await callContract(
      txOptions.functionName,
      txOptions.functionArgs,
      (txId) => {
        console.log('Vote submitted:', txId);
        // Update user stats
        if (user) {
          updateUser({ totalVotes: (user.totalVotes || 0) + 1 });
        }
      }
    );
  }

  /**
   * Finalize a round (select winning submission and start next round)
   * @param storyId - Story ID
   * @param roundNum - Round number to finalize
   * @param now - Current timestamp (epoch) - defaults to current time if not provided
   */
  async function finalizeRoundOnChain(
    storyId: number,
    roundNum: number,
    now?: number
  ) {
    // Default to current Unix timestamp (in seconds) if not provided
    const timestamp = now || Math.floor(Date.now() / 1000);
    //get round data from blockchain
    const roundData = await fetchRound(storyId, roundNum);
    if (!roundData) {
      Alert.alert('Error', 'Round not found on blockchain');
      return null;
    }

    // Extract is-finalized from nested structure
    const isFinalized =
      roundData.value?.['is-finalized']?.value ??
      roundData['is-finalized']?.value ??
      roundData['is-finalized'];

    if (isFinalized) {
      Alert.alert('Error', 'Round already finalized');
      return null;
    }

    console.log(
      'round data============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',
      roundData
    );

    // // Extract round-id from nested structure: roundData.value['round-id'].value
    // const roundId =
    //   roundData.value?.['round-id']?.value ??
    //   roundData['round-id']?.value ??
    //   roundData['round-id'];

    // if (!roundId) {
    //   Alert.alert('Error', 'Round ID not found');
    //   return null;
    // }

    // console.log(
    //   'round id============>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>',
    //   roundId
    // );

    const txOptions = await ContractUtils.finalizeRound(
      storyId,
      roundNum,
      timestamp
    );

    return await callContract(
      txOptions.functionName,
      txOptions.functionArgs,
      (txId) => {
        console.log('Round finalized:', txId);
      }
    );
  }

  /**
   * Fund a story's bounty pool
   * @param storyId - Story ID
   * @param amount - Amount in microSTX
   */
  async function fundBountyOnChain(storyId: number, amount: number) {
    const txOptions = await ContractUtils.fundBounty(storyId, amount);

    return await callContract(
      txOptions.functionName,
      txOptions.functionArgs,
      (txId) => {
        console.log('Bounty funded:', txId);
      }
    );
  }

  /**
   * Seal a story and distribute rewards to all contributors
   * @param storyId - Story ID
   */
  async function sealStoryOnChain(storyId: number) {
    const txOptions = await ContractUtils.sealStory(storyId);

    return await callContract(
      txOptions.functionName,
      txOptions.functionArgs,
      (txId) => {
        console.log('Story sealed and rewards distributed:', txId);
      }
    );
  }

  // ===========================================
  // READ-ONLY QUERY FUNCTIONS
  // ===========================================

  /**
   * Get story data from blockchain
   * @param storyId - Story ID
   */
  async function fetchStory(storyId: number) {
    return await ContractUtils.getStory(storyId);
  }

  /**
   * Get round data
   * @param storyId - Story ID
   * @param roundNum - Round number
   */
  async function fetchStoryRounds(storyId: number) {
    const _rounds = await ContractUtils.getStoryRound(storyId);
    console.log('🔍 Rounds upon first fetch:', _rounds);
    console.log('🔍 Rounds upon first sort:', _rounds.value);
    return _rounds.value;
  }

  /**
   * Get round data
   * @param storyId - Story ID
   * @param roundNum - Round number
   */
  async function fetchRound(storyId: number, roundNum: number) {
    return await ContractUtils.getRound(storyId, roundNum);
  }

  /**
   * Get all submissions for a round
   * @param storyId - Story ID
   * @param roundNum - Round number
   */
  async function fetchRoundSubmissions(storyId: number, roundNum: number) {
    const _submissions = await ContractUtils.getAllRoundSubmissions(
      storyId,
      roundNum
    );
    console.log('🔍 Submissions upon first fetch:', _submissions);
    return _submissions;
  }

  /**
   * Check if user has voted in a round
   * @param storyId - Story ID
   * @param roundNum - Round number
   * @param voterAddress - Voter's address (defaults to current user)
   */
  async function checkHasVoted(
    storyId: number,
    roundNum: number,
    voterAddress?: string
  ) {
    return await ContractUtils.hasVoted(
      storyId,
      roundNum,
      voterAddress || address || ''
    );
  }

  /**
   * Check if voting is active at a specific time (defaults to current time)
   * @param storyId - Story ID
   * @param roundNum - Round number
   * @param now - Timestamp (epoch) to check - defaults to current time if not provided
   */
  async function checkVotingActive(
    storyId: number,
    roundNum: number,
    now?: number
  ) {
    return await ContractUtils.isVotingActiveAt(storyId, roundNum, now);
  }

  /**
   * Check if round can be finalized at a specific time (defaults to current time)
   * @param storyId - Story ID
   * @param roundNum - Round number
   * @param now - Timestamp (epoch) to check - defaults to current time if not provided
   */
  async function checkCanFinalize(
    storyId: number,
    roundNum: number,
    now?: number
  ) {
    return await ContractUtils.canFinalizeRoundAt(storyId, roundNum, now);
  }

  /**
   * Get complete story chain (all finalized blocks)
   * @param storyId - Story ID
   */
  async function fetchCompleteStory(storyId: number) {
    return await ContractUtils.getCompleteStoryChain(storyId);
  }

  /**
   * Get user registration data
   * @param userAddress - User's address (defaults to current user)
   */
  async function fetchUserData(userAddress?: string) {
    return await ContractUtils.getUser(userAddress || address || '');
  }

  /**
   * Get contributor stats for a story
   * @param storyId - Story ID
   * @param contributorAddress - Contributor's address
   */
  async function fetchContributorStats(
    storyId: number,
    contributorAddress?: string
  ) {
    return await ContractUtils.getContributorStats(
      storyId,
      contributorAddress || address || ''
    );
  }

  return {
    // Wallet state
    isConnected,
    address,
    wallet,
    isProcessing,

    // Generic functions
    callContract,
    readContract,
    sendSTX,

    // User functions
    registerUserOnChain,
    fetchUserData,

    // Story lifecycle functions
    createStoryOnChain,
    submitBlockOnChain,
    voteOnChain,
    finalizeRoundOnChain,
    sealStoryOnChain,

    // Bounty functions
    fundBountyOnChain,

    // Query functions
    fetchStory,
    fetchRound,
    fetchRoundSubmissions,
    fetchCompleteStory,
    fetchContributorStats,
    checkHasVoted,
    checkVotingActive,
    checkCanFinalize,
    fetchStoryRounds,
  };
}
