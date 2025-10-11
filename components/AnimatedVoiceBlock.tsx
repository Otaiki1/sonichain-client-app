import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Play, Pause } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { VoiceBlock } from '../types';

interface AnimatedVoiceBlockProps {
  block: VoiceBlock;
  isPlaying?: boolean;
  onPlayPress?: () => void;
  index?: number;
}

export const AnimatedVoiceBlock: React.FC<AnimatedVoiceBlockProps> = ({
  block,
  isPlaying = false,
  onPlayPress,
  index = 0,
}) => {
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(buttonScaleAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(buttonScaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isPlaying]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePress = () => {
    if (onPlayPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPlayPress();
    }
  };

  return (
    <Animated.View
      style={{
        opacity: opacityAnim,
        transform: [{ translateY: translateYAnim }],
      }}
    >
      <View className="flex-row bg-card rounded-2xl p-md mb-md border border-border overflow-hidden relative">
        {/* Glow background when playing */}
        {isPlaying && (
          <View
            className="absolute inset-0"
            style={{ backgroundColor: '#00FFFF', opacity: 0.1 }}
          />
        )}

        {/* Play button */}
        <TouchableOpacity
          className="w-11 h-11 rounded-full bg-primary items-center justify-center mr-md relative z-10"
          onPress={handlePress}
          activeOpacity={0.7}
        >
          <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
            {isPlaying ? (
              <Pause size={20} color="#FFFFFF" fill="#FFFFFF" />
            ) : (
              <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
            )}
          </Animated.View>
        </TouchableOpacity>

        {/* Content */}
        <View className="flex-1 relative z-10">
          <View className="flex-row justify-between items-center mb-sm">
            <Text className="text-body text-text-primary font-semibold">
              {block.username}
            </Text>
            <Text className="text-caption text-text-secondary">
              {formatDuration(block.duration)}
            </Text>
          </View>

          {/* Waveform */}
          <View className="flex-row items-center gap-0.5 h-10">
            {Array.from({ length: 40 }).map((_, i) => {
              const height = Math.random() * 30 + 10;
              const isActive = isPlaying && i < 20;

              return (
                <View
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{
                    height: height,
                    backgroundColor: isActive ? '#00FFFF' : '#3D1F2E',
                  }}
                />
              );
            })}
          </View>

          {block.votes !== undefined && (
            <View className="flex-row items-center mt-sm">
              <Text className="text-caption text-text-secondary">
                ❤️ {block.votes} votes
              </Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
};
