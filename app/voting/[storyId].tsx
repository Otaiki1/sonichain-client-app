import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { theme } from '../../constants/theme';
import { WaveformCard } from '../../components/WaveformCard';
import { Button } from '../../components/Button';
import { useAppStore } from '../../store/useAppStore';

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
  const { user, updateUser, addXP, unlockBadge } = useAppStore();

  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const scaleAnim = new Animated.Value(1);

  const handleVote = (submissionId: string) => {
    setSelectedSubmission(submissionId);
  };

  const submitVote = () => {
    if (!selectedSubmission || !user) return;

    setHasVoted(true);

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      setShowResults(true);
      updateUser({
        totalVotes: user.totalVotes + 1,
      });
      addXP(10);

      if (user.totalVotes === 0) {
        unlockBadge('badge2');
      }
    }, 1000);

    setTimeout(() => {
      router.back();
    }, 4000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vote for Next Block</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {!showResults ? (
          <>
            <View style={styles.instructionContainer}>
              <Text style={styles.instruction}>
                Listen to both submissions and vote for your favorite!
              </Text>
              <Text style={styles.subInstruction}>You can only vote once</Text>
            </View>

            <View style={styles.submissionsContainer}>
              {mockSubmissions.map((submission) => (
                <TouchableOpacity
                  key={submission.id}
                  style={[
                    styles.submissionCard,
                    selectedSubmission === submission.id && styles.selectedCard,
                  ]}
                  onPress={() => handleVote(submission.id)}
                  activeOpacity={0.8}
                >
                  <WaveformCard
                    block={{
                      id: submission.id,
                      username: submission.username,
                      audioUri: submission.audioUri,
                      duration: submission.duration,
                      timestamp: new Date().toISOString(),
                    }}
                    isPlaying={playingId === submission.id}
                    onPlayPress={() =>
                      setPlayingId(playingId === submission.id ? null : submission.id)
                    }
                  />
                  {selectedSubmission === submission.id && (
                    <View style={styles.selectedBadge}>
                      <Text style={styles.selectedText}>✓ Selected</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.footer}>
              <Button
                title="Submit Vote"
                onPress={submitVote}
                disabled={!selectedSubmission || hasVoted}
                loading={hasVoted && !showResults}
                size="large"
                style={styles.voteButton}
              />
            </View>
          </>
        ) : (
          <Animated.View
            style={[styles.resultsContainer, { transform: [{ scale: scaleAnim }] }]}
          >
            <Text style={styles.resultsEmoji}>🎉</Text>
            <Text style={styles.resultsTitle}>Vote Submitted!</Text>
            <Text style={styles.resultsText}>
              The winning block will be added to the chain soon
            </Text>
            <View style={styles.xpBadge}>
              <Text style={styles.xpText}>+10 XP</Text>
            </View>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  instructionContainer: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  instruction: {
    ...theme.typography.body,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  subInstruction: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  submissionsContainer: {
    flex: 1,
  },
  submissionCard: {
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: theme.colors.primary,
  },
  selectedBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  selectedText: {
    ...theme.typography.caption,
    color: theme.colors.background,
    fontWeight: '700',
  },
  footer: {
    paddingVertical: theme.spacing.lg,
  },
  voteButton: {
    width: '100%',
  },
  resultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsEmoji: {
    fontSize: 80,
    marginBottom: theme.spacing.lg,
  },
  resultsTitle: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  resultsText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  xpBadge: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
  },
  xpText: {
    ...theme.typography.h2,
    color: theme.colors.text,
    fontWeight: '700',
  },
});
