/**
 * EXAMPLE: How to integrate contract calls into your screens
 * This shows how to use the useContract hook in the Activity screen
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import { useContract } from '@/hooks/useContract';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/Button';
import { stxToMicroStx, microStxToStx, getStxBalance } from '@/lib/stx-utils';
import * as ContractUtils from '@/lib/contract-utils';

export function ExampleActivityIntegration() {
  const { user, storyChains, updateStoryChain, updateUser } = useAppStore();
  const { isConnected, address, isProcessing, sealStoryOnChain, sendSTX } =
    useContract();

  const handleFinalizeStory = async (storyId: string) => {
    const story = storyChains.find((s) => s.id === storyId);
    if (!story || !user) return;

    if (!isConnected) {
      Alert.alert('Wallet Required', 'Please connect your wallet to finalize');
      return;
    }

    try {
      // Call seal-story contract function
      // This will distribute bounty and mark as sealed
      const txId = await sealStoryOnChain(parseInt(storyId));

      if (!txId) {
        return; // Error already shown by useContract
      }

      // Update local state
      updateStoryChain(storyId, {
        status: 'finalized',
        nftMinted: true,
      });

      const contributors = Array.from(
        new Set(story.blocks.map((b) => b.username))
      );

      Alert.alert(
        'Success! 🎉',
        `Story sealed!\nBounty distributed: ${
          story.bountyStx || 0
        } STX\nContributors rewarded: ${contributors.length}`
      );
    } catch (error: any) {
      console.error('Finalization error:', error);
      Alert.alert('Error', 'Failed to finalize story');
    }
  };

  return (
    <View className="p-lg">
      <Button
        title={isProcessing ? 'Processing...' : 'Finalize on Blockchain'}
        onPress={() => handleFinalizeStory('story-id')}
        disabled={!isConnected || isProcessing}
        loading={isProcessing}
      />
    </View>
  );
}

// ===========================================
// EXAMPLE 2: Creating Story on Blockchain
// ===========================================

export function ExampleCreateStory() {
  const { addStoryChain } = useAppStore();
  const { isConnected, createStoryOnChain } = useContract();

  const handleCreate = async () => {
    if (!isConnected) {
      Alert.alert('Wallet Required', 'Connect wallet to create stories');
      return;
    }

    // Call smart contract (create-story only takes prompt in the contract)
    const prompt = 'The Midnight Detective: A noir mystery begins...';
    const txId = await createStoryOnChain(prompt);

    if (txId) {
      // Add to local state
      addStoryChain({
        id: txId, // Use transaction ID as story ID
        title: 'The Midnight Detective',
        description: 'A noir mystery unfolds...',
        coverArt: '🕵️',
        category: 'Mystery',
        maxBlocks: 10,
        bountyStx: 5,
        votingWindowHours: 24,
        blocks: [],
        status: 'active',
        totalDuration: 0,
        creatorUsername: 'current-user',
      });

      Alert.alert('Success!', 'Story created on blockchain');
    }
  };

  return <Button title="Create Story" onPress={handleCreate} />;
}

// ===========================================
// EXAMPLE 3: Check Balance Before Action
// ===========================================

export function ExampleBalanceCheck() {
  const { address } = useContract();
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (address) {
      getStxBalance(address).then((bal) => {
        setBalance(microStxToStx(bal));
      });
    }
  }, [address]);

  return <Text>Your balance: {balance.toFixed(2)} STX</Text>;
}

// ===========================================
// EXAMPLE 4: Generic Contract Call
// ===========================================

export function ExampleGenericCall() {
  const { callContract } = useContract();
  const { clarityHelpers } = ContractUtils;

  const handleCustomCall = async () => {
    const txId = await callContract(
      'your-function-name',
      [
        clarityHelpers.uint(123),
        clarityHelpers.stringUtf8('hello'),
        clarityHelpers.principal('SP1234...'),
      ],
      (txId) => {
        console.log('Transaction successful:', txId);
        // Your custom success logic here
      }
    );
  };

  return <Button title="Custom Call" onPress={handleCustomCall} />;
}
