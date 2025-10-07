import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Play, Pause } from 'lucide-react-native';
import { theme } from '../constants/theme';
import { VoiceBlock } from '../types';

interface WaveformCardProps {
  block: VoiceBlock;
  isPlaying?: boolean;
  onPlayPress?: () => void;
}

export const WaveformCard: React.FC<WaveformCardProps> = ({
  block,
  isPlaying = false,
  onPlayPress,
}) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.playButton} onPress={onPlayPress} activeOpacity={0.7}>
        {isPlaying ? (
          <Pause size={20} color={theme.colors.text} fill={theme.colors.text} />
        ) : (
          <Play size={20} color={theme.colors.text} fill={theme.colors.text} />
        )}
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.username}>{block.username}</Text>
          <Text style={styles.duration}>{formatDuration(block.duration)}</Text>
        </View>

        <View style={styles.waveformContainer}>
          {Array.from({ length: 40 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.waveformBar,
                {
                  height: Math.random() * 30 + 10,
                  backgroundColor: isPlaying && i < 20 ? theme.colors.primary : theme.colors.border,
                },
              ]}
            />
          ))}
        </View>

        {block.votes !== undefined && (
          <Text style={styles.votes}>❤️ {block.votes} votes</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  username: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
  },
  duration: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 40,
  },
  waveformBar: {
    flex: 1,
    borderRadius: 2,
  },
  votes: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
});
