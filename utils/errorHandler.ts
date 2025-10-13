import { Alert } from 'react-native';

/**
 * Enhanced error handling for blockchain interactions
 * Provides user-friendly messages and retry logic
 */

export interface ErrorHandlerOptions {
  title?: string;
  showAlert?: boolean;
  retry?: () => Promise<void>;
  maxRetries?: number;
}

/**
 * Contract error messages mapping
 */
const CONTRACT_ERRORS: Record<string, { title: string; message: string }> = {
  'ERR-NOT-FOUND': {
    title: 'Not Found',
    message: 'The requested resource was not found on the blockchain.',
  },
  'ERR-UNAUTHORIZED': {
    title: 'Unauthorized',
    message: 'You do not have permission to perform this action.',
  },
  'ERR-STORY-SEALED': {
    title: 'Story Sealed',
    message: 'This story has been sealed and can no longer be modified.',
  },
  'ERR-ALREADY-VOTED': {
    title: 'Already Voted',
    message: 'You have already voted in this round.',
  },
  'ERR-NO-SUBMISSIONS': {
    title: 'No Submissions',
    message: 'There are no submissions available for this round.',
  },
  'ERR-INSUFFICIENT-BLOCKS': {
    title: 'Insufficient Blocks',
    message: 'The story needs at least 5 finalized blocks to be sealed.',
  },
  'ERR-INVALID-AMOUNT': {
    title: 'Invalid Amount',
    message: 'Please enter a valid amount greater than zero.',
  },
  'ERR-TRANSFER-FAILED': {
    title: 'Transfer Failed',
    message: 'The STX transfer could not be completed.',
  },
  'ERR-VOTING-CLOSED': {
    title: 'Voting Closed',
    message: 'The voting window for this round has closed.',
  },
  'ERR-ALREADY-FINALIZED': {
    title: 'Already Finalized',
    message: 'This round has already been finalized.',
  },
  'ERR-VOTING-NOT-ENDED': {
    title: 'Voting Not Ended',
    message: 'Cannot finalize the round before the voting period ends.',
  },
  'ERR-ALREADY-SUBMITTED': {
    title: 'Already Submitted',
    message: 'You have already submitted a recording for this round.',
  },
  'ERR-USERNAME-EXISTS': {
    title: 'Username Taken',
    message: 'This username is already registered. Please choose another.',
  },
  'ERR-USER-ALREADY-REGISTERED': {
    title: 'Already Registered',
    message: 'This wallet address is already registered.',
  },
};

/**
 * Network error messages
 */
const NETWORK_ERRORS: Record<string, string> = {
  'Network request failed':
    'Could not connect to the network. Please check your internet connection.',
  ETIMEDOUT: 'The request timed out. Please try again.',
  ECONNREFUSED: 'Could not connect to the blockchain. Please try again later.',
  ENOTFOUND:
    'Could not reach the blockchain network. Please check your connection.',
};

/**
 * Parse error message and extract contract error code
 */
function parseContractError(error: Error): string | null {
  const message = error.message || '';

  // Check for contract error codes
  for (const errorCode of Object.keys(CONTRACT_ERRORS)) {
    if (message.includes(errorCode)) {
      return errorCode;
    }
  }

  return null;
}

/**
 * Parse network error
 */
function parseNetworkError(error: Error): string | null {
  const message = error.message || '';

  for (const [errorType, userMessage] of Object.entries(NETWORK_ERRORS)) {
    if (message.includes(errorType)) {
      return userMessage;
    }
  }

  return null;
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyError(error: Error): {
  title: string;
  message: string;
} {
  // Check for contract errors
  const contractError = parseContractError(error);
  if (contractError && CONTRACT_ERRORS[contractError]) {
    return CONTRACT_ERRORS[contractError];
  }

  // Check for network errors
  const networkError = parseNetworkError(error);
  if (networkError) {
    return {
      title: 'Network Error',
      message: networkError,
    };
  }

  // Default error message
  return {
    title: 'Error',
    message: error.message || 'An unexpected error occurred. Please try again.',
  };
}

/**
 * Handle error with optional retry logic
 */
export async function handleError(
  error: Error,
  options: ErrorHandlerOptions = {}
): Promise<void> {
  const {
    title: customTitle,
    showAlert = true,
    retry,
    maxRetries = 3,
  } = options;

  console.error('🚨 Error:', error);

  const { title, message } = getUserFriendlyError(error);

  if (showAlert) {
    if (retry) {
      // Show alert with retry option
      Alert.alert(customTitle || title, message, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Retry',
          onPress: async () => {
            try {
              await retry();
            } catch (retryError: any) {
              // Handle retry error
              await handleError(retryError, {
                ...options,
                maxRetries: maxRetries - 1,
                retry: maxRetries > 1 ? retry : undefined,
              });
            }
          },
        },
      ]);
    } else {
      // Show simple alert
      Alert.alert(customTitle || title, message);
    }
  }
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: ErrorHandlerOptions = {}
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error: any) {
      await handleError(error, options);
      throw error;
    }
  }) as T;
}

/**
 * Retry logic with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      console.log(
        `Retry attempt ${i + 1}/${maxRetries} failed:`,
        error.message
      );

      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}
