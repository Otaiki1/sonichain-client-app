import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Clock, Coins, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { AnimatedVoiceBlock } from '../../components/AnimatedVoiceBlock';
import { GameButton } from '../../components/GameButton';
import { BackgroundPulse } from '../../components/BackgroundPulse';
import { useAppStore } from '../../store/useAppStore';
import { SoundEffects } from '../../utils/soundEffects';

const mockSubmissions = [
  {
    id: 'sub1',
    username: 'EpicStoryteller',
    audioUri: 'mock-sub-1',
    duration: 24,
  },
  {
    id: 'sub2',
    username: 'VoiceMaster',
    audioUri: 'mock-sub-2',
    duration: 28,
  },
];

export default function VotingScreen() {
  const router = useRouter();
  const { storyId } = useLocalSearchParams();
  const { user, updateUser, addXP, unlockBadge, storyChains } = useAppStore();

  const story = storyChains.find((s) => s.id === storyId);

  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(
    null
  );
  const [hasVoted, setHasVoted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Animation values
  const resultsOpacity = useRef(new Animated.Value(0)).current;
  const resultsScale = useRef(new Animated.Value(0.8)).current;
  const emojiRotate = useRef(new Animated.Value(0)).current;

  const handleVote = (submissionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    SoundEffects.playTap();
    setSelectedSubmission(submissionId);
  };

  const submitVote = async () => {
    if (!selectedSubmission || !user) return;

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

    setTimeout(() => {
      router.back();
    }, 4000);
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
            {/* Story Context */}
            {story && (story.votingWindowHours || story.bountyStx) && (
              <View className="flex-row gap-md px-lg pt-lg pb-md">
                {story.votingWindowHours && (
                  <View className="flex-1 flex-row items-center bg-card px-md py-sm rounded-xl gap-sm border border-accent/30">
                    <Clock size={18} color="#00FFFF" />
                    <View className="flex-1">
                      <Text className="text-caption text-text-secondary text-xs">
                        Voting Window
                      </Text>
                      <Text className="text-body text-text-primary font-bold">
                        {story.votingWindowHours}h
                      </Text>
                    </View>
                  </View>
                )}

                {story.bountyStx && (
                  <View className="flex-1 flex-row items-center bg-card px-md py-sm rounded-xl gap-sm border border-secondary/30">
                    <Coins size={18} color="#FF6B9D" />
                    <View className="flex-1">
                      <Text className="text-caption text-text-secondary text-xs">
                        Bounty
                      </Text>
                      <Text className="text-body text-text-primary font-bold">
                        {story.bountyStx} STX
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

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
              {mockSubmissions.map((submission, index) => (
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
              ))}
            </View>

            {/* Vote Button */}
            <View className="p-lg relative z-10">
              <GameButton
                title="Submit Vote"
                onPress={submitVote}
                disabled={!selectedSubmission || hasVoted}
                loading={hasVoted && !showResults}
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
