import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
  Share,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme } from '../../constants/theme';
import { Button } from '../../components/Button';
import { useAppStore } from '../../store/useAppStore';

export default function StorySealedScreen() {
  const router = useRouter();
  const { storyId } = useLocalSearchParams();
  const { user, storyChains, addXP, unlockBadge } = useAppStore();

  const story = storyChains.find((s) => s.id === storyId);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    addXP(50);

    const sealedStoriesCount = storyChains.filter(
      (s) => s.status === 'sealed'
    ).length;
    if (sealedStoriesCount >= 1 && user) {
      unlockBadge('badge3');
    }

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ),
    ]).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this completed story chain "${story?.title}" on SoniChain!`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleViewStory = () => {
    router.replace(`/story/${storyId}`);
  };

  if (!story) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Story not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: scaleAnim }, { rotate }],
            },
          ]}
        >
          <Text style={styles.lockIcon}>🔒</Text>
        </Animated.View>

        <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
          <Text style={styles.title}>Story Sealed!</Text>
          <Text style={styles.subtitle}>"{story.title}" is now complete</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{story.blocks.length}</Text>
              <Text style={styles.statLabel}>Voice Blocks</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{story.totalDuration}s</Text>
              <Text style={styles.statLabel}>Total Duration</Text>
            </View>
          </View>

          <View style={styles.rewardBox}>
            <Text style={styles.rewardTitle}>🎉 Rewards Earned</Text>
            <View style={styles.xpBadge}>
              <Text style={styles.xpText}>+50 XP</Text>
            </View>
          </View>

          <View style={styles.confettiContainer}>
            {Array.from({ length: 20 }).map((_, i) => {
              const animValue = new Animated.Value(0);
              Animated.timing(animValue, {
                toValue: 1,
                duration: 2000 + Math.random() * 1000,
                useNativeDriver: true,
              }).start();

              const translateY = animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 400],
              });

              const translateX = animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [
                  Math.random() * 40 - 20,
                  Math.random() * 200 - 100,
                ],
              });

              const leftPosition = `${Math.random() * 100}%`;
              return (
                <Animated.View
                  key={i}
                  style={[
                    styles.confetti,
                    {
                      left: leftPosition as any,
                      backgroundColor: [
                        theme.colors.primary,
                        theme.colors.secondary,
                        theme.colors.accent,
                      ][Math.floor(Math.random() * 3)],
                      transform: [{ translateY }, { translateX }],
                      opacity: fadeAnim,
                    },
                  ]}
                />
              );
            })}
          </View>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <Button
          title="View Complete Story"
          onPress={handleViewStory}
          variant="primary"
          size="large"
          className="w-full"
        />
        <Button
          title="Share"
          onPress={handleShare}
          variant="outline"
          size="large"
          className="w-full"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    borderWidth: 4,
    borderColor: theme.colors.primary,
  },
  lockIcon: {
    fontSize: 64,
  },
  textContainer: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
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
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.lg,
  },
  rewardBox: {
    width: '100%',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.accent,
  },
  rewardTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
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
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 400,
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  footer: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  button: {
    width: '100%',
  },
  errorText: {
    ...theme.typography.h2,
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: theme.spacing.xxl,
  },
});
