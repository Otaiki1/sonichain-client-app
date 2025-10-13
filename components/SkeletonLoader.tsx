import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';

/**
 * Skeleton loading component for better UX during data fetching
 */

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  className?: string;
}

export function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius = 8,
  className = '',
}: SkeletonLoaderProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      className={`bg-border ${className}`}
      style={{
        width,
        height,
        borderRadius,
        opacity,
      }}
    />
  );
}

/**
 * Skeleton for story card
 */
export function StoryCardSkeleton() {
  return (
    <View className="bg-card rounded-xl p-lg mb-md border border-border">
      <View className="flex-row items-center mb-md">
        <SkeletonLoader width={60} height={60} borderRadius={12} />
        <View className="flex-1 ml-md">
          <SkeletonLoader width="80%" height={24} className="mb-sm" />
          <SkeletonLoader width="60%" height={16} />
        </View>
      </View>
      <SkeletonLoader width="100%" height={16} className="mb-sm" />
      <SkeletonLoader width="70%" height={16} />
      <View className="flex-row gap-md mt-md">
        <SkeletonLoader width={80} height={32} borderRadius={16} />
        <SkeletonLoader width={80} height={32} borderRadius={16} />
      </View>
    </View>
  );
}

/**
 * Skeleton for voice block
 */
export function VoiceBlockSkeleton() {
  return (
    <View className="bg-card rounded-xl p-md mb-md border border-border">
      <View className="flex-row items-center">
        <SkeletonLoader width={50} height={50} borderRadius={25} />
        <View className="flex-1 ml-md">
          <SkeletonLoader width="60%" height={18} className="mb-sm" />
          <SkeletonLoader width="40%" height={14} />
        </View>
        <SkeletonLoader width={60} height={40} borderRadius={20} />
      </View>
    </View>
  );
}
