import {
  fetchCallReadOnlyFunction,
  cvToValue,
  uintCV,
  stringAsciiCV,
  stringUtf8CV,
  principalCV,
  tupleCV,
  listCV,
  ClarityValue,
  PostConditionMode,
  someCV,
  noneCV,
  bufferCV,
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
  stringAscii: (value: string) => stringAsciiCV(value),
  stringUtf8: (value: string) => stringUtf8CV(value),
  principal: (address: string) => principalCV(address),
  tuple: (data: Record<string, ClarityValue>) => tupleCV(data),
  list: (items: ClarityValue[]) => listCV(items),
  some: (value: ClarityValue) => someCV(value),
  none: () => noneCV(),
  buffer: (value: Buffer) => bufferCV(value),
};

// ===========================================
// USER REGISTRATION FUNCTIONS
// ===========================================

/**
 * Register a user with a unique username
 * @param username - Username (max 50 characters)
 * @returns Transaction options
 */
export async function registerUser(username: string) {
  const functionArgs = [stringUtf8CV(username)];
  return prepareContractCall('register-user', functionArgs);
}

/**
 * Get user registration data
 * @param userAddress - User's Stacks address
 * @returns User data or null
 */
export async function getUser(userAddress: string) {
  return await callReadOnly('get-user', [principalCV(userAddress)]);
}

// ===========================================
// STORY LIFECYCLE FUNCTIONS
// ===========================================

/**
 * Create a new story with initial prompt
 * @param prompt - Story prompt (max 500 characters)
 * @returns Transaction options
 */
export async function createStory(prompt: string) {
  const functionArgs = [stringUtf8CV(prompt)];
  return prepareContractCall('create-story', functionArgs);
}

/**
 * Submit a voice block to the current round
 * @param storyId - Story ID
 * @param uri - URI of the voice memo (e.g., IPFS hash)
 * @returns Transaction options
 */
export async function submitBlock(storyId: number, uri: string) {
  const functionArgs = [uintCV(storyId), stringAsciiCV(uri)];
  return prepareContractCall('submit-block', functionArgs);
}

/**
 * Vote for a submission
 * @param submissionId - Submission ID to vote for
 * @returns Transaction options
 */
export async function voteBlock(submissionId: number) {
  const functionArgs = [uintCV(submissionId)];
  return prepareContractCall('vote-block', functionArgs);
}

/**
 * Finalize a round (select winning submission)
 * @param storyId - Story ID
 * @param roundNum - Round number to finalize
 * @returns Transaction options
 */
export async function finalizeRound(storyId: number, roundNum: number) {
  const functionArgs = [uintCV(storyId), uintCV(roundNum)];
  return prepareContractCall('finalize-round', functionArgs);
}

/**
 * Fund a story's bounty pool
 * @param storyId - Story ID
 * @param amount - Amount in microSTX
 * @returns Transaction options
 */
export async function fundBounty(storyId: number, amount: number) {
  const functionArgs = [uintCV(storyId), uintCV(amount)];
  return prepareContractCall('fund-bounty', functionArgs);
}

/**
 * Seal a story and distribute rewards
 * @param storyId - Story ID
 * @returns Transaction options
 */
export async function sealStory(storyId: number) {
  const functionArgs = [uintCV(storyId)];
  return prepareContractCall('seal-story', functionArgs);
}

// ===========================================
// READ-ONLY QUERY FUNCTIONS
// ===========================================

/**
 * Get story data
 * @param storyId - Story ID
 * @returns Story data or null
 */
export async function getStory(storyId: number) {
  return await callReadOnly('get-story', [uintCV(storyId)]);
}

/**
 * Get round data
 * @param storyId - Story ID
 * @param roundNum - Round number
 * @returns Round data or null
 */
export async function getRound(storyId: number, roundNum: number) {
  return await callReadOnly('get-round', [uintCV(storyId), uintCV(roundNum)]);
}

/**
 * Get submission data
 * @param submissionId - Submission ID
 * @returns Submission data or null
 */
export async function getSubmission(submissionId: number) {
  return await callReadOnly('get-submission', [uintCV(submissionId)]);
}

/**
 * Get story chain block data
 * @param storyId - Story ID
 * @param blockIndex - Block index in the chain
 * @returns Block data or null
 */
export async function getStoryChainBlock(storyId: number, blockIndex: number) {
  return await callReadOnly('get-story-chain-block', [
    uintCV(storyId),
    uintCV(blockIndex),
  ]);
}

