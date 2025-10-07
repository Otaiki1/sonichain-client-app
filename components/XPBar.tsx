import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

interface XPBarProps {
  xp: number;
  level: number;
}

export const XPBar: React.FC<XPBarProps> = ({ xp, level }) => {
  const xpInCurrentLevel = xp % 100;
  const progress = xpInCurrentLevel;

  return (
    <View style={styles.container}>
      <View style={styles.levelBadge}>
        <Text style={styles.levelText}>LVL {level}</Text>
      </View>
      <View style={styles.barContainer}>
        <View style={styles.bar}>
          <View style={[styles.fill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.xpText}>
          {xpInCurrentLevel}/100 XP
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  levelBadge: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  levelText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '700',
  },
  barContainer: {
    flex: 1,
  },
  bar: {
    height: 12,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
  },
  xpText: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
});
