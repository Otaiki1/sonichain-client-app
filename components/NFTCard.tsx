import React, { useMemo } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';

// Import NFT images from assets
const NFT_IMAGES = [
  require('../assets/images/nft-image-1.png'),
  require('../assets/images/nft-image-2.png'),
  require('../assets/images/nft-image-3.png'),
];

interface NFTCardProps {
  tokenId: number;
  uri: string | null;
  metadata: {
    name?: string;
    description?: string;
    image?: string;
    attributes?: Array<{
      trait_type: string;
      value: string | number;
    }>;
    story_id?: string;
    round?: number;
    winner?: string;
  } | null;
  onPress?: () => void;
}

export function NFTCard({ tokenId, uri, metadata, onPress }: NFTCardProps) {
  // Randomly select an NFT image based on tokenId (deterministic)
  // This ensures the same NFT always shows the same image
  const selectedImage = useMemo(() => {
    const imageIndex = tokenId % NFT_IMAGES.length;
    return NFT_IMAGES[imageIndex];
  }, [tokenId]);

  const name = metadata?.name || `Soni NFT #${tokenId}`;
  const description = metadata?.description || 'Story Completion NFT';

  // Get story-specific attributes
  const storyId = metadata?.story_id;
  const round = metadata?.round;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      className="mb-md"
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['rgba(255, 46, 99, 0.1)', 'rgba(108, 92, 231, 0.1)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="rounded-xl border-2 border-accent/30 overflow-hidden"
      >
        {/* NFT Image */}
        <View className="relative">
          <Image
            source={selectedImage}
            className="w-full h-48"
            resizeMode="cover"
          />

          {/* Token ID Badge */}
          <View className="absolute top-sm right-sm bg-accent/90 rounded-lg px-md py-xs">
            <Text className="text-caption text-white font-bold">
              #{tokenId}
            </Text>
          </View>
        </View>

        {/* NFT Info */}
        <View className="p-md">
          <Text className="text-h3 text-text-primary font-bold mb-xs">
            {name}
          </Text>

          {description && (
            <Text
              className="text-body text-text-secondary mb-sm"
              numberOfLines={2}
            >
              {description}
            </Text>
          )}

          {/* Attributes */}
          {(storyId || round) && (
            <View className="flex-row flex-wrap gap-xs mt-sm">
              {storyId && (
                <View className="bg-primary/20 rounded-md px-sm py-xs">
                  <Text className="text-caption text-primary font-semibold">
                    Story #{storyId}
                  </Text>
                </View>
              )}
              {round && (
                <View className="bg-secondary/20 rounded-md px-sm py-xs">
                  <Text className="text-caption text-secondary font-semibold">
                    Round {round}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Additional Attributes */}
          {metadata?.attributes && metadata.attributes.length > 0 && (
            <View className="mt-sm border-t border-border pt-sm">
              {metadata.attributes.slice(0, 3).map((attr, index) => (
                <View
                  key={index}
                  className="flex-row justify-between items-center mb-xs"
                >
                  <Text className="text-caption text-text-secondary">
                    {attr.trait_type}
                  </Text>
                  <Text className="text-caption text-text-primary font-semibold">
                    {attr.value}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}
