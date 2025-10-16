import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface AnimatedLoaderProps {
  text?: string;
  subtext?: string;
}

export function AnimatedLoader({
  text = 'Loading...',
  subtext,
}: AnimatedLoaderProps) {
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // Dot animations
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation for the main circle
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotation animation for outer ring
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Scale in animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Staggered dot animations
    const createDotAnimation = (dotAnim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dotAnim, {
            toValue: 1,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dotAnim, {
            toValue: 0,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    };

    createDotAnimation(dot1Anim, 0).start();
    createDotAnimation(dot2Anim, 200).start();
    createDotAnimation(dot3Anim, 400).start();
  }, [
    pulseAnim,
    rotateAnim,
    fadeAnim,
    scaleAnim,
    dot1Anim,
    dot2Anim,
    dot3Anim,
  ]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }}
      className="flex-1 justify-center items-center px-lg"
    >
      {/* Animated circles container */}
      <View className="relative mb-xl">
        {/* Outer rotating ring */}
        <Animated.View
          style={{
            transform: [{ rotate: spin }],
          }}
          className="absolute inset-0 items-center justify-center"
        >
          <View className="w-32 h-32 rounded-full border-4 border-accent/30 border-t-accent" />
        </Animated.View>

        {/* Middle pulsing circle */}
        <Animated.View
          style={{
            transform: [{ scale: pulseAnim }],
          }}
          className="w-32 h-32 items-center justify-center"
        >
          <LinearGradient
            colors={['#FF2E63', '#6C5CE7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="w-24 h-24 rounded-full items-center justify-center"
          >
            {/* Inner glow */}
            <View className="w-20 h-20 bg-background rounded-full items-center justify-center">
              <Text className="text-4xl">✨</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Orbiting dots */}
        <Animated.View
          style={{
            transform: [{ rotate: spin }],
          }}
          className="absolute inset-0 items-center justify-center"
        >
          <View className="w-40 h-40 relative">
            <View className="absolute top-0 left-1/2 -ml-1 w-2 h-2 bg-accent rounded-full" />
            <View className="absolute bottom-0 left-1/2 -ml-1 w-2 h-2 bg-primary rounded-full" />
            <View className="absolute left-0 top-1/2 -mt-1 w-2 h-2 bg-secondary rounded-full" />
            <View className="absolute right-0 top-1/2 -mt-1 w-2 h-2 bg-accent rounded-full" />
          </View>
        </Animated.View>
      </View>

      {/* Loading text with animated dots */}
      <View className="items-center">
        <View className="flex-row items-center">
          <Text className="text-h2 text-text-primary font-bold">{text}</Text>
          <View className="flex-row ml-1">
            <Animated.Text
              style={{
                opacity: dot1Anim,
                transform: [
                  {
                    translateY: dot1Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -5],
                    }),
                  },
                ],
              }}
              className="text-h2 text-accent font-bold"
            >
              .
            </Animated.Text>
            <Animated.Text
              style={{
                opacity: dot2Anim,
                transform: [
                  {
                    translateY: dot2Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -5],
                    }),
                  },
                ],
              }}
              className="text-h2 text-primary font-bold"
            >
              .
            </Animated.Text>
            <Animated.Text
              style={{
                opacity: dot3Anim,
                transform: [
                  {
                    translateY: dot3Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -5],
                    }),
                  },
                ],
              }}
              className="text-h2 text-secondary font-bold"
            >
              .
            </Animated.Text>
          </View>
        </View>

        {subtext && (
          <Text className="text-body text-text-secondary mt-sm text-center">
            {subtext}
          </Text>
        )}

        {/* Loading bars */}
        <View className="w-64 mt-lg">
          <View className="h-1 bg-border rounded-full overflow-hidden">
            <Animated.View
              style={{
                transform: [
                  {
                    translateX: rotateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-256, 256],
                    }),
                  },
                ],
              }}
              className="h-full w-32 bg-gradient-to-r from-transparent via-accent to-transparent"
            >
              <LinearGradient
                colors={['transparent', '#FF2E63', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="h-full w-full"
              />
            </Animated.View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
