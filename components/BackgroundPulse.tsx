import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const BackgroundPulse: React.FC = () => {
  // Create animated values for circles
  const circle1Opacity = useRef(new Animated.Value(0.05)).current;
  const circle1Scale = useRef(new Animated.Value(1)).current;

  const circle2Opacity = useRef(new Animated.Value(0.05)).current;
  const circle2Scale = useRef(new Animated.Value(1)).current;

  const circle3Opacity = useRef(new Animated.Value(0.05)).current;
  const circle3Scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate circles with different delays
    Animated.loop(
      Animated.sequence([
        Animated.timing(circle1Opacity, {
          toValue: 0.15,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(circle1Opacity, {
          toValue: 0.05,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(circle1Scale, {
          toValue: 1.5,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(circle1Scale, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(circle2Opacity, {
            toValue: 0.15,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(circle2Opacity, {
            toValue: 0.05,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(circle2Scale, {
            toValue: 1.5,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(circle2Scale, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 1333);

    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(circle3Opacity, {
            toValue: 0.15,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(circle3Opacity, {
            toValue: 0.05,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(circle3Scale, {
            toValue: 1.5,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(circle3Scale, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 2666);
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['#1A0E14', '#2A1520', '#1A0E14']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Pulsing circles */}
      <Animated.View
        style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: '#FF2E63',
          opacity: circle1Opacity,
          transform: [{ scale: circle1Scale }],
        }}
      />

      <Animated.View
        style={{
          position: 'absolute',
          top: '20%',
          left: '70%',
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: '#00FFFF',
          opacity: circle2Opacity,
          transform: [{ scale: circle2Scale }],
        }}
      />

      <Animated.View
        style={{
          position: 'absolute',
          top: '20%',
          left: '40%',
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: '#FF2E63',
          opacity: circle3Opacity,
          transform: [{ scale: circle3Scale }],
        }}
      />
    </View>
  );
};
