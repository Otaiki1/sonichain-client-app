import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView as RNSafeArea,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Clock, Coins } from 'lucide-react-native';
import { AnimatedVoiceBlock } from '../../components/AnimatedVoiceBlock';
import { GameButton } from '../../components/GameButton';
import { BackgroundPulse } from '../../components/BackgroundPulse';
import { useAppStore } from '../../store/useAppStore';
import { useContract } from '../../hooks/useContract';
import { useStories } from '../../hooks/useStories';
import { convertBlockchainSubmissions } from '../../utils/blockchainDataConverter';
import {
  useRoundTimer,
  extractRoundTimingData,
} from '../../hooks/useRoundTimer';

export default function StoryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { storyChains, user, updateStoryChain } = useAppStore();
  const { fetchStoryFromBlockchain, fetchCurrentRound, refreshStory } =
    useStories();
  const {
    checkVotingActive,
    checkHasVoted,
    checkCanFinalize,
    fundBountyOnChain,
    finalizeRoundOnChain,
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
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [bountyAmount, setBountyAmount] = useState('');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [roundTimingData, setRoundTimingData] = useState<any>(null);
  const [canFinalize, setCanFinalize] = useState(false);
  const [currentRoundNum, setCurrentRoundNum] = useState(1);

  // Real-time countdown timer from blockchain data
  const roundTimer = useRoundTimer(roundTimingData || {});

  // Check if current user is the story creator
  const isCreator =
    story && address && (story.creator?.value || story.creator) === address;

  // Try to find story in local store first
  const localStory = storyChains.find((s) => s.id === id);

  useEffect(() => {
    const loadStoryData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        // Always fetch fresh story data from blockchain for accurate timing
        // Local story might have stale current-round and total-blocks data
        console.log('🔄 Fetching fresh story data from blockchain...');
        const blockchainStory = await fetchStoryFromBlockchain(Number(id));
        const storyData = blockchainStory || localStory || undefined;

        if (storyData) {
          setStory(storyData);

          // Fetch rounds
          const _currentRound = await fetchStoryRounds(Number(id));
          const currentRoundValue = _currentRound.map((r: any) => r.value);
          const roundNum = currentRoundValue[currentRoundValue.length - 1] ?? 1;
          setCurrentRoundNum(Number(roundNum));

          // Get submissions for current round
          const rawSubs = await fetchRoundSubmissions(
            Number(id),
            Number(roundNum)
          );
          const convertedSubmissions = await convertBlockchainSubmissions(
            rawSubs || []
          );
          setSubmissions(convertedSubmissions);

          const roundData = await fetchCurrentRound(
            Number(id),
            Number(roundNum)
          );
          if (roundData) {
            setCurrentRound(roundData);
            // Pass the actual round number (roundNum) as third parameter
            const timingData = extractRoundTimingData(
              roundData.round,
              storyData,
              Number(roundNum)
            );
            setRoundTimingData(timingData);

            const isVotingActive = await checkVotingActive(
              Number(id),
              Number(roundNum)
            );
            setVotingActive(isVotingActive);

            const canFinalizeRound = await checkCanFinalize(
              Number(id),
              Number(roundNum)
            );
            setCanFinalize(canFinalizeRound);

            if (address) {
              const userHasVoted = await checkHasVoted(
                Number(id),
                Number(roundNum),
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
  }, [id]);

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

  const progress = ((story.blocks?.length || 0) / (story.maxBlocks || 1)) * 100;

  const handlePlayBlock = (blockId: string) => {
    setPlayingBlockId(playingBlockId === blockId ? null : blockId);
  };

  const handleContribute = () => {
    router.push(`/record/${story.id}`);
  };

  const handleVote = () => {
    router.push(`/voting/${story.id}`);
  };

  const handleFinalizeRound = async () => {
    if (!isCreator) {
      Alert.alert('Unauthorized', 'Only the story creator can finalize rounds');
      return;
    }

    if (!canFinalize) {
      Alert.alert(
        'Cannot Finalize',
        'Voting period must end before finalizing. Check the countdown timer.'
      );
      return;
    }

    Alert.alert(
      'Finalize Round',
      `This will select the winning submission for Round ${currentRoundNum} and start the next round. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finalize',
          onPress: async () => {
            try {
              const txId = await finalizeRoundOnChain(
                Number(id),
                currentRoundNum
              );
              if (!txId) {
                Alert.alert(
                  'Failed',
                  'Could not finalize round. Please try again.'
                );
                return;
              }
              Alert.alert('Success!', `Round ${currentRoundNum} finalized!`);
              await refreshStory(Number(id));
            } catch (error: any) {
              console.error('Error finalizing round:', error);
              Alert.alert('Error', error.message || 'Failed to finalize round');
            }
          },
        },
      ]
    );
  };

  const handleSealStory = async () => {
    if (!isCreator) {
      Alert.alert('Unauthorized', 'Only the story creator can seal the story');
      return;
    }

    const totalBlocks = story.blocks?.length || roundTimer.totalBlocks || 0;
    if (totalBlocks < 5) {
      Alert.alert(
        'Cannot Seal',
        `Story needs at least 5 finalized blocks to seal. Currently has ${totalBlocks}.`
      );
      return;
    }

    Alert.alert(
      'Seal Story',
      `This will permanently seal "${story.title}" and distribute rewards. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Seal Story',
          style: 'destructive',
          onPress: async () => {
            try {
              const txId = await sealStoryOnChain(Number(id));
              if (!txId) {
                Alert.alert(
                  'Failed',
                  'Could not seal story. Please try again.'
                );
                return;
              }
              Alert.alert(
                'Story Sealed! 🎉',
                'Rewards are being distributed to contributors!'
              );
              await refreshStory(Number(id));
              setTimeout(() => router.push(`/sealed/${id}`), 1200);
            } catch (error: any) {
              console.error('Error sealing story:', error);
              Alert.alert('Error', error.message || 'Failed to seal story');
            }
          },
        },
      ]
    );
  };

  const handleFundBounty = async () => {
    if (!isCreator) {
      Alert.alert('Unauthorized', 'Only the story creator can fund the bounty');
      return;
    }

    if (!bountyAmount || parseFloat(bountyAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid STX amount');
      return;
    }
    try {
      const amountInMicroStx = parseFloat(bountyAmount) * 1000000;
      const txId = await fundBountyOnChain(Number(id), amountInMicroStx);
      if (!txId) {
        Alert.alert('Failed', 'Could not fund bounty. Please try again.');
        return;
      }
      updateStoryChain(id as string, {
        bountyStx: (story.bountyStx || 0) + parseFloat(bountyAmount),
      });
      await refreshStory(Number(id));
      setShowBountyModal(false);
      setBountyAmount('');
      Alert.alert('Success!', `Added ${bountyAmount} STX to bounty pool`);
    } catch (error: any) {
      console.error('Bounty funding error:', error);
      Alert.alert('Error', error.message || 'Failed to fund bounty');
    }
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

        {isCreator && (
          <TouchableOpacity
            onPress={() => setShowCreatorModal(true)}
            className="ml-sm bg-accent/20 border-2 border-accent rounded-lg p-sm"
          >
            <Text className="text-2xl">👑</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* MAIN SCROLL: reserve bottom padding so footer doesn't hide last items */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 220 }} // << important: footer + safe area reserve
      >
        {/* About */}
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

        {/* Info cards */}
        <View className="px-lg pb-md">
          <View className="flex-row gap-md flex-wrap">
            <View className="flex-1 min-w-[45%] bg-accent/20 rounded-lg p-md border border-accent/30">
              <View className="flex-row items-center mb-xs">
                <Text className="text-2xl mr-sm">🎯</Text>
                <Text className="text-body text-accent font-bold">
                  Current Round
                </Text>
              </View>
              <Text className="text-h2 text-text-primary">
                {roundTimer.currentRoundNumber ?? 1}
              </Text>
              <Text className="text-caption text-text-secondary mt-xs">
                {roundTimer.totalBlocks ?? 0} blocks completed
              </Text>
            </View>

            <View
              className={`flex-1 min-w-[45%] rounded-lg p-md border ${
                roundTimer.isExpired
                  ? 'bg-red-500/20 border-red-500/30'
                  : 'bg-primary/20 border-primary/30'
              }`}
            >
              <View className="flex-row items-center mb-xs">
                <Clock
                  size={20}
                  color={roundTimer.isExpired ? '#EF4444' : '#FF2E63'}
                />
                <Text
                  className={`text-body font-bold ml-sm ${
                    roundTimer.isExpired ? 'text-red-500' : 'text-primary'
                  }`}
                >
                  {roundTimer.isExpired ? 'Voting Closed' : 'Time Left'}
                </Text>
              </View>
              <Text
                className={`text-h2 ${
                  roundTimer.isExpired ? 'text-red-500' : 'text-text-primary'
                }`}
              >
                {roundTimer.timeRemainingFormatted ?? '00:00:00'}
              </Text>
              <View className="h-1 bg-border rounded-full overflow-hidden mt-sm mb-xs">
                <View
                  className="h-full bg-primary rounded-full"
                  style={{
                    width: `${Math.min(
                      roundTimer.roundProgressPercentage ?? 0,
                      100
                    )}%`,
                  }}
                />
              </View>
              <Text className="text-caption text-text-secondary">
                {roundTimer.votingWindowHours ?? 24}h voting window
              </Text>
            </View>

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
          </View>
        </View>

        {/* Progress */}
        <View className="px-lg pb-md">
          <View className="flex-row justify-between items-center mb-sm">
            <Text className="text-body text-text-primary font-semibold">
              Chain Progress
            </Text>
            <Text className="text-body text-primary font-bold">
              {story.blocks?.length ?? 0}/{story.maxBlocks ?? 0} blocks
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
              {story.totalDuration ?? 0}s of 120s total
            </Text>
            <Text className="text-caption text-primary font-semibold">
              {Math.round(progress)}%
            </Text>
          </View>
        </View>

        {/* Voice blocks */}
        <View className="px-lg pb-lg">
          <Text className="text-h3 text-text-primary mb-md">
            Voice Blocks ({story.blocks?.length ?? 0})
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

        {/* CTA (shows only if active & has blocks) */}
        {story.status === 'active' && (story.blocks?.length ?? 0) > 0 && (
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

          <GameButton
            title="🎤 Contribute to Story"
            onPress={handleContribute}
            size="large"
            variant="accent"
            className="w-full"
          />
        </View>
      )}

      {/* BOUNTY MODAL - wrapped in KeyboardAvoidingView so keyboard won't hide input */}
      <Modal
        visible={showBountyModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBountyModal(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.8)',
            paddingHorizontal: 16,
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
            style={{ width: '100%' }}
          >
            <RNSafeArea style={{ width: '100%' }}>
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
            </RNSafeArea>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* CREATOR CONTROLS - bottom sheet style with scrollable content and keyboard support */}
      <Modal
        visible={showCreatorModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreatorModal(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
            style={{ maxHeight: '75%' }} // sheet height
          >
            <View className="bg-card rounded-t-3xl p-lg h-full">
              <View className="flex-row items-center justify-between mb-lg pb-md border-b border-border">
                <View className="flex-row items-center">
                  <Text className="text-3xl mr-sm">👑</Text>
                  <Text className="text-h2 text-accent font-bold">
                    Creator Controls
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowCreatorModal(false)}
                  className="p-sm"
                >
                  <Text className="text-2xl text-text-secondary">✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 160 }}
              >
                <View className="bg-accent/10 rounded-lg p-md mb-lg border border-accent/30">
                  <Text className="text-body text-accent font-bold mb-xs">
                    Current Round: {currentRoundNum}
                  </Text>
                  <Text className="text-caption text-text-secondary">
                    {canFinalize
                      ? '✅ Ready to finalize - voting period has ended'
                      : `⏰ Voting ends in: ${
                          roundTimer.timeRemainingFormatted ?? '00:00:00'
                        }`}
                  </Text>
                </View>

                <View className="bg-secondary/10 rounded-lg p-md mb-lg border border-secondary/30">
                  <Text className="text-body text-text-primary font-semibold mb-sm">
                    📊 Story Statistics
                  </Text>
                  <View className="gap-xs">
                    <Text className="text-caption text-text-secondary">
                      Total Blocks: {roundTimer.totalBlocks ?? 0} /{' '}
                      {story.maxBlocks ?? 0}
                    </Text>
                    <Text className="text-caption text-text-secondary">
                      Submissions This Round: {submissions.length}
                    </Text>
                    <Text className="text-caption text-text-secondary">
                      Bounty Pool: {story.bountyStx || 0} STX
                    </Text>
                  </View>
                </View>

                <View className="gap-md">
                  <View className="bg-background rounded-lg p-md">
                    <Text className="text-body text-text-primary font-semibold mb-xs">
                      💰 Fund Bounty
                    </Text>
                    <Text className="text-caption text-text-secondary mb-md">
                      Add STX to the bounty pool to reward contributors
                    </Text>
                    <GameButton
                      title="Add to Bounty"
                      onPress={() => setShowBountyModal(true)}
                      size="large"
                      variant="secondary"
                      className="w-full"
                      disabled={isProcessing}
                      loading={isProcessing}
                    />
                  </View>

                  <View className="bg-background rounded-lg p-md">
                    <Text className="text-body text-text-primary font-semibold mb-xs">
                      🏆 Finalize Round
                    </Text>
                    <Text className="text-caption text-text-secondary mb-md">
                      Select the winning submission and advance to the next
                      round
                    </Text>
                    <GameButton
                      title={
                        canFinalize ? 'Finalize Now' : 'Waiting for Voting'
                      }
                      onPress={handleFinalizeRound}
                      size="large"
                      variant={canFinalize ? 'accent' : 'outline'}
                      className="w-full"
                      disabled={!canFinalize || isProcessing}
                      loading={isProcessing}
                    />
                  </View>

                  <View className="bg-background rounded-lg p-md">
                    <Text className="text-body text-text-primary font-semibold mb-xs">
                      🔒 Seal Story
                    </Text>
                    <Text className="text-caption text-text-secondary mb-md">
                      Permanently close the story (requires at least 5 blocks)
                    </Text>
                    <GameButton
                      title="Seal Story"
                      onPress={handleSealStory}
                      size="large"
                      variant="secondary"
                      className="w-full"
                      disabled={
                        isProcessing || (roundTimer.totalBlocks || 0) < 5
                      }
                      loading={isProcessing}
                    />
                    {(roundTimer.totalBlocks || 0) < 5 && (
                      <Text className="text-caption text-red-500 mt-xs text-center">
                        Need {5 - (roundTimer.totalBlocks || 0)} more blocks to
                        seal
                      </Text>
                    )}
                  </View>

                  <View className="bg-secondary/20 rounded-lg p-md mt-lg border border-secondary/30">
                    <Text className="text-body text-text-primary font-semibold mb-xs">
                      💡 Creator Tips
                    </Text>
                    <Text className="text-caption text-text-secondary leading-5">
                      • You can contribute voice blocks to your own story!{'\n'}
                      • Finalize rounds after voting ends to keep the story
                      moving{'\n'}• Seal the story when you're happy with its
                      completion{'\n'}• Monitor voting activity and encourage
                      participation{'\n'}• Consider adding bounties to
                      incentivize quality contributions
                    </Text>
                  </View>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
