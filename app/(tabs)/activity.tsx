import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  CheckCircle,
  Award,
  Image as ImageIcon,
  Clock,
  Coins,
} from 'lucide-react-native';
import { Button } from '../../components/Button';
import { useAppStore } from '../../store/useAppStore';

export default function ActivityScreen() {
  const router = useRouter();
  const { user, storyChains, updateStoryChain, updateUser, addXP } =
    useAppStore();
  const [processingStoryId, setProcessingStoryId] = useState<string | null>(
    null
  );

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Text className="text-h2 text-text-primary text-center mt-xxl">
          Please login to view activity
        </Text>
      </SafeAreaView>
    );
  }

  // Get user's created stories that need finalization
  const pendingStories = storyChains.filter(
    (story) =>
      story.creatorUsername === user.username && story.status === 'sealed'
  );

  // Get all user's created stories
  const myCreatedStories = storyChains.filter(
    (story) => story.creatorUsername === user.username
  );

  // Get user's NFTs
  const myNFTs = user.nfts || [];

  const handleFinalizeStory = (storyId: string) => {
    setProcessingStoryId(storyId);

    const story = storyChains.find((s) => s.id === storyId);
    if (!story) return;

    // Simulate finalization
    setTimeout(() => {
      // Update story status
      updateStoryChain(storyId, {
        status: 'finalized',
        nftMinted: true,
        nftId: `NFT-${Date.now()}`,
      });

      // Create NFT for each contributor
      const contributors = Array.from(
        new Set(story.blocks.map((block) => block.username))
      );

      const newNFTs = contributors.map((contributor) => ({
        id: `nft-${storyId}-${contributor}-${Date.now()}`,
        storyId: story.id,
        storyTitle: story.title,
        coverArt: story.coverArt,
        mintedTo: contributor,
        mintedBy: user.username,
        mintedAt: new Date().toISOString(),
      }));

      // Add NFTs to current user if they're a contributor
      const userNFT = newNFTs.find((nft) => nft.mintedTo === user.username);
      if (userNFT) {
        updateUser({ nfts: [...(user.nfts || []), userNFT] });
      }

      // Award XP for finalizing
      addXP(100);

      setProcessingStoryId(null);
      Alert.alert(
        'Story Finalized! 🎉',
        `${
          story.bountyStx
            ? `${story.bountyStx} STX distributed among ${contributors.length} contributors. `
            : ''
        }NFTs minted for all contributors!`
      );
    }, 2000);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-lg pt-lg pb-md">
        <Text className="text-h1 text-text-primary mb-xs">Activity</Text>
        <Text className="text-body text-text-secondary">
          Manage your stories and NFTs
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Pending Finalizations */}
        {pendingStories.length > 0 && (
          <View className="px-lg mb-xl">
            <View className="flex-row items-center mb-md">
              <Clock size={20} color="#FF2E63" />
              <Text className="text-h3 text-text-primary ml-sm">
                Pending Finalization ({pendingStories.length})
              </Text>
            </View>

            {pendingStories.map((story) => (
              <View
                key={story.id}
                className="bg-card rounded-lg p-md mb-md border border-primary/50"
              >
                <View className="flex-row items-center mb-md">
                  <Text className="text-4xl mr-md">{story.coverArt}</Text>
                  <View className="flex-1">
                    <Text className="text-body text-text-primary font-bold mb-xs">
                      {story.title}
                    </Text>
                    <Text className="text-caption text-text-secondary">
                      {story.blocks.length} blocks • {story.totalDuration}s
                      total
                    </Text>
                  </View>
                </View>

                {story.bountyStx && (
                  <View className="flex-row items-center bg-secondary/20 px-sm py-xs rounded-md mb-md">
                    <Coins size={14} color="#FF6B9D" />
                    <Text className="text-small text-secondary font-bold ml-xs">
                      {story.bountyStx} STX to distribute
                    </Text>
                  </View>
                )}

                <View className="bg-background/50 rounded-md p-sm mb-md">
                  <Text className="text-caption text-text-secondary mb-xs">
                    Contributors:{' '}
                    {
                      Array.from(new Set(story.blocks.map((b) => b.username)))
                        .length
                    }
                  </Text>
                  <Text className="text-caption text-text-secondary">
                    • Funds will be split equally
                  </Text>
                  <Text className="text-caption text-text-secondary">
                    • NFTs will be minted to all contributors
                  </Text>
                </View>

                <Button
                  title={
                    processingStoryId === story.id
                      ? 'Processing...'
                      : 'Finalize & Distribute'
                  }
                  onPress={() => handleFinalizeStory(story.id)}
                  disabled={processingStoryId === story.id}
                  loading={processingStoryId === story.id}
                  size="medium"
                  className="w-full"
                />
              </View>
            ))}
          </View>
        )}

        {/* My Created Stories */}
        <View className="px-lg mb-xl">
          <View className="flex-row items-center mb-md">
            <Award size={20} color="#FF6B9D" />
            <Text className="text-h3 text-text-primary ml-sm">
              My Created Stories ({myCreatedStories.length})
            </Text>
          </View>

          {myCreatedStories.length === 0 ? (
            <View className="bg-card rounded-lg p-xl items-center border border-border">
              <Text className="text-4xl mb-md">📝</Text>
              <Text className="text-body text-text-primary font-semibold mb-xs">
                No stories created yet
              </Text>
              <Text className="text-caption text-text-secondary text-center">
                Create your first story from the Home tab
              </Text>
            </View>
          ) : (
            myCreatedStories.map((story) => (
              <TouchableOpacity
                key={story.id}
                className="bg-card rounded-lg p-md mb-md border border-border"
                onPress={() => router.push(`/story/${story.id}`)}
              >
                <View className="flex-row items-center">
                  <Text className="text-3xl mr-md">{story.coverArt}</Text>
                  <View className="flex-1">
                    <Text className="text-body text-text-primary font-semibold mb-xs">
                      {story.title}
                    </Text>
                    <View className="flex-row gap-md flex-wrap">
                      <Text className="text-caption text-text-secondary">
                        {story.blocks.length}/{story.maxBlocks} blocks
                      </Text>
                      {story.status === 'active' && (
                        <Text className="text-caption text-accent">
                          ● Active
                        </Text>
                      )}
                      {story.status === 'sealed' && (
                        <Text className="text-caption text-primary">
                          🔒 Sealed
                        </Text>
                      )}
                      {story.status === 'finalized' && (
                        <Text className="text-caption text-secondary">
                          ✓ Finalized
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* My NFTs */}
        <View className="px-lg mb-xl">
          <View className="flex-row items-center mb-md">
            <ImageIcon size={20} color="#FF4081" />
            <Text className="text-h3 text-text-primary ml-sm">
              My NFT Collection ({myNFTs.length})
            </Text>
          </View>

          {myNFTs.length === 0 ? (
            <View className="bg-card rounded-lg p-xl items-center border border-border">
              <Text className="text-4xl mb-md">🎨</Text>
              <Text className="text-body text-text-primary font-semibold mb-xs">
                No NFTs yet
              </Text>
              <Text className="text-caption text-text-secondary text-center">
                Contribute to stories to earn NFTs when they're finalized
              </Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-md">
              {myNFTs.map((nft) => (
                <View
                  key={nft.id}
                  className="w-[47%] bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg p-md border-2 border-primary/50"
                >
                  <View className="items-center mb-sm">
                    <Text className="text-5xl mb-sm">{nft.coverArt}</Text>
                    <Text className="text-body text-text-primary font-bold text-center mb-xs">
                      {nft.storyTitle}
                    </Text>
                    <Text className="text-caption text-text-secondary text-center">
                      Minted by {nft.mintedBy}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-center bg-accent/20 px-sm py-xs rounded-md">
                    <CheckCircle size={12} color="#FF4081" />
                    <Text className="text-small text-accent font-bold ml-xs">
                      Owned
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
