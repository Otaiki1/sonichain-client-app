import { CONTRACT_CONFIG } from './contract-config';

/**
 * Get STX balance for an address
 * @param address - Stacks address to check
 * @returns Balance in microSTX
 */
/**
 * Get API URL from network
 * Returns testnet or mainnet API URL based on CONTRACT_CONFIG.NETWORK
 */
function getApiUrl(): string {
  const network = CONTRACT_CONFIG.NETWORK;
  // @ts-ignore - coreApiUrl exists but TypeScript definition may be outdated
  const apiUrl = network.coreApiUrl || 'https://api.testnet.hiro.so';

  console.log('🌐 Using Stacks API:', apiUrl);
  return apiUrl;
}

/**
 * Get STX balance for an address
 * @param address - Stacks address to check
 * @returns Balance in microSTX
 */
export async function getStxBalance(address: string): Promise<number> {
  try {
    const apiUrl = getApiUrl();

    console.log(`💰 Fetching balance for ${address} from ${apiUrl}`);

    const response = await fetch(
      `${apiUrl}/extended/v1/address/${address}/balances`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch balance: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const balance = parseInt(data.stx.balance);

    console.log(
      `✅ Balance fetched: ${balance} microSTX (${balance / 1_000_000} STX)`
    );

    return balance;
  } catch (error) {
    console.error('Error fetching STX balance:', error);
    return 0;
  }
}

/**
 * Get transaction status
 * @param txId - Transaction ID
 * @returns Transaction details
 */
export async function getTransactionStatus(txId: string) {
  try {
    const apiUrl = getApiUrl();

    const response = await fetch(`${apiUrl}/extended/v1/tx/${txId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch transaction');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return null;
  }
}

/**
 * Convert STX to microSTX
 * @param stx - Amount in STX
 * @returns Amount in microSTX
 */
export function stxToMicroStx(stx: number): number {
  return Math.floor(stx * 1_000_000);
}

/**
 * Convert microSTX to STX
 * @param microStx - Amount in microSTX
 * @returns Amount in STX
 */
export function microStxToStx(microStx: number): number {
  return microStx / 1_000_000;
}

/**
 * Format STX amount for display
 * @param microStx - Amount in microSTX
 * @returns Formatted string (e.g., "1.5 STX")
 */
export function formatStxAmount(microStx: number): string {
  const stx = microStxToStx(microStx);
  return `${stx.toFixed(2)} STX`;
}

/**
 * Get account transactions
 * @param address - Stacks address
 * @param limit - Number of transactions to fetch
 * @returns List of transactions
 */
export async function getAccountTransactions(
  address: string,
  limit: number = 50
) {
  try {
    const apiUrl = getApiUrl();

    const response = await fetch(
      `${apiUrl}/extended/v1/address/${address}/transactions?limit=${limit}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }

    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

/**
 * Get account nonce (for transaction sequencing)
 * @param address - Stacks address
 * @returns Current nonce
 */
export async function getAccountNonce(address: string): Promise<number> {
  try {
    const apiUrl = getApiUrl();

    const response = await fetch(
      `${apiUrl}/extended/v1/address/${address}/nonces`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch nonce');
    }

    const data = await response.json();
    return data.possible_next_nonce;
  } catch (error) {
    console.error('Error fetching nonce:', error);
    return 0;
  }
}
