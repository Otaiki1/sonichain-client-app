import {
  fetchCallReadOnlyFunction,
  cvToValue,
  uintCV,
  stringAsciiCV,
  principalCV,
  tupleCV,
  listCV,
  ClarityValue,
  PostConditionMode,
} from '@stacks/transactions';
import { makeSTXTokenTransfer } from '@stacks/transactions';
import { CONTRACT_CONFIG } from './contract-config';

/**
 * Base function for read-only contract calls
 * Use this to fetch data from the blockchain without spending gas
 */
export async function callReadOnly<T = any>(
  functionName: string,
  functionArgs: ClarityValue[] = [],
  senderAddress?: string
): Promise<T> {
  try {
    const response = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_CONFIG.CONTRACT_ADDRESS,
      contractName: CONTRACT_CONFIG.CONTRACT_NAME,
      functionName,
      functionArgs,
      senderAddress: senderAddress || CONTRACT_CONFIG.CONTRACT_ADDRESS,
      network: CONTRACT_CONFIG.NETWORK,
    });

    // Convert Clarity value to JavaScript value
    return cvToValue(response) as T;
  } catch (error) {
    console.error(`Error calling ${functionName}:`, error);
    throw error;
  }
}

/**
 * Prepare transaction options for contract calls
 * Returns options that can be used with transaction signing
 */
export function prepareContractCall(
  functionName: string,
  functionArgs: ClarityValue[] = []
) {
  return {
    contractAddress: CONTRACT_CONFIG.CONTRACT_ADDRESS,
    contractName: CONTRACT_CONFIG.CONTRACT_NAME,
    functionName,
    functionArgs,
    postConditionMode: PostConditionMode.Allow,
    network: CONTRACT_CONFIG.NETWORK,
  };
}

/**
 * Prepare STX transfer transaction
 */
export async function prepareSTXTransfer(
  recipientAddress: string,
  amount: number, // in microSTX
  senderPrivateKey: string,
  memo?: string
) {
  const txOptions = {
    recipient: recipientAddress,
    amount: amount,
    senderKey: senderPrivateKey,
    network: CONTRACT_CONFIG.NETWORK,
    memo: memo,
    anchorMode: 'any' as const,
  };

  return await makeSTXTokenTransfer(txOptions);
}

/**
 * Clarity Value Helpers
 * Use these to convert JavaScript values to Clarity types
 */
export const clarityHelpers = {
  uint: (value: number) => uintCV(value),
  string: (value: string) => stringAsciiCV(value),
  principal: (address: string) => principalCV(address),
  tuple: (data: Record<string, ClarityValue>) => tupleCV(data),
  list: (items: ClarityValue[]) => listCV(items),
};

// ===========================================
// CONTRACT FUNCTION TEMPLATES
// TODO: Replace these with your actual contract functions
// ===========================================

/**
 * EXAMPLE: Create Story Contract Call
 * Replace this with your actual create-story function
 */
export async function createStory(
  title: string,
  category: string,
  maxBlocks: number,
  bountyAmount?: number
) {
  const functionArgs = [
    stringAsciiCV(title),
    stringAsciiCV(category),
    uintCV(maxBlocks),
    // Add more args as needed for your contract
  ];

  return prepareContractCall('create-story', functionArgs);
}

/**
 * EXAMPLE: Submit Voice Block
 * Replace with your actual submit-block function
 */
export async function submitVoiceBlock(
  storyId: number,
  audioUri: string,
  duration: number
) {
  const functionArgs = [
    uintCV(storyId),
    stringAsciiCV(audioUri),
    uintCV(duration),
  ];

  return prepareContractCall('submit-voice-block', functionArgs);
}

/**
 * EXAMPLE: Vote on Submission
 * Replace with your actual vote function
 */
export async function voteOnSubmission(storyId: number, submissionId: number) {
  const functionArgs = [uintCV(storyId), uintCV(submissionId)];

  return prepareContractCall('vote', functionArgs);
}

/**
 * EXAMPLE: Finalize Story
 * Replace with your actual finalize function
 */
export async function finalizeStory(storyId: number) {
  const functionArgs = [uintCV(storyId)];

  return prepareContractCall('finalize-story', functionArgs);
}

/**
 * EXAMPLE: Get Story Details (Read-Only)
 * Replace with your actual get-story function
 */
export async function getStory(storyId: number) {
  return await callReadOnly('get-story', [uintCV(storyId)]);
}

/**
 * EXAMPLE: Get All Stories (Read-Only)
 * Replace with your actual get-all-stories function
 */
export async function getAllStories() {
  // First get the total count
  const totalStories = await callReadOnly<number>('get-story-count');

  // Then fetch each story
  const stories = [];
  for (let i = 0; i < totalStories; i++) {
    const story = await getStory(i);
    if (story) stories.push(story);
  }

  return stories;
}

/**
 * EXAMPLE: Mint Story NFT (Contract Call)
 * Replace with your actual mint-nft function
 */
export async function mintStoryNFT(storyId: number, recipientAddress: string) {
  const functionArgs = [uintCV(storyId), principalCV(recipientAddress)];

  return prepareContractCall('mint-story-nft', functionArgs);
}
