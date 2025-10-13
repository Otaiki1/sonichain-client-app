import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Transaction tracking for better UX
 * Tracks pending, confirmed, and failed transactions
 */

export interface Transaction {
  id: string; // Transaction ID
  type:
    | 'user-registration'
    | 'story-creation'
    | 'audio-submission'
    | 'vote'
    | 'finalize-round'
    | 'fund-bounty'
    | 'seal-story';
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  details?: any;
  error?: string;
}

const STORAGE_KEY = '@sonichain_transactions';

export function useTransactionTracking() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Load transactions from storage
   */
  const loadTransactions = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setTransactions(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  }, []);

  /**
   * Save transactions to storage
   */
  const saveTransactions = useCallback(async (txs: Transaction[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(txs));
      setTransactions(txs);
    } catch (error) {
      console.error('Error saving transactions:', error);
    }
  }, []);

  /**
   * Add new transaction
   */
  const addTransaction = useCallback(
    async (tx: Omit<Transaction, 'timestamp' | 'status'>) => {
      const newTx: Transaction = {
        ...tx,
        status: 'pending',
        timestamp: Date.now(),
      };

      const updatedTxs = [newTx, ...transactions];
      await saveTransactions(updatedTxs);
      return newTx.id;
    },
    [transactions, saveTransactions]
  );

  /**
   * Update transaction status
   */
  const updateTransactionStatus = useCallback(
    async (txId: string, status: 'confirmed' | 'failed', error?: string) => {
      const updatedTxs = transactions.map((tx) =>
        tx.id === txId ? { ...tx, status, error } : tx
      );
      await saveTransactions(updatedTxs);
    },
    [transactions, saveTransactions]
  );

  /**
   * Get pending transactions
   */
  const getPendingTransactions = useCallback(() => {
    return transactions.filter((tx) => tx.status === 'pending');
  }, [transactions]);

  /**
   * Get transactions by type
   */
  const getTransactionsByType = useCallback(
    (type: Transaction['type']) => {
      return transactions.filter((tx) => tx.type === type);
    },
    [transactions]
  );

  /**
   * Clear old transactions
   */
  const clearOldTransactions = useCallback(
    async (olderThanDays: number = 7) => {
      const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
      const recentTxs = transactions.filter((tx) => tx.timestamp > cutoffTime);
      await saveTransactions(recentTxs);
    },
    [transactions, saveTransactions]
  );

  return {
    transactions,
    isLoading,
    addTransaction,
    updateTransactionStatus,
    getPendingTransactions,
    getTransactionsByType,
    clearOldTransactions,
    loadTransactions,
  };
}
