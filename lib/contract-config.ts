import { STACKS_TESTNET, STACKS_MAINNET } from '@stacks/network';

/**
 * Contract Configuration
 * Update these values with your deployed contract details
 */
export const CONTRACT_CONFIG = {
  // Contract address (deployed testnet address)
  CONTRACT_ADDRESS: 'ST1VQMZKSFRW25H34XQS2KVDQ3FQEBFPWC2XM0ZYC',

  // Contract name
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
  PLATFORM_FEE_BPS: 250, // 2.5% platform fee
};

/**
 * App Details for Stacks Connect
 */
export const APP_DETAILS = {
  name: 'SoniChain',
  icon: 'https://your-domain.com/logo.png', // TODO: Update with your hosted logo URL
};
