import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Plus,
  Search,
  X,
  Copy,
  ExternalLink,
  RotateCw,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { AnimatedStoryCard } from '../../components/AnimatedStoryCard';
import { Button } from '../../components/Button';
import { GameButton } from '../../components/GameButton';
import { BackgroundPulse } from '../../components/BackgroundPulse';
import { useAppStore } from '../../store/useAppStore';
import { usePinata } from '../../hooks/usePinata';
import { useContract } from '../../hooks/useContract';
import { useStories } from '../../hooks/useStories';
import { useRealTimeUpdates } from '../../hooks/useRealTimeUpdates';
import { StoryChain } from '@/types';

const CATEGORIES = [
  'Mystery',
  'Sci-Fi',
  'Fantasy',
  'Horror',
  'Romance',
  'Adventure',
  'Comedy',
  'Drama',
];
const COVER_EMOJIS = [
  '🎭',
  '🎪',
  '🎨',
  '🎬',
  '🎤',
  '🎸',
  '🎮',
  '🎯',
  '🎲',
  '🎰',
  '🎺',
  '🎻',
  '🚀',
  '🌟',
  '✨',
  '🔮',
  '🕵️',
  '🧙',
  '🦄',
  '🐉',
];

export default function HomeScreen() {
  const router = useRouter();
  const { addStoryChain, user, updateUser } = useAppStore();
  const { uploadMetadata, isUploading, getPinataUrl } = usePinata();
  const { createStoryOnChain, isProcessing } = useContract();
  const {
    refreshAllStories,
    isLoading: isRefreshing,
    fetchAllStories,
  } = useStories();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStoryTitle, setNewStoryTitle] = useState('');
  const [newStoryDescription, setNewStoryDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Mystery');
  const [selectedEmoji, setSelectedEmoji] = useState('✨');
  const [maxBlocks, setMaxBlocks] = useState('10');
  const [bountyStx, setBountyStx] = useState('');
  const [votingWindowHours, setVotingWindowHours] = useState('24');
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultData, setResultData] = useState<{
    success: boolean;
    title: string;
    message: string;
    txId?: string;
  } | null>(null);
  const [appStories, setAppStories] = useState<StoryChain[]>([]);
  // Enable real-time updates for stories (refresh every 5 minutes to avoid rate limits)
  useRealTimeUpdates({
    enabled: false, // Disabled to prevent rate limiting - use manual refresh instead
    interval: 5 * 60 * 1000, // 5 minutes
    onUpdate: async () => {
      await refreshAllStories();
    },
  });

  const filterStories = (stories: StoryChain[]) => {
    return stories.filter(
      (story) =>
        story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        story.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handleCreateStory = () => {
    setShowCreateModal(true);
  };

  const handleSubmitNewStory = async () => {
    if (!newStoryTitle.trim() || !user) {
      Alert.alert('Error', 'Please enter a story title');
      return;
    }

    if (isProcessing || isUploading) {
      return; // Prevent double submission
    }

    try {
      // Create story metadata for IPFS
      const storyMetadata = {
        storyId: Date.now().toString(), // Temporary ID for metadata
        title: newStoryTitle.trim(),
        description:
          newStoryDescription.trim() || 'A collaborative voice story',
        category: selectedCategory,
        coverArt: selectedEmoji,
        maxBlocks: parseInt(maxBlocks) || 10,
        bountyStx: bountyStx ? parseFloat(bountyStx) : 0,
        votingWindowHours: parseInt(votingWindowHours) || 24,
        creatorUsername: user.username,
        creatorAddress: user.walletAddress,
        createdAt: new Date().toISOString(),
        type: 'story-metadata',
      };

      // Upload metadata to IPFS first
      const ipfsResult = await uploadMetadata(
        storyMetadata,
        `story-metadata-${Date.now()}.json`
      );

      if (!ipfsResult) {
        Alert.alert(
          'IPFS Upload Failed',
          'Could not upload story metadata to IPFS. Please try again.'
        );
        return;
      }

      // Create story on blockchain using IPFS hash as prompt
      const blockchainStoryId = await createStoryOnChain(ipfsResult.cid);

      if (!blockchainStoryId) {
        Alert.alert(
          'Blockchain Creation Failed',
          'Could not create story on blockchain. Please try again.'
        );
        return;
      }

      // Create local story data with transaction ID as story ID
      const newStory = {
        id: blockchainStoryId, // Use transaction ID as story ID
        title: newStoryTitle.trim(),
        description: newStoryDescription.trim() || undefined,
        coverArt: selectedEmoji,
        blocks: [],
        maxBlocks: parseInt(maxBlocks) || 10,
        status: 'active' as const,
        category: selectedCategory,
        totalDuration: 0,
        bountyStx: bountyStx ? parseFloat(bountyStx) : undefined,
        votingWindowHours: parseInt(votingWindowHours) || 24,
        creatorUsername: user.username,
        nftMinted: false,
        metadataCid: ipfsResult.cid, // Store IPFS hash
        metadataUrl: ipfsResult.url, // Store gateway URL
      };

      // Add to local store for immediate display
      addStoryChain(newStory);

      // Update user stats
      if (user) {
        updateUser({
          xp: user.xp + 50, // Award XP for creating story
        });
      }

      // Reset form
      setNewStoryTitle('');
      setNewStoryDescription('');
      setSelectedCategory('Mystery');
      setSelectedEmoji('✨');
      setMaxBlocks('10');
      setBountyStx('');
      setVotingWindowHours('24');

      // Close create modal
      setShowCreateModal(false);

      // Provide haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Show success popup
      setResultData({
        success: true,
        title: '🎉 Story Created!',
        message: `Your story "${newStory.title}" has been created on the blockchain and IPFS!`,
        txId: blockchainStoryId,
      });
      setShowResultModal(true);
    } catch (error: any) {
      console.error('Story creation error:', error);

      // Show error popup
      setResultData({
        success: false,
        title: '❌ Creation Failed',
        message: error.message || 'Failed to create story. Please try again.',
      });
      setShowResultModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setNewStoryTitle('');
    setNewStoryDescription('');
    setSelectedCategory('Mystery');
    setSelectedEmoji('✨');
    setMaxBlocks('10');
    setBountyStx('');
    setVotingWindowHours('24');
  };
  useEffect(() => {
    fetchAllStories().then((stories) => {
      setAppStories(stories);
    });
  }, []);
  return (
    <SafeAreaView className="flex-1 bg-background">
      <BackgroundPulse />
      <View className="px-lg pt-lg pb-md items-center relative z-10">
        <Image
          source={require('../../assets/images/Logo.png')}
          className="w-52 h-16 mb-xs"
          resizeMode="contain"
        />
        <Text className="text-body text-text-secondary">
          Collaborative Voice Stories
        </Text>
      </View>

      <View className="flex-row items-center bg-card rounded-md px-md py-sm mx-lg mb-md border border-border">
        <Search size={20} color="#D4A5B8" />
        <TextInput
          className="flex-1 ml-sm text-text-primary text-base"
          placeholder="Search stories..."
          placeholderTextColor="#D4A5B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View className="flex-row justify-between items-center px-lg mb-md">
        <Text className="text-h3 text-text-primary">Active Stories</Text>
        <View className="flex-row items-center">
          <TouchableOpacity
            className="items-center justify-center w-10 h-10 rounded-md mr-sm"
            onPress={refreshAllStories}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-xl">🔃</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-row items-center bg-secondary px-md py-sm rounded-md"
            onPress={handleCreateStory}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text className="text-body text-text-primary font-semibold ml-xs">
              New Story
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {filterStories(appStories).length === 0 ? (
        <View className="flex-1 items-center justify-center px-lg">
          <Text className="text-6xl mb-lg">📚</Text>
          <Text className="text-h2 text-text-primary mb-sm text-center">
            No Stories Yet
          </Text>
          <Text className="text-body text-text-secondary text-center mb-lg px-md">
            {searchQuery
              ? `No stories match "${searchQuery}"`
              : 'Create the first collaborative voice story on the blockchain!'}
          </Text>
          {!searchQuery && (
            <GameButton onPress={handleCreateStory} className="mt-md">
              Create First Story
            </GameButton>
          )}
        </View>
      ) : (
        <FlatList
          data={filterStories(appStories)}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <AnimatedStoryCard
              story={item}
              onPress={() => router.push(`/story/${item.id}`)}
              index={index}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Create Story Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View className="flex-1 justify-end bg-black/50">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="bg-card rounded-t-3xl h-[95%]"
          >
            <View className="flex-row justify-between items-center p-lg border-b border-border">
              <Text className="text-h2 text-text-primary">
                Create New Story
              </Text>
              <TouchableOpacity onPress={handleCloseModal} className="p-sm">
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView
              className="flex-1 p-lg"
              showsVerticalScrollIndicator={false}
            >
              {/* Story Title */}
              <View className="mb-lg">
                <Text className="text-body text-text-primary font-semibold mb-sm">
                  Story Title *
                </Text>
                <TextInput
                  className="bg-background rounded-md px-md py-md text-text-primary text-base border border-border"
                  placeholder="Enter an intriguing title..."
                  placeholderTextColor="#D4A5B8"
                  value={newStoryTitle}
                  onChangeText={setNewStoryTitle}
                />
              </View>

              {/* Story Description */}
              <View className="mb-lg">
                <Text className="text-body text-text-primary font-semibold mb-sm">
                  Description (Optional)
                </Text>
                <TextInput
                  className="bg-background rounded-md px-md py-md text-text-primary text-base border border-border"
                  placeholder="Describe your story's premise or theme..."
                  placeholderTextColor="#D4A5B8"
                  value={newStoryDescription}
                  onChangeText={setNewStoryDescription}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  style={{ minHeight: 80 }}
                />
              </View>

              {/* Category Selection */}
              <View className="mb-lg">
                <Text className="text-body text-text-primary font-semibold mb-sm">
                  Category
                </Text>
                <View className="flex-row flex-wrap gap-sm">
                  {CATEGORIES.map((category) => (
                    <TouchableOpacity
                      key={category}
                      onPress={() => setSelectedCategory(category)}
                      className={`px-md py-sm rounded-full border ${
                        selectedCategory === category
                          ? 'bg-primary border-primary'
                          : 'bg-transparent border-border'
                      }`}
                    >
                      <Text
                        className={`text-body ${
                          selectedCategory === category
                            ? 'text-background font-bold'
                            : 'text-text-secondary'
                        }`}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Cover Emoji */}
              <View className="mb-lg">
                <Text className="text-body text-text-primary font-semibold mb-sm">
                  Cover Art
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="flex-row gap-sm"
                >
                  {COVER_EMOJIS.map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      onPress={() => setSelectedEmoji(emoji)}
                      className={`w-16 h-16 items-center justify-center rounded-lg border-2 ${
                        selectedEmoji === emoji
                          ? 'bg-primary border-primary'
                          : 'bg-background border-border'
                      }`}
                    >
                      <Text className="text-4xl">{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Max Blocks */}
              <View className="mb-lg">
                <Text className="text-body text-text-primary font-semibold mb-sm">
                  Maximum Voice Blocks
                </Text>
                <TextInput
                  className="bg-background rounded-md px-md py-md text-text-primary text-base border border-border"
                  placeholder="10"
                  placeholderTextColor="#D4A5B8"
                  value={maxBlocks}
                  onChangeText={setMaxBlocks}
                  keyboardType="number-pad"
                />
                <Text className="text-caption text-text-secondary mt-xs">
                  Story will seal after this many contributions (or 120 seconds
                  total)
                </Text>
              </View>

              {/* Voting Window */}
              <View className="mb-lg">
                <Text className="text-body text-text-primary font-semibold mb-sm">
                  Voting Window (Hours)
                </Text>
                <TextInput
                  className="bg-background rounded-md px-md py-md text-text-primary text-base border border-border"
                  placeholder="24"
                  placeholderTextColor="#D4A5B8"
                  value={votingWindowHours}
                  onChangeText={setVotingWindowHours}
                  keyboardType="number-pad"
                />
                <Text className="text-caption text-text-secondary mt-xs">
                  Time allowed for community to vote on each voice block
                  submission
                </Text>
              </View>

              {/* Bounty in STX */}
              <View className="mb-lg">
                <Text className="text-body text-text-primary font-semibold mb-sm">
                  Bounty in STX (Optional)
                </Text>
                <View className="flex-row items-center bg-background rounded-md border border-border">
                  <View className="px-md py-md bg-secondary/20 border-r border-border">
                    <Text className="text-body text-text-primary font-bold">
                      STX
                    </Text>
                  </View>
                  <TextInput
                    className="flex-1 px-md py-md text-text-primary text-base"
                    placeholder="0.00"
                    placeholderTextColor="#D4A5B8"
                    value={bountyStx}
                    onChangeText={setBountyStx}
                    keyboardType="decimal-pad"
                  />
                </View>
                <Text className="text-caption text-text-secondary mt-xs">
                  Optional reward pool for contributors. Will be split among
                  participants.
                </Text>
              </View>

              {/* Info Box */}
              <View className="bg-secondary/20 rounded-lg p-md mb-lg border border-secondary/30">
                <Text className="text-body text-text-primary font-semibold mb-xs">
                  💡 How it works
                </Text>
                <Text className="text-caption text-text-secondary leading-5">
                  Create a story starter and let the community build on it! Each
                  person adds a 15-30 second voice recording to continue the
                  narrative. The community votes during the voting window to
                  select the best continuation. The story seals when it reaches
                  the maximum blocks or 2 minutes total duration. Optional
                  bounties incentivize high-quality contributions!
                </Text>
              </View>
            </ScrollView>

            {/* Footer Buttons */}
            <View className="p-lg border-t border-border gap-md">
              <GameButton
                title={
                  isUploading
                    ? 'Uploading to IPFS...'
                    : isProcessing
                    ? 'Creating on Blockchain...'
                    : 'Create Story'
                }
                onPress={handleSubmitNewStory}
                disabled={!newStoryTitle.trim() || isUploading || isProcessing}
                loading={isUploading || isProcessing}
                size="large"
                variant="accent"
                className="w-full"
              />
              <GameButton
                title="Cancel"
                onPress={handleCloseModal}
                variant="outline"
                size="medium"
                className="w-full"
                glow={false}
              />
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Game-Style Result Popup Modal */}
      <Modal
        visible={showResultModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowResultModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/90 px-lg">
          <View
            className={`rounded-3xl p-xl w-full max-w-md border-4 ${
              resultData?.success
                ? 'bg-gradient-to-br from-accent/20 to-secondary/20 border-accent'
                : 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border-red-500'
            }`}
            style={{
              shadowColor: resultData?.success ? '#00FFFF' : '#FF0000',
              shadowOffset: { width: 0, height: 0 },
              shadowRadius: 30,
              shadowOpacity: 0.8,
            }}
          >
            {/* Animated Icon */}
            <View className="items-center mb-lg">
              <View
                className={`w-32 h-32 rounded-full items-center justify-center mb-md ${
                  resultData?.success
                    ? 'bg-accent/30 border-4 border-accent'
                    : 'bg-red-500/30 border-4 border-red-500'
                }`}
                style={{
                  shadowColor: resultData?.success ? '#00FFFF' : '#FF0000',
                  shadowOffset: { width: 0, height: 0 },
                  shadowRadius: 20,
                  shadowOpacity: 1,
                }}
              >
                <Text className="text-7xl">
                  {resultData?.success ? '🎉' : '💥'}
                </Text>
              </View>
            </View>

            {/* Title */}
            <Text
              className={`text-h1 text-center mb-md font-bold ${
                resultData?.success ? 'text-accent' : 'text-red-500'
              }`}
            >
              {resultData?.title}
            </Text>

            {/* Message */}
            <Text className="text-body text-text-primary text-center mb-lg leading-6">
              {resultData?.message}
            </Text>

            {/* Transaction ID (for success) */}
            {resultData?.success && resultData?.txId && (
              <View className="bg-background/50 rounded-xl p-md mb-lg border border-accent/30">
                <Text className="text-caption text-text-secondary text-center mb-xs">
                  Transaction ID
                </Text>
                <Text
                  className="text-small text-accent font-mono text-center"
                  numberOfLines={1}
                >
                  {resultData.txId.substring(0, 8)}...
                  {resultData.txId.substring(resultData.txId.length - 6)}
                </Text>
              </View>
            )}

            {/* XP Earned (for success) */}
            {resultData?.success && (
              <View className="bg-secondary/20 rounded-xl p-md mb-lg border border-secondary/30">
                <Text className="text-h3 text-secondary text-center font-bold">
                  +50 XP
                </Text>
                <Text className="text-caption text-text-secondary text-center">
                  Experience Points Earned!
                </Text>
              </View>
            )}

            {/* Action Button */}
            <GameButton
              title={resultData?.success ? 'Awesome!' : 'Try Again'}
              onPress={() => setShowResultModal(false)}
              size="large"
              variant={resultData?.success ? 'accent' : 'secondary'}
              className="w-full"
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
