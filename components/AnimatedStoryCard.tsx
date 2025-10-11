import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Clock, Coins } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StoryChain } from '../types';

interface AnimatedStoryCardProps {
  story: StoryChain;
  onPress: () => void;
  index?: number;
}

export const AnimatedStoryCard: React.FC<AnimatedStoryCardProps> = ({
  story,
  onPress,
  index = 0,
}) => {
  const progress = (story.blocks.length / story.maxBlocks) * 100;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateXAnim = useRef(new Animated.Value(-20)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(translateXAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.spring(progressAnim, {
      toValue: Math.min(progress, 100),
      delay: index * 100 + 400,
      useNativeDriver: false,
    }).start();
  }, [index, progress]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Animated.View
      style={{
        opacity: opacityAnim,
        transform: [{ translateX: translateXAnim }],
      }}
    >
      <TouchableOpacity
        className="bg-card rounded-2xl p-md mb-md border border-border overflow-hidden relative"
        onPress={handlePress}
        activeOpacity={0.7}
      >
        {/* Subtle gradient overlay */}
        <LinearGradient
          colors={[
            'rgba(255, 46, 99, 0.05)',
            'transparent',
            'rgba(0, 255, 255, 0.05)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0"
          pointerEvents="none"
        />

        <View className="flex-row items-center mb-md relative z-10">
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
            <View className="bg-success px-sm py-xs rounded-md">
              <Text className="text-small text-background font-bold">
                🔒 SEALED
              </Text>
            </View>
          )}
        </View>

        {/* Bounty and Voting Window */}
        {(story.bountyStx || story.votingWindowHours) && (
          <View className="flex-row gap-md mb-sm flex-wrap relative z-10">
            {story.bountyStx && (
              <View className="flex-row items-center bg-secondary/20 px-sm py-xs rounded-md border border-secondary/50">
                <Coins size={14} color="#FF6B9D" />
                <Text className="text-small text-secondary font-bold ml-xs">
                  {story.bountyStx} STX
                </Text>
              </View>
            )}

            {story.votingWindowHours && (
              <View className="flex-row items-center bg-accent/20 px-sm py-xs rounded-md border border-accent/50">
                <Clock size={14} color="#00FFFF" />
                <Text className="text-small text-accent font-bold ml-xs">
                  {story.votingWindowHours}h voting
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Stats */}
        <View className="mb-sm relative z-10">
          <Text className="text-caption text-text-secondary">
            {story.blocks.length}/{story.maxBlocks} blocks •{' '}
            {story.totalDuration}s
          </Text>
        </View>

        {/* Progress Bar with Gradient */}
        <View className="flex-row items-center gap-sm relative z-10">
          <View className="flex-1 h-2 bg-border rounded-full overflow-hidden">
            <Animated.View
              style={{
                position: 'absolute',
                left: 0,
                height: '100%',
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              }}
            >
              <LinearGradient
                colors={['#FF2E63', '#00FFFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ height: '100%', borderRadius: 999 }}
              />
            </Animated.View>
          </View>
          <Text className="text-small text-primary font-bold w-10 text-right">
            {Math.round(progress)}%
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};
