import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  textClassName?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  className,
  textClassName,
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary';
      case 'secondary':
        return 'bg-secondary';
      case 'outline':
        return 'bg-transparent border-2 border-primary';
      default:
        return 'bg-primary';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'py-sm px-md';
      case 'medium':
        return 'py-md px-lg';
      case 'large':
        return 'py-lg px-xl';
      default:
        return 'py-md px-lg';
    }
  };

  const getTextVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'text-background';
      case 'secondary':
        return 'text-text-primary';
      case 'outline':
        return 'text-primary';
      default:
        return 'text-background';
    }
  };

  const getTextSizeClasses = () => {
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

  return (
    <TouchableOpacity
      className={`rounded-md items-center justify-center ${getVariantClasses()} ${getSizeClasses()} ${
        disabled ? 'opacity-50' : ''
      } ${className || ''}`}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' ? '#FF2E63' : '#FFFFFF'}
        />
      ) : (
        <Text
          className={`font-bold ${getTextVariantClasses()} ${getTextSizeClasses()} ${
            textClassName || ''
          }`}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};
