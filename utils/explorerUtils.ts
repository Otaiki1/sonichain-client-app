import { Linking } from 'react-native';
import { CONTRACT_CONFIG } from '@/lib/contract-config';
import { STACKS_TESTNET, STACKS_MAINNET } from '@stacks/network';

/**
 * Get the Hiro Stacks Explorer URL for a transaction
 * @param txId - Transaction ID (with or without 0x prefix)
 * @returns Full explorer URL
 */
export function getExplorerTxUrl(txId: string): string {
  // Ensure txId has 0x prefix
  const formattedTxId = txId.startsWith('0x') ? txId : `0x${txId}`;

  // Determine chain based on network config
  const chain =
    CONTRACT_CONFIG.NETWORK === STACKS_MAINNET ? 'mainnet' : 'testnet';

  return `https://explorer.hiro.so/txid/${formattedTxId}?chain=${chain}`;
}

/**
 * Open transaction in Hiro Stacks Explorer
 * @param txId - Transaction ID
 */
export async function openTransactionInExplorer(txId: string): Promise<void> {
  const url = getExplorerTxUrl(txId);

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      console.error('Cannot open URL:', url);
    }
  } catch (error) {
    console.error('Error opening explorer:', error);
  }
}

/**
 * Format transaction ID for display (shortened)
 * @param txId - Transaction ID
 * @returns Shortened format (e.g., "0xdfc0a9...ff30f9")
 */
export function formatTxId(txId: string): string {
  if (!txId) return '';

  // Ensure it has 0x prefix
  const formatted = txId.startsWith('0x') ? txId : `0x${txId}`;

  // Show first 8 chars and last 6 chars
  if (formatted.length > 14) {
    return `${formatted.substring(0, 8)}...${formatted.substring(
      formatted.length - 6
    )}`;
  }

  return formatted;
}
