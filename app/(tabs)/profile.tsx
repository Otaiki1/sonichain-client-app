import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';
import { XPBar } from '../../components/XPBar';
import { useAppStore } from '../../store/useAppStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, storyChains } = useAppStore();

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>No user data</Text>
      </SafeAreaView>
    );
  }

  const contributedStories = storyChains.filter((story) =>
    story.blocks.some((block) => block.username === user.username)
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatar}>👤</Text>
          </View>
          <Text style={styles.username}>{user.username}</Text>
        </View>

        <View style={styles.xpSection}>
          <XPBar xp={user.xp} level={user.level} />
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{user.totalRecordings}</Text>
            <Text style={styles.statLabel}>Recordings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{user.totalVotes}</Text>
            <Text style={styles.statLabel}>Votes Cast</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{contributedStories.length}</Text>
            <Text style={styles.statLabel}>Stories</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges</Text>
          <View style={styles.badgesGrid}>
            {user.badges.map((badge) => (
              <View
                key={badge.id}
                style={[styles.badgeCard, !badge.unlocked && styles.badgeLocked]}
              >
                <Text style={styles.badgeIcon}>{badge.icon}</Text>
                <Text style={styles.badgeName}>{badge.name}</Text>
                <Text style={styles.badgeDescription}>{badge.description}</Text>
                {badge.unlocked && <Text style={styles.unlockedText}>✓ Unlocked</Text>}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Chains</Text>
          {contributedStories.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No contributions yet</Text>
              <Text style={styles.emptySubtext}>Start recording to see your stories here!</Text>
            </View>
          ) : (
            contributedStories.map((story) => (
              <TouchableOpacity
                key={story.id}
                style={styles.storyItem}
                onPress={() => router.push(`/story/${story.id}`)}
              >
                <Text style={styles.storyEmoji}>{story.coverArt}</Text>
                <View style={styles.storyInfo}>
                  <Text style={styles.storyTitle}>{story.title}</Text>
                  <Text style={styles.storyMeta}>
                    {story.blocks.filter((b) => b.username === user.username).length}{' '}
                    contribution(s)
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  avatar: {
    fontSize: 48,
  },
  username: {
    ...theme.typography.h1,
    color: theme.colors.text,
  },
  xpSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statValue: {
    ...theme.typography.h1,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  badgeCard: {
    width: '47%',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  badgeLocked: {
    opacity: 0.4,
    borderColor: theme.colors.border,
  },
  badgeIcon: {
    fontSize: 40,
    marginBottom: theme.spacing.sm,
  },
  badgeName: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  badgeDescription: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  unlockedText: {
    ...theme.typography.small,
    color: theme.colors.accent,
    fontWeight: '700',
    marginTop: theme.spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  emptySubtext: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  storyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  storyEmoji: {
    fontSize: 32,
    marginRight: theme.spacing.md,
  },
  storyInfo: {
    flex: 1,
  },
  storyTitle: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  storyMeta: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  errorText: {
    ...theme.typography.h2,
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: theme.spacing.xxl,
  },
});
