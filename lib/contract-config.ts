import { STACKS_TESTNET, STACKS_MAINNET } from '@stacks/network';

/**
 * Contract Configuration
 * Update these values with your deployed contract details
 */
export const CONTRACT_CONFIG = {
  // TODO: Update with your contract address after deployment
  CONTRACT_ADDRESS: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',

  // TODO: Update with your contract name
  CONTRACT_NAME: 'sonichain-story',

  // Network configuration (switch to STACKS_MAINNET for production)
  NETWORK: STACKS_TESTNET,

  // Default transaction options
  DEFAULT_FEE: 300, // in microSTX

  // Post condition mode
  POST_CONDITION_MODE: 'allow' as const, // 'allow' | 'deny'
};

/**
 * App Details for Stacks Connect
 */
export const APP_DETAILS = {
  name: 'SoniChain',
  icon: 'https://your-domain.com/logo.png', // TODO: Update with your hosted logo URL
};
