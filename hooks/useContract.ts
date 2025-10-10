import { useState, useEffect } from 'react';
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
 * Custom hook for Stacks contract interactions
 * Provides wallet connection state and contract call functions
 *
 * Usage:
 *   const { isConnected, address, callContract, sendSTX } = useContract();
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
      Alert.alert('Read Failed', error.message || 'Failed to fetch data');
      return null;
    }
  }

  // ===========================================
  // YOUR CONTRACT FUNCTIONS GO HERE
  // TODO: Implement your specific contract functions below
  // ===========================================

  /**
   * TEMPLATE: Create Story on Blockchain
   * TODO: Update arguments to match your contract
   */
  async function createStoryOnChain(
    title: string,
    category: string,
    maxBlocks: number,
    bountyAmount: number = 0
  ) {
    const txOptions = await ContractUtils.createStory(
      title,
      category,
      maxBlocks,
      bountyAmount
    );

    return await callContract(
      txOptions.functionName,
      txOptions.functionArgs,
      (txId) => {
        console.log('Story created on chain:', txId);
        // TODO: Update local state, add story to database, etc.
      }
    );
  }

  /**
   * TEMPLATE: Submit Voice Block
   * TODO: Update arguments to match your contract
   */
  async function submitVoiceBlockOnChain(
    storyId: number,
    audioUri: string,
    duration: number
  ) {
    const txOptions = await ContractUtils.submitVoiceBlock(
      storyId,
      audioUri,
      duration
    );

    return await callContract(
      txOptions.functionName,
      txOptions.functionArgs,
      (txId) => {
        console.log('Voice block submitted:', txId);
        // TODO: Update local state
      }
    );
  }

  /**
   * TEMPLATE: Vote on Submission
   * TODO: Update arguments to match your contract
   */
  async function voteOnChain(storyId: number, submissionId: number) {
    const txOptions = await ContractUtils.voteOnSubmission(
      storyId,
      submissionId
    );

    return await callContract(
      txOptions.functionName,
      txOptions.functionArgs,
      (txId) => {
        console.log('Vote submitted:', txId);
        // TODO: Update vote count, user stats, etc.
      }
    );
  }

  /**
   * TEMPLATE: Finalize Story and Distribute Bounty
   * TODO: Update arguments to match your contract
   */
  async function finalizeStoryOnChain(storyId: number) {
    const txOptions = await ContractUtils.finalizeStory(storyId);

    return await callContract(
      txOptions.functionName,
      txOptions.functionArgs,
      (txId) => {
        console.log('Story finalized:', txId);
        // TODO: Mint NFTs, distribute bounty, update status
      }
    );
  }

  /**
   * TEMPLATE: Fetch Story from Blockchain
   * TODO: Update return type to match your contract
   */
  async function fetchStory(storyId: number) {
    return await readContract('get-story', [
      ContractUtils.clarityHelpers.uint(storyId),
    ]);
  }

  /**
   * TEMPLATE: Fetch All Stories
   * TODO: Implement based on your contract structure
   */
  async function fetchAllStories() {
    return await ContractUtils.getAllStories();
  }

  /**
   * TEMPLATE: Mint Story NFT
   * TODO: Update to match your NFT minting logic
   */
  async function mintStoryNFTOnChain(
    storyId: number,
    recipientAddress: string
  ) {
    const txOptions = await ContractUtils.mintStoryNFT(
      storyId,
      recipientAddress
    );

    return await callContract(
      txOptions.functionName,
      txOptions.functionArgs,
      (txId) => {
        console.log('NFT minted:', txId);
        // TODO: Update user NFT collection
      }
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

    // Your contract-specific functions (templates)
    createStoryOnChain,
    submitVoiceBlockOnChain,
    voteOnChain,
    finalizeStoryOnChain,
    fetchStory,
    fetchAllStories,
    mintStoryNFTOnChain,
  };
}
