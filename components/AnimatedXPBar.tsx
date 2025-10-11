import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface AnimatedXPBarProps {
  xp: number;
  level: number;
  previousXP?: number;
}

export const AnimatedXPBar: React.FC<AnimatedXPBarProps> = ({
  xp,
  level,
  previousXP = 0,
}) => {
  const xpInCurrentLevel = xp % 100;
  const progress = xpInCurrentLevel;

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(progress)).current;

  // Trigger haptic when XP changes
  useEffect(() => {
    if (xp > previousXP && previousXP > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [xp]);

  // Animate scale for level badge
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Animate progress bar
  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: progress,
      damping: 15,
      stiffness: 150,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View className="flex-row items-center gap-md">
      {/* Level Badge with animation */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <LinearGradient
          colors={['#FF2E63', '#FF6B9D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="px-md py-sm rounded-xl"
        >
          <Text className="text-body text-text-primary font-bold">
            LVL {level}
          </Text>
        </LinearGradient>
      </Animated.View>

      {/* XP Bar Container */}
      <View className="flex-1">
        <View className="h-3 bg-border rounded-full overflow-hidden relative">
          {/* Gradient Fill with animation */}
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
              style={{ height: '100%', width: '100%', borderRadius: 999 }}
            />
          </Animated.View>
        </View>

        {/* XP Text */}
        <Text className="text-small text-text-secondary mt-xs">
          {xpInCurrentLevel}/100 XP
        </Text>
      </View>
    </View>
  );
};