/**
 * Check if a user has voted in a round
 * @param storyId - Story ID
 * @param roundNum - Round number
 * @param voter - Voter's address
 * @returns true if voted, false otherwise
 */
export async function hasVoted(
  storyId: number,
  roundNum: number,
  voter: string
) {
  return await callReadOnly('has-voted', [
    uintCV(storyId),
    uintCV(roundNum),
    principalCV(voter),
  ]);
}

/**
 * Get user's vote in a round
 * @param storyId - Story ID
 * @param roundNum - Round number
 * @param voter - Voter's address
 * @returns Submission ID they voted for, or null
 */
export async function getUserVote(
  storyId: number,
  roundNum: number,
  voter: string
) {
  return await callReadOnly('get-user-vote', [
    uintCV(storyId),
    uintCV(roundNum),
    principalCV(voter),
  ]);
}

/**
 * Get contributor statistics
 * @param storyId - Story ID
 * @param contributor - Contributor's address
 * @returns Contributor stats (block-count)
 */
export async function getContributorStats(
  storyId: number,
  contributor: string
) {
  return await callReadOnly('get-contributor-stats', [
    uintCV(storyId),
    principalCV(contributor),
  ]);
}

/**
 * Get number of submissions in a round
 * @param storyId - Story ID
 * @param roundNum - Round number
 * @returns Number of submissions
 */
export async function getRoundSubmissionCount(
  storyId: number,
  roundNum: number
) {
  return await callReadOnly('get-round-submission-count', [
    uintCV(storyId),
    uintCV(roundNum),
  ]);
}

/**
 * Get submission at index in a round
 * @param storyId - Story ID
 * @param roundNum - Round number
 * @param index - Index in the submissions list
 * @returns Submission data or null
 */
export async function getRoundSubmissionAt(
  storyId: number,
  roundNum: number,
  index: number
) {
  return await callReadOnly('get-round-submission-at', [
    uintCV(storyId),
    uintCV(roundNum),
    uintCV(index),
  ]);
}

/**
 * Check if voting is currently active
 * @param storyId - Story ID
 * @param roundNum - Round number
 * @returns true if voting is active, false otherwise
 */
export async function isVotingActive(storyId: number, roundNum: number) {
  return await callReadOnly('is-voting-active', [
    uintCV(storyId),
    uintCV(roundNum),
  ]);
}

/**
 * Check if a round can be finalized
 * @param storyId - Story ID
 * @param roundNum - Round number
 * @returns true if round can be finalized, false otherwise
 */
export async function canFinalizeRound(storyId: number, roundNum: number) {
  return await callReadOnly('can-finalize-round', [
    uintCV(storyId),
    uintCV(roundNum),
  ]);
}

/**
 * Get the winning submission for a round
 * @param storyId - Story ID
 * @param roundNum - Round number
 * @returns Winning submission ID or error
 */
export async function getWinningSubmission(storyId: number, roundNum: number) {
  return await callReadOnly('get-winning-submission', [
    uintCV(storyId),
    uintCV(roundNum),
  ]);
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Get all submissions for a round
 * @param storyId - Story ID
 * @param roundNum - Round number
 * @returns Array of submissions
 */
export async function getAllRoundSubmissions(
  storyId: number,
  roundNum: number
) {
  const count = await getRoundSubmissionCount(storyId, roundNum);
  const submissions = [];

  for (let i = 0; i < count; i++) {
    const submissionData = await getRoundSubmissionAt(storyId, roundNum, i);
    if (submissionData) {
      const submissionId = submissionData['submission-id'];
      const fullSubmission = await getSubmission(submissionId);
      if (fullSubmission) {
        submissions.push({
          id: submissionId,
          ...fullSubmission,
        });
      }
    }
  }

  return submissions;
}

/**
 * Get complete story chain (all finalized blocks)
 * @param storyId - Story ID
 * @returns Array of finalized blocks
 */
export async function getCompleteStoryChain(storyId: number) {
  const storyData = await getStory(storyId);
  if (!storyData) return [];

  const totalBlocks = storyData['total-blocks'];
  const chain = [];

  for (let i = 0; i < totalBlocks; i++) {
    const blockData = await getStoryChainBlock(storyId, i);
    if (blockData) {
      chain.push({
        blockIndex: i,
        ...blockData,
      });
    }
  }

  return chain;
}
