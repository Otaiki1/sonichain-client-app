import { useState } from 'react';
import { Alert } from 'react-native';
import { useWallet } from '@/contexts/WalletContext';
import { useAppStore } from '@/store/useAppStore';
import {
  broadcastTransaction,
  makeContractCall,
  AnchorMode,
  PostConditionMode,
} from '@stacks/transactions';
import { CONTRACT_CONFIG } from '@/lib/contract-config';
import * as ContractUtils from '@/lib/contract-utils';

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
        throw new Error(broadcastResponse.error);
      }

      const txId = broadcastResponse.txid;
      console.log('Transaction broadcast successfully:', txId);

      if (onSuccess) {
        onSuccess(txId);
      }

      Alert.alert(
        'Success',
        `Transaction submitted: ${txId.substring(0, 8)}...`
      );
      return txId;
    } catch (error: any) {
      console.error('Contract call failed:', error);
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
   * @returns The transaction ID (we'll use this as the story ID for now)
   */
  async function createStoryOnChain(prompt: string): Promise<string | null> {
    const txOptions = await ContractUtils.createStory(prompt);

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
   */
  async function submitBlockOnChain(storyId: number, uri: string) {
    const txOptions = await ContractUtils.submitBlock(storyId, uri);

    return await callContract(
      txOptions.functionName,
      txOptions.functionArgs,
      (txId) => {
        console.log('Voice block submitted:', txId);
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
   */
  async function finalizeRoundOnChain(storyId: number, roundNum: number) {
    const txOptions = await ContractUtils.finalizeRound(storyId, roundNum);

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
  async function fetchRound(storyId: number, roundNum: number) {
    return await ContractUtils.getRound(storyId, roundNum);
  }

  /**
   * Get all submissions for a round
   * @param storyId - Story ID
   * @param roundNum - Round number
   */
  async function fetchRoundSubmissions(storyId: number, roundNum: number) {
    return await ContractUtils.getAllRoundSubmissions(storyId, roundNum);
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
   * Check if voting is active for a round
   * @param storyId - Story ID
   * @param roundNum - Round number
   */
  async function checkVotingActive(storyId: number, roundNum: number) {
    return await ContractUtils.isVotingActive(storyId, roundNum);
  }

  /**
   * Check if round can be finalized
   * @param storyId - Story ID
   * @param roundNum - Round number
   */
  async function checkCanFinalize(storyId: number, roundNum: number) {
    return await ContractUtils.canFinalizeRound(storyId, roundNum);
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
  };
}
