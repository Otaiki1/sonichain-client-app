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
import { withRateLimit } from '../utils/rateLimiter';

/**
 * Safely serialize function arguments for rate limiting cache keys
 * Handles BigInt values that can't be JSON.stringify'd
 */
function serializeArgsForCache(functionArgs: ClarityValue[]): string {
  try {
    return JSON.stringify(functionArgs, (key, value) => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      return value;
    });
  } catch (error) {
    // Fallback to a simple string representation
    return functionArgs
      .map((arg) => {
        try {
          return JSON.stringify(arg, (key, value) => {
            if (typeof value === 'bigint') {
              return value.toString();
            }
            return value;
          });
        } catch {
          return String(arg);
        }
      })
      .join('-');
  }
}

/**
 * Create a promise that times out after specified milliseconds
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), timeoutMs)
    ),
  ]);
}

/**
 * Base function for read-only contract calls
 * Use this to fetch data from the blockchain without spending gas
 */
export async function callReadOnly<T = any>(
  functionName: string,
  functionArgs: ClarityValue[] = [],
  senderAddress?: string
): Promise<T> {
  // Production check: Blockchain must be enabled
  if (!CONTRACT_CONFIG.BLOCKCHAIN_ENABLED) {
    const errorMsg =
      `🚨 PRODUCTION ERROR: Blockchain is disabled but required for app to function.\n` +
      `Set BLOCKCHAIN_ENABLED to true in lib/contract-config.ts`;
    console.error(errorMsg);
    throw new Error(
      'Blockchain integration is disabled - app cannot function in production mode'
    );
  }

  // Wrap with rate limiting
  return withRateLimit(
    `${functionName}-${serializeArgsForCache(functionArgs)}`,
    async () => {
      try {
        // Add 10 second timeout to prevent hanging requests
        const response = await withTimeout(
          fetchCallReadOnlyFunction({
            contractAddress: CONTRACT_CONFIG.CONTRACT_ADDRESS,
            contractName: CONTRACT_CONFIG.CONTRACT_NAME,
            functionName,
            functionArgs,
            senderAddress: senderAddress || CONTRACT_CONFIG.CONTRACT_ADDRESS,
            network: CONTRACT_CONFIG.NETWORK,
          }),
          10000 // 10 seconds timeout
        );

        // Convert Clarity value to JavaScript value
        return cvToValue(response) as T;
      } catch (error: any) {
        console.error(`Error calling ${functionName}:`, error);

        // Provide more helpful error messages
        if (error.message === 'Request timed out') {
          throw new Error(
            `Blockchain request timed out. The network might be slow or the contract might not exist at ${CONTRACT_CONFIG.CONTRACT_ADDRESS}.${CONTRACT_CONFIG.CONTRACT_NAME}`
          );
        }

        throw error;
      }
    }
  );
}

/**
 * Prepare transaction options for contract calls
 * Returns options that can be used with transaction signing
 */
