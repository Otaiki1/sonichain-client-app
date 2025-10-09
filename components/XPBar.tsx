import React from 'react';
import { View, Text } from 'react-native';

interface XPBarProps {
  xp: number;
  level: number;
}

export const XPBar: React.FC<XPBarProps> = ({ xp, level }) => {
  const xpInCurrentLevel = xp % 100;
  const progress = xpInCurrentLevel;

  return (
    <View className="flex-row items-center gap-md">
      <View className="bg-secondary px-md py-sm rounded-md">
        <Text className="text-body text-text-primary font-bold">
          LVL {level}
        </Text>
      </View>
      <View className="flex-1">
        <View className="h-3 bg-border rounded-full overflow-hidden">
          <View
            className="h-full bg-primary rounded-full"
            style={{ width: `${progress}%` }}
          />
        </View>
        <Text className="text-small text-text-secondary mt-xs">
          {xpInCurrentLevel}/100 XP
        </Text>
      </View>
    </View>
  );
};
