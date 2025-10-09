import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Play, Pause } from 'lucide-react-native';
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
    <View className="flex-row bg-card rounded-md p-md mb-md border border-border">
      <TouchableOpacity
        className="w-11 h-11 rounded-full bg-primary items-center justify-center mr-md"
        onPress={onPlayPress}
        activeOpacity={0.7}
      >
        {isPlaying ? (
          <Pause size={20} color="#FFFFFF" fill="#FFFFFF" />
        ) : (
          <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
        )}
      </TouchableOpacity>

      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-sm">
          <Text className="text-body text-text-primary font-semibold">
            {block.username}
          </Text>
          <Text className="text-caption text-text-secondary">
            {formatDuration(block.duration)}
          </Text>
        </View>

        <View className="flex-row items-center gap-0.5 h-10">
          {Array.from({ length: 40 }).map((_, i) => (
            <View
              key={i}
              className="flex-1 rounded-sm"
              style={{
                height: Math.random() * 30 + 10,
                backgroundColor: isPlaying && i < 20 ? '#FF2E63' : '#3D1F2E',
              }}
            />
          ))}
        </View>

        {block.votes !== undefined && (
          <Text className="text-caption text-text-secondary mt-sm">
            ❤️ {block.votes} votes
          </Text>
        )}
      </View>
    </View>
  );
};