export function prepareContractCall(
  functionName: string,
  functionArgs: ClarityValue[] = []
) {
  // Production: Blockchain must be enabled
  if (!CONTRACT_CONFIG.BLOCKCHAIN_ENABLED) {
    const errorMsg = `🚨 PRODUCTION ERROR: Attempting contract call "${functionName}" but blockchain is disabled`;
    console.error(errorMsg);
    throw new Error(
      'Blockchain integration is disabled - cannot execute contract calls'
    );
  }

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
// COUNTER FUNCTIONS (NEW - PRODUCTION)
// ===========================================

/**
 * Get the current story counter
 * Use this to determine how many stories have been created on the blockchain
 * Stories are numbered from 1 to story-counter
 * @returns The current story counter value
 */
export async function getStoryCounter(): Promise<number> {
  return await callReadOnly<number>('get-story-counter', []);
}

/**
 * Get the current submission counter
 * @returns The current submission counter value
 */
export async function getSubmissionCounter(): Promise<number> {
  return await callReadOnly<number>('get-submission-counter', []);
}

/**
 * Get the current round counter
 * @returns The current round counter value
 */
export async function getRoundCounter(): Promise<number> {
  return await callReadOnly<number>('get-round-counter', []);
}

// ===========================================
// STORY LIFECYCLE FUNCTIONS
// ===========================================

/**
 * Create a new story with initial prompt
 * @param prompt - Story prompt (max 500 characters)
 * @param initTime - Initial time (epoch) for the story
 * @param votingWindow - Voting window duration (epoch)
 * @returns Transaction options
 */
export async function createStory(
  prompt: string,
  initTime: number,
  votingWindow: number
) {
  const functionArgs = [
    stringUtf8CV(prompt),
    uintCV(initTime),
    uintCV(votingWindow),
  ];
  return prepareContractCall('create-story', functionArgs);
}

/**
 * Submit a voice block to the current round
 * @param storyId - Story ID
 * @param uri - URI of the voice memo (e.g., Supabase storage path like "uploads/xxx.m4a")
 * @param now - Current timestamp (epoch)
 * @returns Transaction options
 *
 * NOTE: Now storing only the path (~64 chars) instead of full URL (146 chars),
 * so string-ascii is sufficient. Path format: "uploads/timestamp-filename.m4a"
 */
export async function submitBlock(storyId: number, uri: string, now: number) {
  // Use stringAsciiCV - paths are ~64 chars, well under the limit
  // Store only the path (e.g., "uploads/xxx.m4a") not full URL
  const functionArgs = [uintCV(storyId), stringAsciiCV(uri), uintCV(now)];
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
 * @param now - Current timestamp (epoch)
 * @returns Transaction options
 */
export async function finalizeRound(
  storyId: number,
  roundNum: number,
  now: number
) {
  const functionArgs = [uintCV(storyId), uintCV(roundNum), uintCV(now)];
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
export async function getStoryRound(storyId: number) {
  return await callReadOnly('list-rounds', [uintCV(storyId)]);
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
 * Check if voting is active at a specific time
 * @param storyId - Story ID
 * @param roundNum - Round number
 * @param now - Timestamp (epoch) to check (defaults to current time)
 * @returns true if voting is active at the given time, false otherwise
 */
export async function isVotingActiveAt(
  storyId: number,
  roundNum: number,
  now?: number
) {
  const timestamp = now || Math.floor(Date.now() / 1000);
  return await callReadOnly('is-voting-active-at', [
    uintCV(storyId),
    uintCV(roundNum),
    uintCV(timestamp),
  ]);
}

/**
 * Check if a round can be finalized at a specific time
 * @param storyId - Story ID
 * @param roundNum - Round number
 * @param now - Timestamp (epoch) to check (defaults to current time)
 * @returns true if round can be finalized at the given time, false otherwise
 */
export async function canFinalizeRoundAt(
  storyId: number,
  roundNum: number,
  now?: number
) {
  const timestamp = now || Math.floor(Date.now() / 1000);
  return await callReadOnly('can-finalize-round-at', [
    uintCV(storyId),
    uintCV(roundNum),
    uintCV(timestamp),
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

/**
 * List all round numbers for a story (up to MAX_ROUNDS_PER_STORY)
 * @param storyId - Story ID
 * @returns Array of round numbers
 */
export async function listRounds(storyId: number) {
  return await callReadOnly('list-rounds', [uintCV(storyId)]);
}

/**
 * List all submission IDs for a round (up to MAX_SUBMISSIONS_PER_ROUND)
 * @param storyId - Story ID
 * @param roundNum - Round number
 * @returns Array of submission IDs
 */
export async function listRoundSubmissions(storyId: number, roundNum: number) {
  return await callReadOnly('list-round-submissions', [
    uintCV(storyId),
    uintCV(roundNum),
  ]);
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Helper to extract value from blockchain response
 * Handles nested {type, value} structures
 */
function extractValue(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data === 'object' && 'value' in data) {
    return data.value;
  }
  return data;
}

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

  for (let i = 0; i <= count; i++) {
    const submissionData = await getRoundSubmissionAt(storyId, roundNum, i);
    console.log('🔍 Submission data:', submissionData);
    if (submissionData) {
      // Extract the actual value from the nested structure
      const submissionId = submissionData.value['submission-id'].value;
      console.log(
        `🔍 Round submission ${roundNum}: submissionId =`,
        submissionId
      );

      const fullSubmission = await getSubmission(submissionId);
      console.log('🔍 Full submission:', fullSubmission);
      if (fullSubmission) {
        submissions.push({
          id: submissionId,
          ...fullSubmission.value,
        });
      }
    }
  }
  console.log('🔍 Submissions:', submissions);
  return submissions;
}

/**
 * Get complete story chain (all finalized blocks)
 * @param storyId - Story ID
 * @returns Array of finalized blocks with full submission data
 */
export async function getCompleteStoryChain(storyId: number) {
  const storyDataRaw = await getStory(storyId);
  if (!storyDataRaw) return [];

  // Extract nested values from story data
  const storyData = storyDataRaw.value || storyDataRaw;
  const totalBlocks = extractValue(storyData['total-blocks']);

  console.log(
    `🔍 Getting complete story chain for story ${storyId}, totalBlocks:`,
    totalBlocks
  );

  const chain = [];

  for (let i = 0; i < totalBlocks; i++) {
    const blockDataRaw = await getStoryChainBlock(storyId, i);
    if (blockDataRaw) {
      // Extract nested values from block data
      const blockData = blockDataRaw.value || blockDataRaw;

      // blockData contains: { submission-id, contributor, finalized-at }
      const submissionId = extractValue(blockData['submission-id']);
      console.log(`🔍 Story chain block ${i}: submissionId =`, submissionId);

      // Fetch full submission details
      const fullSubmission = await getSubmission(submissionId);

      if (fullSubmission) {
        chain.push({
          blockIndex: i,
          'submission-id': submissionId, // Include the ID explicitly
          id: submissionId, // Also as 'id' for easier access
          ...fullSubmission,
          'finalized-at': extractValue(blockData['finalized-at']), // Keep finalized timestamp
        });
      }
    }
  }

  return chain;
}

/**
 * PRODUCTION: Fetch all stories from blockchain using story-counter
 * This is the recommended way to get all stories in production
 *
 * @returns Array of all story IDs that exist on the blockchain
 */
export async function getAllStoryIds(): Promise<number[]> {
  try {
    console.log('📊 Fetching story counter from blockchain...');
    const counter = await getStoryCounter();

    console.log(`✅ Story counter: ${counter}`);

    if (!counter || counter === 0) {
      console.log('ℹ️ No stories exist on blockchain yet');
      return [];
    }

    // Story IDs are numbered from 1 to counter
    const storyIds: number[] = [];
    for (let i = 1; i <= counter; i++) {
      storyIds.push(i);
    }

    console.log(
      `📚 Found ${storyIds.length} story IDs on blockchain`,
      storyIds
    );
    return storyIds;
  } catch (error) {
    console.error('❌ Error fetching story counter:', error);
    return [];
  }
}

/**
 * PRODUCTION: Fetch all stories with their data from blockchain
 * Uses story-counter to efficiently fetch all stories
 *
 * @returns Array of story data for all existing stories
 */
export async function getAllStoriesFromBlockchain() {
  try {
    const storyIds = await getAllStoryIds();

    if (storyIds.length === 0) {
      return [];
    }

    console.log(`🔄 Fetching ${storyIds.length} stories from blockchain...`);

    const stories = [];
    for (const storyId of storyIds) {
      const storyData = await getStory(storyId);
      if (storyData) {
        stories.push({
          id: storyId,
          ...storyData,
        });
      }
    }

    console.log(`✅ Successfully fetched ${stories.length} stories`);
    return stories;
  } catch (error) {
    console.error('❌ Error fetching all stories:', error);
    return [];
  }
}
