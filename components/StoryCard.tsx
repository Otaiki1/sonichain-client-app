import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Clock, Coins } from 'lucide-react-native';
import { StoryChain } from '../types';

interface StoryCardProps {
  story: StoryChain;
  onPress: () => void;
}

export const StoryCard: React.FC<StoryCardProps> = ({ story, onPress }) => {
  const progress = (story.blocks.length / story.maxBlocks) * 100;
  const progressTime = (story.totalDuration / 120) * 100;

  return (
    <TouchableOpacity
      className="bg-card rounded-lg p-md mb-md border border-border"
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View className="flex-row items-center mb-md">
        <Text className="text-5xl mr-md">{story.coverArt}</Text>
        <View className="flex-1">
          <Text className="text-h3 text-text-primary mb-xs font-semibold">
            {story.title}
          </Text>
          <Text className="text-caption text-text-secondary">
            {story.category}
          </Text>
          {story.description && (
            <Text
              className="text-caption text-text-secondary mt-xs"
              numberOfLines={2}
            >
              {story.description}
            </Text>
          )}
        </View>
        {story.status === 'sealed' && (
          <View className="bg-accent px-sm py-xs rounded-sm">
            <Text className="text-small text-text-primary font-bold">
              🔒 SEALED
            </Text>
          </View>
        )}
      </View>

      {/* Bounty and Voting Window Info */}
      {(story.bountyStx || story.votingWindowHours) && (
        <View className="flex-row gap-md mb-sm flex-wrap">
          {story.bountyStx && (
            <View className="flex-row items-center bg-secondary/20 px-sm py-xs rounded-md">
              <Coins size={14} color="#FF6B9D" />
              <Text className="text-small text-secondary font-bold ml-xs">
                {story.bountyStx} STX
              </Text>
            </View>
          )}
          {story.votingWindowHours && (
            <View className="flex-row items-center bg-primary/20 px-sm py-xs rounded-md">
              <Clock size={14} color="#FF2E63" />
              <Text className="text-small text-primary font-bold ml-xs">
                {story.votingWindowHours}h voting
              </Text>
            </View>
          )}
        </View>
      )}

      <View className="mb-sm">
        <Text className="text-caption text-text-secondary">
          {story.blocks.length}/{story.maxBlocks} blocks • {story.totalDuration}
          s
        </Text>
      </View>

      <View className="flex-row items-center gap-sm">
        <View className="flex-1 h-2 bg-border rounded-full overflow-hidden">
          <View
            className="h-full bg-primary rounded-full"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </View>
        <Text className="text-small text-primary font-bold w-10 text-right">
          {Math.round(progress)}%
        </Text>
      </View>
    </TouchableOpacity>
  );
};
