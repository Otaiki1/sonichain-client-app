import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Mic } from 'lucide-react-native';
import { theme } from '../../constants/theme';
import { WaveformCard } from '../../components/WaveformCard';
import { Button } from '../../components/Button';
import { useAppStore } from '../../store/useAppStore';

export default function StoryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { storyChains } = useAppStore();
  const [playingBlockId, setPlayingBlockId] = useState<string | null>(null);

  const story = storyChains.find((s) => s.id === id);

  if (!story) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Story not found</Text>
      </SafeAreaView>
    );
  }

  const progress = (story.blocks.length / story.maxBlocks) * 100;
  const timeProgress = (story.totalDuration / 120) * 100;

  const handlePlayBlock = (blockId: string) => {
    setPlayingBlockId(playingBlockId === blockId ? null : blockId);
  };

  const handleContribute = () => {
    router.push(`/record/${story.id}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.coverArt}>{story.coverArt}</Text>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{story.title}</Text>
            <Text style={styles.category}>{story.category}</Text>
          </View>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressLabel}>Chain Progress</Text>
          <Text style={styles.progressValue}>
            {story.blocks.length}/{story.maxBlocks} blocks
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
        </View>

        <View style={styles.progressInfo}>
          <Text style={styles.progressLabel}>Duration</Text>
          <Text style={styles.progressValue}>{story.totalDuration}s / 120s</Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${Math.min(timeProgress, 100)}%` }]}
          />
        </View>

        {story.status === 'sealed' ? (
          <View style={styles.sealedBanner}>
            <Text style={styles.sealedText}>🔒 This story is sealed!</Text>
          </View>
        ) : (
          <View style={styles.countdownBanner}>
            <Text style={styles.countdownText}>⏱️ Next voting round in 2h 34m</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.blocksContainer}
        contentContainerStyle={styles.blocksContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Voice Chain</Text>

        {story.blocks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No voice blocks yet</Text>
            <Text style={styles.emptySubtext}>Be the first to start this story!</Text>
          </View>
        ) : (
          story.blocks.map((block) => (
            <WaveformCard
              key={block.id}
              block={block}
              isPlaying={playingBlockId === block.id}
              onPlayPress={() => handlePlayBlock(block.id)}
            />
          ))
        )}
      </ScrollView>

      {story.status === 'active' && (
        <View style={styles.footer}>
          <Button
            title="Contribute to Story"
            onPress={handleContribute}
            size="large"
            style={styles.contributeButton}
          />
        </View>
      )}
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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    marginRight: theme.spacing.md,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  coverArt: {
    fontSize: 48,
    marginRight: theme.spacing.md,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  category: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  progressSection: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  progressLabel: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  progressValue: {
    ...theme.typography.body,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
  },
  sealedBanner: {
    backgroundColor: theme.colors.accent,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
  },
  sealedText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  countdownBanner: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.sm,
  },
  countdownText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  blocksContainer: {
    flex: 1,
  },
  blocksContent: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    ...theme.typography.h3,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  footer: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  contributeButton: {
    width: '100%',
  },
  errorText: {
    ...theme.typography.h2,
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: theme.spacing.xxl,
  },
});
