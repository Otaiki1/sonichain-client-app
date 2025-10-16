import { STACKS_TESTNET, STACKS_MAINNET } from '@stacks/network';

/**
 * Contract Configuration
 * Update these values with your deployed contract details
 */
export const CONTRACT_CONFIG = {
  // 🚀 PRODUCTION MODE - Blockchain enabled
  // All data comes from blockchain, no mock/stale data
  BLOCKCHAIN_ENABLED: true, // ✅ PRODUCTION: Blockchain enabled
  // Contract address (CRITICAL: Update with your deployed contract address!)
  // This must match your deployed Sonichain contract on Stacks testnet/mainnet
  CONTRACT_ADDRESS: 'ST1ZZC9D5Q6Q8HZXYA98V9KJB385HYPSB80G2R0Q3',

  // Contract name (must match deployed contract)
  CONTRACT_NAME: 'Sonichain',

  // Network configuration (switch to STACKS_MAINNET for production)
  NETWORK: STACKS_TESTNET,

  // Default transaction options
  DEFAULT_FEE: 300, // in microSTX

  // Post condition mode
  POST_CONDITION_MODE: 'allow' as const, // 'allow' | 'deny'

  // Contract constants (from Clarity contract)
  VOTING_PERIOD: 144, // blocks (~24 hours)
  MIN_BLOCKS_TO_SEAL: 5,
  MAX_BLOCKS_PER_STORY: 50,
  MAX_ROUNDS_PER_STORY: 10, // maximum rounds per story
  MAX_SUBMISSIONS_PER_ROUND: 10, // maximum submissions per round
  PLATFORM_FEE_BPS: 250, // 2.5% platform fee

  // NFT Contract Configuration
  NFT_CONTRACT_ADDRESS: 'ST1ZZC9D5Q6Q8HZXYA98V9KJB385HYPSB80G2R0Q3',
  NFT_CONTRACT_NAME: 'Soni_NFT',
  NFT_TRAIT_CONTRACT:
    'ST1ZZC9D5Q6Q8HZXYA98V9KJB385HYPSB80G2R0Q3.Soni_NFT_Trait',
};

/**
 * Error Code Mappings (from Clarity contract)
 */
export const CONTRACT_ERRORS = {
  ERR_NOT_FOUND: 'u100', // requested entity does not exist
  ERR_UNAUTHORIZED: 'u101', // caller is not allowed to perform the operation
  ERR_STORY_SEALED: 'u102', // story is sealed or action would seal-bypass
  ERR_ALREADY_VOTED: 'u103', // voter already voted in the given round
  ERR_NO_SUBMISSIONS: 'u104', // no submissions available to select a winner
  ERR_INSUFFICIENT_BLOCKS: 'u105', // not enough finalized blocks to seal
  ERR_INVALID_AMOUNT: 'u106', // invalid amount (e.g., zero) for bounty funding
  ERR_TRANSFER_FAILED: 'u107', // token/STX transfer failure
  ERR_VOTING_CLOSED: 'u108', // voting window has closed or not active
  ERR_ALREADY_FINALIZED: 'u109', // round already finalized
  ERR_VOTING_NOT_ENDED: 'u110', // cannot finalize before round end
  ERR_ALREADY_SUBMITTED: 'u111', // user already submitted in this round
  ERR_USERNAME_EXISTS: 'u112', // username already taken
  ERR_USER_ALREADY_REGISTERED: 'u113', // user already registered
  ERR_ROUND_FULL: 'u114', // submissions reached cap for the round
} as const;

/**
 * Contract Function Names
 */
export const CONTRACT_FUNCTIONS = {
  // Read-only functions
  GET_STORY: 'get-story',
  GET_ROUND: 'get-round',
  GET_SUBMISSION: 'get-submission',
  GET_STORY_CHAIN_BLOCK: 'get-story-chain-block',
  HAS_VOTED: 'has-voted',
  GET_USER_VOTE: 'get-user-vote',
  GET_CONTRIBUTOR_STATS: 'get-contributor-stats',
  GET_ROUND_SUBMISSION_COUNT: 'get-round-submission-count',
  GET_ROUND_SUBMISSION_AT: 'get-round-submission-at',
  IS_VOTING_ACTIVE_AT: 'is-voting-active-at',
  CAN_FINALIZE_ROUND_AT: 'can-finalize-round-at',
  GET_USER: 'get-user',
  GET_WINNING_SUBMISSION: 'get-winning-submission',
  LIST_ROUNDS: 'list-rounds',
  LIST_ROUND_SUBMISSIONS: 'list-round-submissions',

  // Counter functions (NEW - PRODUCTION)
  GET_STORY_COUNTER: 'get-story-counter',
  GET_SUBMISSION_COUNTER: 'get-submission-counter',
  GET_ROUND_COUNTER: 'get-round-counter',

  // Public functions
  REGISTER_USER: 'register-user',
  CREATE_STORY: 'create-story',
  SUBMIT_BLOCK: 'submit-block',
  VOTE_BLOCK: 'vote-block',
  FINALIZE_ROUND: 'finalize-round',
  FUND_BOUNTY: 'fund-bounty',
  SEAL_STORY: 'seal-story',
} as const;

/**
 * App Details for Stacks Connect
 */
export const APP_DETAILS = {
  name: 'SoniChain',
  icon: 'https://your-domain.com/logo.png', // TODO: Update with your hosted logo URL
};
