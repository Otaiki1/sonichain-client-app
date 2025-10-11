import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

interface GameButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'accent';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  glow?: boolean;
}

export const GameButton: React.FC<GameButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  className,
  glow = true,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!disabled && glow) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.02,
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
    }
  }, [disabled, glow]);

  const handlePress = () => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };

  const getGradientColors = (): [string, string] => {
    switch (variant) {
      case 'primary':
        return ['#FF2E63', '#FF4081'];
      case 'secondary':
        return ['#FF6B9D', '#FF4081'];
      case 'accent':
        return ['#00FFFF', '#28FFBF'];
      case 'outline':
        return ['transparent', 'transparent'];
      default:
        return ['#FF2E63', '#FF4081'];
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'py-2 px-4';
      case 'medium':
        return 'py-3 px-6';
      case 'large':
        return 'py-4 px-8';
      default:
        return 'py-3 px-6';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 'text-sm';
      case 'medium':
        return 'text-base';
      case 'large':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  if (variant === 'outline') {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={handlePress}
          disabled={disabled || loading}
          activeOpacity={0.7}
          className={`rounded-2xl items-center justify-center border-2 border-primary ${getSizeClasses()} ${
            disabled ? 'opacity-50' : ''
          } ${className || ''}`}
        >
          {loading ? (
            <ActivityIndicator color="#FF2E63" />
          ) : (
            <Text className={`font-bold text-primary ${getTextSize()}`}>
              {title}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className={`rounded-2xl ${disabled ? 'opacity-50' : ''}`}
      >
        <TouchableOpacity
          onPress={handlePress}
          disabled={disabled || loading}
          activeOpacity={0.7}
          className={`items-center justify-center ${getSizeClasses()} ${
            className || ''
          }`}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              className={`font-bold text-white ${getTextSize()}`}
              style={{
                textShadowColor: 'rgba(0,0,0,0.5)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 3,
              }}
            >
              {title}
            </Text>
          )}
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
};
