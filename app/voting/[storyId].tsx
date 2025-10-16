import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Clock, Coins, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { AnimatedVoiceBlock } from '../../components/AnimatedVoiceBlock';
import { AnimatedLoader } from '../../components/AnimatedLoader';
import { GameButton } from '../../components/GameButton';
import { BackgroundPulse } from '../../components/BackgroundPulse';
import { useAppStore } from '../../store/useAppStore';
import { SoundEffects } from '../../utils/soundEffects';
import { useContract } from '../../hooks/useContract';
import { useStories } from '../../hooks/useStories';
import { convertBlockchainSubmissions } from '../../utils/blockchainDataConverter';
import {
  useRoundTimer,
  extractRoundTimingData,
} from '../../hooks/useRoundTimer';

export default function VotingScreen() {
  const router = useRouter();
  const { storyId } = useLocalSearchParams();
  const { user, updateUser, addXP, unlockBadge, storyChains } = useAppStore();
  const {
    voteOnChain,
    checkHasVoted,
    checkVotingActive,
    isProcessing,
    address,
  } = useContract();
  const { fetchCurrentRound, refreshStory, fetchStoryFromBlockchain } =
    useStories();

  const localStory = storyChains.find((s) => s.id === storyId);

  const [story, setStory] = useState<any>(localStory);
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(
    null
  );
  const [hasVoted, setHasVoted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [votingActive, setVotingActive] = useState(false);
  const [roundData, setRoundData] = useState<any>(null);
  const [roundTimingData, setRoundTimingData] = useState<any>(null);

  // Real-time countdown timer from blockchain data
  const roundTimer = useRoundTimer(roundTimingData);

  // Animation values
  const resultsOpacity = useRef(new Animated.Value(0)).current;
  const resultsScale = useRef(new Animated.Value(0.8)).current;
  const emojiRotate = useRef(new Animated.Value(0)).current;

  // Fetch voting data from blockchain
  useEffect(() => {
    const loadVotingData = async () => {
      if (!storyId || !address) return;

      setIsLoading(true);

      try {
        // Fetch fresh story data from blockchain for accurate timing info
        console.log('🔄 Fetching fresh story data from blockchain...');
        const freshStoryData = await fetchStoryFromBlockchain(
          parseInt(storyId as string)
        );
        const storyData = freshStoryData || localStory;
        setStory(storyData);

        // Get current round from fresh story data, fallback to 1
        const currentRound =
          storyData?.currentRound || storyData?.['current-round'] || 1;
        console.log(
          `📍 Fetching data for story ${storyId}, round ${currentRound}`
        );

        // Fetch round data and submissions
        const data = await fetchCurrentRound(
          parseInt(storyId as string),
          currentRound
        );

        if (data) {
          console.log(
            '📦 RAW SUBMISSION DATA:',
            JSON.stringify(data.submissions, null, 2)
          );
          setRoundData(data.round);

          // Extract round timing data for countdown timer
          // Pass the actual current round number as third parameter
          const timingData = extractRoundTimingData(
            data.round,
            storyData,
            currentRound
          );
          setRoundTimingData(timingData);
          console.log('⏰ Round timing data set:', timingData);

          // Convert blockchain submissions to VoiceBlock format with full Supabase URLs
          // This will also fetch actual usernames from the blockchain!
          const convertedSubmissions = await convertBlockchainSubmissions(
            data.submissions || []
          );
          console.log(
            '✅ Converted submissions:',
            JSON.stringify(convertedSubmissions, null, 2)
          );

          setSubmissions(convertedSubmissions);
        }

        // Check if voting is active
        const isActive = await checkVotingActive(
          parseInt(storyId as string),
          currentRound
        );
        setVotingActive(isActive);

        // Check if user has already voted
        if (address) {
          const userVoted = await checkHasVoted(
            parseInt(storyId as string),
            currentRound,
            address
          );
          setHasVoted(userVoted);
          if (userVoted) {
            setShowResults(true);
          }
        }
      } catch (error) {
        console.error('Error loading voting data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadVotingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId]); // Only run when story ID changes to prevent excessive API calls

  const handleVote = (submissionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    SoundEffects.playTap();
    setSelectedSubmission(submissionId);
  };

  const submitVote = async () => {
    if (!selectedSubmission || !user || !address) {
      return;
    }

    if (isProcessing) {
      return; // Prevent double submission
    }

    try {
      // Validate voting is active
      if (!votingActive) {
        alert('Voting is not currently active for this round.');
        return;
      }

      // Validate user hasn't voted
      if (hasVoted) {
        alert('You have already voted in this round.');
        return;
      }

      // Submit vote to blockchain
      console.log('🗳️ Submitting vote for submission:', selectedSubmission);

      const txId = await voteOnChain(parseInt(selectedSubmission));

      if (!txId) {
        alert('Failed to submit vote. Please try again.');
        return;
      }

      console.log('✅ Vote submitted, txId:', txId);

      // Play success feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      SoundEffects.playWhoosh();

      setHasVoted(true);

      setTimeout(() => {
        setShowResults(true);
        SoundEffects.playSuccess();

        // Animate results
        Animated.parallel([
          Animated.timing(resultsOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(resultsScale, {
            toValue: 1,
            damping: 12,
            useNativeDriver: true,
          }),
        ]).start();

        // Rotate emoji
        Animated.loop(
          Animated.sequence([
            Animated.timing(emojiRotate, {
              toValue: 10,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(emojiRotate, {
              toValue: -10,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(emojiRotate, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ])
        ).start();

        updateUser({ totalVotes: user.totalVotes + 1 });
        addXP(25);

        if (user.totalVotes === 0) {
          unlockBadge('badge2');
        }
      }, 1000);

      // Refresh story data from blockchain
      await refreshStory(parseInt(storyId as string));

      setTimeout(() => {
        router.back();
      }, 4000);
    } catch (error: any) {
      console.error('❌ Vote submission error:', error);

      // Handle specific errors
      if (error.message?.includes('ERR-ALREADY-VOTED')) {
        alert('You have already voted in this round.');
      } else if (error.message?.includes('ERR-VOTING-CLOSED')) {
        alert('The voting window has closed.');
      } else {
        alert(error.message || 'Failed to submit vote. Please try again.');
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <BackgroundPulse />

      {/* Header */}
      <View className="flex-row items-center justify-between p-lg border-b border-border relative z-10">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-h3 text-text-primary">Vote for Next Block</Text>
        <View style={{ width: 24 }} />
      </View>

      <View className="flex-1 relative z-10">
        {!showResults ? (
          <>
            {/* Real-Time Round Info - From Blockchain */}
            <View className="px-lg pt-lg pb-md">
              <View className="flex-row gap-md">
                {/* Round Number */}
                <View className="flex-1 bg-accent/20 rounded-xl px-md py-sm border border-accent/30">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-caption text-text-secondary text-xs mb-0.5">
                        Round
                      </Text>
                      <Text className="text-h3 text-accent font-bold">
                        #{roundTimer.currentRoundNumber}
                      </Text>
                    </View>
                    <Text className="text-2xl">🎯</Text>
                  </View>
                </View>

                {/* Live Countdown */}
                <View
                  className={`flex-1 rounded-xl px-md py-sm border ${
                    roundTimer.isExpired
                      ? 'bg-red-500/20 border-red-500/30'
                      : 'bg-primary/20 border-primary/30'
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-caption text-text-secondary text-xs mb-0.5">
                        {roundTimer.isExpired ? 'Voting Ended' : 'Time Left'}
                      </Text>
                      <Text
                        className={`text-h3 font-bold ${
                          roundTimer.isExpired ? 'text-red-500' : 'text-primary'
                        }`}
                      >
                        {roundTimer.timeRemainingFormatted}
                      </Text>
                    </View>
                    <Clock
                      size={20}
                      color={roundTimer.isExpired ? '#EF4444' : '#FF2E63'}
                    />
                  </View>
                  {/* Mini progress bar */}
                  <View className="h-0.5 bg-border rounded-full overflow-hidden mt-sm">
                    <View
                      className={`h-full rounded-full ${
                        roundTimer.isExpired ? 'bg-red-500' : 'bg-primary'
                      }`}
                      style={{
                        width: `${Math.min(
                          roundTimer.roundProgressPercentage,
                          100
                        )}%`,
                      }}
                    />
                  </View>
                </View>
              </View>

              {/* Bounty Info */}
              {story && story.bountyStx && (
                <View className="mt-md bg-secondary/20 rounded-xl px-md py-sm border border-secondary/30">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-sm">
                      <Coins size={18} color="#FF6B9D" />
                      <Text className="text-body text-text-secondary">
                        Bounty Pool
                      </Text>
                    </View>
                    <Text className="text-body text-secondary font-bold">
                      {story.bountyStx} STX
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Instructions */}
            <View className="px-lg pb-md">
              <View className="bg-accent/10 rounded-xl p-md border border-accent/30">
                <Text className="text-body text-text-primary font-semibold mb-xs">
                  ⚔️ Battle of the Voices
                </Text>
                <Text className="text-caption text-text-secondary">
                  Listen to both submissions and vote for your favorite! You can
                  only vote once.
                </Text>
              </View>
            </View>

            {/* Battle Layout */}
            <View className="flex-1 px-lg">
              {isLoading ? (
                <AnimatedLoader
                  text="Loading Submissions"
                  subtext="Preparing the voting arena..."
                />
              ) : submissions.length === 0 ? (
                <View className="flex-1 justify-center items-center px-lg">
                  <Text className="text-body text-text-secondary text-center">
                    No submissions yet for this round
                  </Text>
                </View>
              ) : (
                submissions.map((submission, index) => (
                  <TouchableOpacity
                    key={submission.id}
                    onPress={() => handleVote(submission.id)}
                    activeOpacity={0.9}
                    className="mb-md"
                  >
                    <View
                      className={`rounded-2xl overflow-hidden border-2 ${
                        selectedSubmission === submission.id
                          ? 'border-accent'
                          : 'border-border'
                      }`}
                      style={{
                        shadowColor:
                          selectedSubmission === submission.id
                            ? '#00FFFF'
                            : '#FF2E63',
                        shadowOffset: { width: 0, height: 0 },
                        shadowRadius: 15,
                        shadowOpacity:
                          selectedSubmission === submission.id ? 0.8 : 0.2,
                      }}
                    >
                      {selectedSubmission === submission.id && (
                        <LinearGradient
                          colors={[
                            'rgba(0, 255, 255, 0.2)',
                            'rgba(0, 255, 255, 0.05)',
                          ]}
                          className="absolute inset-0 z-0"
                        />
                      )}

                      <View className="relative z-10">
                        <AnimatedVoiceBlock
                          block={{
                            id: submission.id,
                            username: submission.username,
                            audioUri: submission.audioUri,
                            duration: submission.duration,
                            timestamp: new Date().toISOString(),
                          }}
                          isPlaying={playingId === submission.id}
                          onPlayPress={() =>
                            setPlayingId(
                              playingId === submission.id ? null : submission.id
                            )
                          }
                        />
                      </View>

                      {selectedSubmission === submission.id && (
                        <View
                          className="absolute top-2 right-2 bg-accent px-sm py-xs rounded-md"
                          style={{
                            shadowColor: '#00FFFF',
                            shadowOffset: { width: 0, height: 0 },
                            shadowRadius: 10,
                            shadowOpacity: 0.8,
                          }}
                        >
                          <Text className="text-small text-background font-bold">
                            ✓ SELECTED
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>

            {/* Vote Button */}
            <View className="p-lg relative z-10">
              <GameButton
                title={
                  isProcessing
                    ? 'Submitting Vote...'
                    : hasVoted
                    ? 'Vote Submitted!'
                    : 'Submit Vote'
                }
                onPress={submitVote}
                disabled={
                  !selectedSubmission ||
                  hasVoted ||
                  isProcessing ||
                  !votingActive
                }
                loading={isProcessing || (hasVoted && !showResults)}
                size="large"
                variant="accent"
                className="w-full"
              />
            </View>
          </>
        ) : (
          /* Results Screen */
          <Animated.View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 24,
              opacity: resultsOpacity,
              transform: [{ scale: resultsScale }],
            }}
          >
            <Animated.Text
              style={{
                fontSize: 64,
                marginBottom: 24,
                transform: [
                  {
                    rotate: emojiRotate.interpolate({
                      inputRange: [-10, 10],
                      outputRange: ['-10deg', '10deg'],
                    }),
                  },
                ],
              }}
            >
              🎉
            </Animated.Text>

            <Text className="text-h1 text-text-primary mb-md text-center">
              Vote Cast!
            </Text>

            <View className="bg-accent/20 rounded-2xl p-lg border-2 border-accent/50 mb-lg">
              <View className="flex-row items-center justify-center mb-sm">
                <Zap size={20} color="#00FFFF" />
                <Text className="text-h3 text-accent ml-sm">+25 XP</Text>
              </View>
              <Text className="text-caption text-text-secondary text-center">
                Thanks for participating in the story!
              </Text>
            </View>

            <Text className="text-body text-text-secondary">
              Returning to story...
            </Text>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}
