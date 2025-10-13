/**
 * Validation utilities for contract integration
 * Ensures all features work correctly with blockchain
 */

import { CONTRACT_CONFIG } from '@/lib/contract-config';

/**
 * Validate contract configuration
 */
export function validateContractConfig(): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!CONTRACT_CONFIG.CONTRACT_ADDRESS) {
    errors.push('CONTRACT_ADDRESS is not set');
  }

  if (!CONTRACT_CONFIG.CONTRACT_NAME) {
    errors.push('CONTRACT_NAME is not set');
  }

  if (!CONTRACT_CONFIG.NETWORK) {
    errors.push('NETWORK is not configured');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate wallet setup
 */
export function validateWallet(
  address?: string,
  privateKey?: string
): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!address) {
    errors.push('Wallet address is missing');
  }

  if (!privateKey) {
    errors.push('Private key is missing');
  }

  if (address && !address.startsWith('ST') && !address.startsWith('SP')) {
    errors.push('Invalid Stacks address format');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate story data before submission
 */
export function validateStoryData(data: {
  title?: string;
  prompt?: string;
  maxBlocks?: number;
}): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.title || data.title.trim().length === 0) {
    errors.push('Story title is required');
  }

  if (data.title && data.title.length > 200) {
    errors.push('Story title must be less than 200 characters');
  }

  if (data.prompt && data.prompt.length > 500) {
    errors.push('Story prompt must be less than 500 characters');
  }

  if (data.maxBlocks && (data.maxBlocks < 1 || data.maxBlocks > 50)) {
    errors.push('Max blocks must be between 1 and 50');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate audio submission data
 */
export function validateAudioSubmission(data: {
  audioUri?: string;
  duration?: number;
  storyId?: string;
}): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.audioUri) {
    errors.push('Audio URI is required');
  }

  if (!data.duration || data.duration <= 0) {
    errors.push('Valid audio duration is required');
  }

  if (!data.storyId) {
    errors.push('Story ID is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate bounty amount
 */
export function validateBountyAmount(amount: string | number): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    errors.push('Invalid amount format');
  }

  if (numAmount <= 0) {
    errors.push('Amount must be greater than zero');
  }

  if (numAmount > 1000000) {
    errors.push('Amount exceeds maximum limit');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if all integrations are ready
 */
export function checkIntegrationStatus(): {
  isReady: boolean;
  status: {
    contract: boolean;
    ipfs: boolean;
    wallet: boolean;
  };
  messages: string[];
} {
  const messages: string[] = [];
  const status = {
    contract: false,
    ipfs: false,
    wallet: false,
  };

  // Check contract configuration
  const contractValidation = validateContractConfig();
  status.contract = contractValidation.isValid;
  if (!status.contract) {
    messages.push('Contract configuration incomplete');
    messages.push(...contractValidation.errors);
  }

  // Check IPFS configuration
  const ipfsJWT = process.env.EXPO_PUBLIC_PINATA_JWT;
  const ipfsGateway = process.env.EXPO_PUBLIC_PINATA_GATEWAY;
  status.ipfs = !!(ipfsJWT && ipfsGateway);
  if (!status.ipfs) {
    messages.push('IPFS/Pinata configuration incomplete');
  }

  // Wallet check would happen at runtime
  status.wallet = true; // Assume wallet is ready if user is logged in

  return {
    isReady: status.contract && status.ipfs,
    status,
    messages,
  };
}
