import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../constants/theme';
import { StoryChain } from '../types';

interface StoryCardProps {
  story: StoryChain;
  onPress: () => void;
}

export const StoryCard: React.FC<StoryCardProps> = ({ story, onPress }) => {
  const progress = (story.blocks.length / story.maxBlocks) * 100;
  const progressTime = (story.totalDuration / 120) * 100;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <Text style={styles.coverArt}>{story.coverArt}</Text>
        <View style={styles.info}>
          <Text style={styles.title}>{story.title}</Text>
          <Text style={styles.category}>{story.category}</Text>
        </View>
        {story.status === 'sealed' && (
          <View style={styles.sealedBadge}>
            <Text style={styles.sealedText}>🔒 SEALED</Text>
          </View>
        )}
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.stats}>
          {story.blocks.length}/{story.maxBlocks} blocks • {story.totalDuration}s
        </Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
        </View>
        <Text style={styles.progressText}>{Math.round(progress)}%</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  coverArt: {
    fontSize: 48,
    marginRight: theme.spacing.md,
  },
  info: {
    flex: 1,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  category: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  sealedBadge: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  sealedText: {
    ...theme.typography.small,
    color: theme.colors.text,
    fontWeight: '700',
  },
  statsContainer: {
    marginBottom: theme.spacing.sm,
  },
  stats: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
  },
  progressText: {
    ...theme.typography.small,
    color: theme.colors.primary,
    fontWeight: '700',
    width: 40,
    textAlign: 'right',
  },
});
