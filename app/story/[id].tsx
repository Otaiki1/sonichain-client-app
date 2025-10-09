import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Clock, Coins } from 'lucide-react-native';
import { WaveformCard } from '../../components/WaveformCard';
import { Button } from '../../components/Button';
import { useAppStore } from '../../store/useAppStore';

export default function StoryDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { storyChains } = useAppStore();
  const [playingBlockId, setPlayingBlockId] = useState<string | null>(null);

  const story = storyChains.find((s) => s.id === id);

  if (!story) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Text className="text-h2 text-text-primary text-center mt-xxl">
          Story not found
        </Text>
      </SafeAreaView>
    );
  }

  const progress = (story.blocks.length / story.maxBlocks) * 100;
  const timeProgress = (story.totalDuration / 120) * 100;

  const handlePlayBlock = (blockId: string) => {
    setPlayingBlockId(playingBlockId === blockId ? null : blockId);
  };

  const handleContribute = () => {
    router.push(`/record/${story.id}`);
  };

  const handleVote = () => {
    router.push(`/voting/${story.id}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center p-lg border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="mr-md">
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View className="flex-row items-center flex-1">
          <Text className="text-5xl mr-md">{story.coverArt}</Text>
          <View className="flex-1">
            <Text className="text-h2 text-text-primary">{story.title}</Text>
            <Text className="text-caption text-text-secondary">
              {story.category}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Story Description */}
        {story.description && (
          <View className="px-lg pt-lg pb-md">
            <Text className="text-body text-text-primary font-semibold mb-sm">
              About This Story
            </Text>
            <Text className="text-body text-text-secondary leading-6">
              {story.description}
            </Text>
          </View>
        )}

        {/* Story Info Cards */}
        <View className="px-lg pb-md">
          <View className="flex-row gap-md flex-wrap">
            {/* Bounty Card */}
            {story.bountyStx && (
              <View className="flex-1 min-w-[45%] bg-secondary/20 rounded-lg p-md border border-secondary/30">
                <View className="flex-row items-center mb-xs">
                  <Coins size={20} color="#FF6B9D" />
                  <Text className="text-body text-secondary font-bold ml-sm">
                    Bounty Pool
                  </Text>
                </View>
                <Text className="text-h2 text-text-primary">
                  {story.bountyStx} STX
                </Text>
                <Text className="text-caption text-text-secondary mt-xs">
                  Split among contributors
                </Text>
              </View>
            )}

            {/* Voting Window Card */}
            {story.votingWindowHours && (
              <View className="flex-1 min-w-[45%] bg-primary/20 rounded-lg p-md border border-primary/30">
                <View className="flex-row items-center mb-xs">
                  <Clock size={20} color="#FF2E63" />
                  <Text className="text-body text-primary font-bold ml-sm">
                    Voting Window
                  </Text>
                </View>
                <Text className="text-h2 text-text-primary">
                  {story.votingWindowHours}h
                </Text>
                <Text className="text-caption text-text-secondary mt-xs">
                  Per voice block
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Progress Section */}
        <View className="px-lg pb-md">
          <View className="flex-row justify-between items-center mb-sm">
            <Text className="text-body text-text-primary font-semibold">
              Chain Progress
            </Text>
            <Text className="text-body text-primary font-bold">
              {story.blocks.length}/{story.maxBlocks} blocks
            </Text>
          </View>
          <View className="h-3 bg-border rounded-full overflow-hidden mb-xs">
            <View
              className="h-full bg-primary rounded-full"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </View>
          <View className="flex-row justify-between">
            <Text className="text-caption text-text-secondary">
              {story.totalDuration}s of 120s total
            </Text>
            <Text className="text-caption text-primary font-semibold">
              {Math.round(progress)}%
            </Text>
          </View>
        </View>

        {/* Voice Blocks Section */}
        <View className="px-lg pb-lg">
          <Text className="text-h3 text-text-primary mb-md">
            Voice Blocks ({story.blocks.length})
          </Text>
          {story.blocks.length === 0 ? (
            <View className="bg-card rounded-lg p-xl items-center border border-border">
              <Text className="text-5xl mb-md">🎤</Text>
              <Text className="text-body text-text-primary font-semibold mb-xs">
                No voice blocks yet
              </Text>
              <Text className="text-caption text-text-secondary text-center">
                Be the first to contribute to this story!
              </Text>
            </View>
          ) : (
            story.blocks.map((block) => (
              <WaveformCard
                key={block.id}
                block={block}
                isPlaying={playingBlockId === block.id}
                onPlayPress={() => handlePlayBlock(block.id)}
              />
            ))
          )}
        </View>

        {/* Call to Action */}
        {story.status === 'active' && story.blocks.length > 0 && (
          <View className="px-lg pb-lg">
            <TouchableOpacity
              className="bg-accent/20 rounded-lg p-md border border-accent/30"
              onPress={handleVote}
            >
              <Text className="text-body text-accent font-bold mb-xs">
                🗳️ Vote on Next Block
              </Text>
              <Text className="text-caption text-text-secondary">
                Help decide which voice continues the story
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Contribute Button */}
      {story.status === 'active' && (
        <View className="p-lg border-t border-border">
          <Button
            title="Contribute to Story"
            onPress={handleContribute}
            size="large"
            className="w-full"
          />
        </View>
      )}
    </SafeAreaView>
  );
}
