import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Clock, Coins, Lock } from 'lucide-react-native';
import { AnimatedVoiceBlock } from '../../components/AnimatedVoiceBlock';
import { GameButton } from '../../components/GameButton';
import { BackgroundPulse } from '../../components/BackgroundPulse';
import { useAppStore } from '../../store/useAppStore';
import { useContract } from '../../hooks/useContract';
import { useStories } from '../../hooks/useStories';
import { convertBlockchainSubmissions } from '../../utils/blockchainDataConverter';

export default function StoryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { storyChains, user, updateStoryChain } = useAppStore();
  const { fetchStoryFromBlockchain, fetchCurrentRound, refreshStory } =
    useStories();
  const {
    checkVotingActive,
    checkHasVoted,
    fundBountyOnChain,
    sealStoryOnChain,
    isProcessing,
    address,
    fetchStoryRounds,
    fetchRoundSubmissions,
  } = useContract();
  const [playingBlockId, setPlayingBlockId] = useState<string | null>(null);
  const [story, setStory] = useState<any>(null);
  const [currentRound, setCurrentRound] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [votingActive, setVotingActive] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [showBountyModal, setShowBountyModal] = useState(false);
  const [bountyAmount, setBountyAmount] = useState('');
  const [submissions, setSubmissions] = useState<any[]>([]);

  // Try to find story in local store first, then fetch from blockchain
  const localStory = storyChains.find((s) => s.id === id);

  // Fetch story data from blockchain
  useEffect(() => {
    const loadStoryData = async () => {
      console.log('🔍 Loading story data for ID:', id);
      if (!id) return;

      setIsLoading(true);

      try {
        // Use local story if available, otherwise fetch from blockchain
        let storyData;

        if (!storyData) {
          const blockchainStory = await fetchStoryFromBlockchain(
            parseInt(id as string)
          );
          console.log('🔍 Blockchain story:', blockchainStory);
          storyData = blockchainStory || undefined;
        }

        if (storyData) {
          setStory(storyData);
          console.log('🔍 Fetching current roundfor ID:', id);
          const _currentRound = await fetchStoryRounds(Number(id));
          const currentRoundValue = _currentRound.map(
            (round: any) => round.value
          );
          console.log('🔍 Current round:', currentRoundValue);

          // Fetch current round data (use round 1 as default)
          const currentRoundNum =
            currentRoundValue[currentRoundValue.length - 1];

          //Get Submisions  for the current round
          const submissions = await fetchRoundSubmissions(
            Number(id),
            Number(currentRoundNum)
          );
          console.log('🔍 Raw blockchain submissions:', submissions);

          // Convert blockchain submissions to VoiceBlock format with full Supabase URLs
          // This will also fetch actual usernames from the blockchain!
          const convertedSubmissions = await convertBlockchainSubmissions(
            submissions || []
          );
          console.log('✅ Converted submissions:', convertedSubmissions);

          setSubmissions(convertedSubmissions);

          const roundData = await fetchCurrentRound(
            Number(id),
            currentRoundNum
          );

          if (roundData) {
            setCurrentRound(roundData);

            // Check voting status
            const isVotingActive = await checkVotingActive(
              parseInt(id as string),
              currentRoundNum
            );
            setVotingActive(isVotingActive);

            // Check if user has voted
            if (address) {
              const userHasVoted = await checkHasVoted(
                parseInt(id as string),
                currentRoundNum,
                address
              );
              setHasVoted(userHasVoted);
            }
          }
        }
      } catch (error) {
        console.error('Error loading story data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Only run when story ID changes, not on every render

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 justify-center items-center">
          <Text className="text-h2 text-text-primary text-center">
            Loading story...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!story) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Text className="text-h2 text-text-primary text-center mt-xxl">
          Story not found
        </Text>
      </SafeAreaView>
    );
  }

  const progress = (story.blocks.length / story.maxBlocks) * 100;
  const timeProgress = (story.totalDuration / 120) * 100;

  const handlePlayBlock = (blockId: string) => {
    setPlayingBlockId(playingBlockId === blockId ? null : blockId);
  };

  const handleContribute = () => {
    console.log('🔍 Contributing to story:', story.id);
    router.push(`/record/${story.id}`);
  };

  const handleVote = () => {
    router.push(`/voting/${story.id}`);
  };

  const handleFundBounty = async () => {
    if (!bountyAmount || parseFloat(bountyAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid STX amount');
      return;
    }

    try {
      const amountInMicroStx = parseFloat(bountyAmount) * 1000000;

      const txId = await fundBountyOnChain(
        parseInt(id as string),
        amountInMicroStx
      );

      if (!txId) {
        Alert.alert('Failed', 'Could not fund bounty. Please try again.');
        return;
      }

      // Update local story
      updateStoryChain(id as string, {
        bountyStx: (story.bountyStx || 0) + parseFloat(bountyAmount),
      });

      // Refresh from blockchain
      await refreshStory(parseInt(id as string));

      setShowBountyModal(false);
      setBountyAmount('');
      Alert.alert('Success!', `Added ${bountyAmount} STX to bounty pool`);
    } catch (error: any) {
      console.error('Bounty funding error:', error);
      Alert.alert('Error', error.message || 'Failed to fund bounty');
    }
  };

  const handleSealStory = async () => {
    if (!story || !user) return;

    if (story.creatorUsername !== user.username) {
      Alert.alert('Error', 'Only the story creator can seal the story');
      return;
    }

    Alert.alert(
      'Seal Story?',
      'This will finalize the story and distribute rewards to all contributors. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Seal Story',
          style: 'destructive',
          onPress: async () => {
            try {
              const txId = await sealStoryOnChain(parseInt(id as string));

              if (!txId) {
                Alert.alert(
                  'Failed',
                  'Could not seal story. Please try again.'
                );
                return;
              }

              // Update local story
              updateStoryChain(id as string, {
                status: 'sealed',
              });

              // Refresh from blockchain
              await refreshStory(parseInt(id as string));

              Alert.alert(
                'Story Sealed!',
                'Rewards have been distributed to all contributors'
              );
              router.back();
            } catch (error: any) {
              console.error('Story sealing error:', error);
              if (error.message?.includes('ERR-INSUFFICIENT-BLOCKS')) {
                Alert.alert(
                  'Insufficient Blocks',
                  `Story needs at least 5 finalized blocks to be sealed`
                );
              } else {
                Alert.alert(
                  'Error',
                  String(error.message) || 'Failed to seal story'
                );
              }
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <BackgroundPulse />
      {/* Header */}
      <View className="flex-row items-center p-lg border-b border-border relative z-10">
        <TouchableOpacity onPress={() => router.back()} className="mr-md">
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View className="flex-row items-center flex-1">
          <Text className="text-5xl mr-md">{story.coverArt}</Text>
          <View className="flex-1">
            <Text className="text-h2 text-text-primary">{story.title}</Text>
            <Text className="text-caption text-text-secondary">
              {story.category}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Story Description */}
        {story.description && (
          <View className="px-lg pt-lg pb-md">
            <Text className="text-body text-text-primary font-semibold mb-sm">
              About This Story
            </Text>
            <Text className="text-body text-text-secondary leading-6">
              {story.description}
            </Text>
          </View>
        )}

        {/* Story Info Cards */}
        <View className="px-lg pb-md">
          <View className="flex-row gap-md flex-wrap">
            {/* Bounty Card */}
            {Number(story.bountyStx) > 0 && (
              <View className="flex-1 min-w-[45%] bg-secondary/20 rounded-lg p-md border border-secondary/30">
                <View className="flex-row items-center mb-xs">
                  <Coins size={20} color="#FF6B9D" />
                  <Text className="text-body text-secondary font-bold ml-sm">
                    Bounty Pool
                  </Text>
                </View>
                <Text className="text-h2 text-text-primary">
                  {String(story.bountyStx)} STX
                </Text>
                <Text className="text-caption text-text-secondary mt-xs">
                  Split among contributors
                </Text>
              </View>
            )}

            {/* Voting Window Card */}
            {story.votingWindowHours && (
              <View className="flex-1 min-w-[45%] bg-primary/20 rounded-lg p-md border border-primary/30">
                <View className="flex-row items-center mb-xs">
                  <Clock size={20} color="#FF2E63" />
                  <Text className="text-body text-primary font-bold ml-sm">
                    Voting Window
                  </Text>
                </View>
                <Text className="text-h2 text-text-primary">
                  {story.votingWindowHours}h
                </Text>
                <Text className="text-caption text-text-secondary mt-xs">
                  Per voice block
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Progress Section */}
        <View className="px-lg pb-md">
          <View className="flex-row justify-between items-center mb-sm">
            <Text className="text-body text-text-primary font-semibold">
              Chain Progress
            </Text>
            <Text className="text-body text-primary font-bold">
              {story.blocks.length}/{story.maxBlocks} blocks
            </Text>
          </View>
          <View className="h-3 bg-border rounded-full overflow-hidden mb-xs">
            <View
              className="h-full bg-primary rounded-full"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </View>
          <View className="flex-row justify-between">
            <Text className="text-caption text-text-secondary">
              {story.totalDuration}s of 120s total
            </Text>
            <Text className="text-caption text-primary font-semibold">
              {Math.round(progress)}%
            </Text>
          </View>
        </View>

        {/* Voice Blocks Section */}
        <View className="px-lg pb-lg">
          <Text className="text-h3 text-text-primary mb-md">
            Voice Blocks ({story.blocks.length})
          </Text>
          {submissions.length === 0 ? (
            <View className="bg-card rounded-lg p-xl items-center border border-border">
              <Text className="text-5xl mb-md">🎤</Text>
              <Text className="text-body text-text-primary font-semibold mb-xs">
                No voice blocks yet
              </Text>
              <Text className="text-caption text-text-secondary text-center">
                Be the first to contribute to this story!
              </Text>
            </View>
          ) : (
            submissions.map((block: any, index: number) => (
              <AnimatedVoiceBlock
                key={block.id}
                block={block}
                isPlaying={playingBlockId === block.id}
                onPlayPress={() => handlePlayBlock(block.id)}
                index={index}
              />
            ))
          )}
        </View>

        {/* Call to Action */}
        {story.status === 'active' && story.blocks.length > 0 && (
          <View className="px-lg pb-lg">
            <TouchableOpacity
              className="bg-accent/20 rounded-lg p-md border border-accent/30"
              onPress={handleVote}
            >
              <Text className="text-body text-accent font-bold mb-xs">
                🗳️ Vote on Next Block
              </Text>
              <Text className="text-caption text-text-secondary">
                Help decide which voice continues the story
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {story.status === 'active' && (
        <View className="p-lg border-t border-border relative z-10 gap-md">
          {votingActive && !hasVoted && (
            <GameButton
              title="🗳️ Vote on Submissions"
              onPress={handleVote}
              size="large"
              variant="secondary"
              className="w-full"
            />
          )}

          {votingActive && hasVoted && (
            <View className="bg-secondary/20 p-md rounded-lg">
              <Text className="text-body text-text-primary text-center">
                ✅ You've already voted in this round
              </Text>
            </View>
          )}

          <View className="flex-row gap-md">
            <GameButton
              title="💰 Fund Bounty"
              onPress={() => setShowBountyModal(true)}
              size="medium"
              variant="outline"
              className="flex-1"
            />
            {user?.username === story.creatorUsername && (
              <GameButton
                title="🔒 Seal Story"
                onPress={handleSealStory}
                size="medium"
                variant="outline"
                className="flex-1"
                disabled={isProcessing}
              />
            )}
          </View>

          <GameButton
            title="🎤 Contribute to Story"
            onPress={handleContribute}
            size="large"
            variant="accent"
            className="w-full"
          />
        </View>
      )}

      {/* Bounty Modal */}
      <Modal
        visible={showBountyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBountyModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/80 px-lg">
          <View className="bg-card rounded-2xl p-xl w-full max-w-md border-2 border-accent">
            <Text className="text-h2 text-text-primary mb-md text-center">
              💰 Fund Bounty
            </Text>

            <Text className="text-body text-text-secondary mb-lg text-center">
              Add STX to the bounty pool to reward contributors
            </Text>

            {story.bountyStx && story.bountyStx > 0 && (
              <View className="bg-secondary/20 p-md rounded-lg mb-lg">
                <Text className="text-caption text-text-secondary text-center">
                  Current Bounty Pool
                </Text>
                <Text className="text-h3 text-accent text-center">
                  {story.bountyStx} STX
                </Text>
              </View>
            )}

            <View className="mb-lg">
              <Text className="text-body text-text-primary font-semibold mb-sm">
                Amount (STX)
              </Text>
              <TextInput
                className="bg-background rounded-md px-md py-md text-text-primary text-base border border-border"
                placeholder="Enter amount..."
                placeholderTextColor="#D4A5B8"
                value={bountyAmount}
                onChangeText={setBountyAmount}
                keyboardType="decimal-pad"
              />
            </View>

            <View className="flex-row gap-md">
              <GameButton
                title="Cancel"
                onPress={() => {
                  setShowBountyModal(false);
                  setBountyAmount('');
                }}
                variant="outline"
                size="medium"
                className="flex-1"
              />
              <GameButton
                title={isProcessing ? 'Processing...' : 'Fund Bounty'}
                onPress={handleFundBounty}
                disabled={!bountyAmount || isProcessing}
                loading={isProcessing}
                variant="accent"
                size="medium"
                className="flex-1"
              />
            </View>
          </View>
        </View>
      </Modal>
      {story.status === 'sealed' && (
        <View className="p-lg border-t border-border relative z-10">
          <View className="bg-secondary/20 p-md rounded-lg">
            <Text className="text-body text-text-primary text-center">
              🔒 This story has been sealed and finalized
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
