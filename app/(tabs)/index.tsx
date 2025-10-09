import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Search, X } from 'lucide-react-native';
import { StoryCard } from '../../components/StoryCard';
import { Button } from '../../components/Button';
import { useAppStore } from '../../store/useAppStore';

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
  const { storyChains, addStoryChain, user } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStoryTitle, setNewStoryTitle] = useState('');
  const [newStoryDescription, setNewStoryDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Mystery');
  const [selectedEmoji, setSelectedEmoji] = useState('✨');
  const [maxBlocks, setMaxBlocks] = useState('10');
  const [bountyStx, setBountyStx] = useState('');
  const [votingWindowHours, setVotingWindowHours] = useState('24');

  const filteredStories = storyChains.filter(
    (story) =>
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateStory = () => {
    setShowCreateModal(true);
  };

  const handleSubmitNewStory = () => {
    if (!newStoryTitle.trim() || !user) {
      return;
    }

    const newStory = {
      id: Date.now().toString(),
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
    };

    addStoryChain(newStory);

    // Reset form
    setNewStoryTitle('');
    setNewStoryDescription('');
    setSelectedCategory('Mystery');
    setSelectedEmoji('✨');
    setMaxBlocks('10');
    setBountyStx('');
    setVotingWindowHours('24');
    setShowCreateModal(false);
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

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-lg pt-lg pb-md items-center">
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
        <TouchableOpacity
          className="flex-row items-center bg-secondary px-md py-sm rounded-md gap-xs"
          onPress={handleCreateStory}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text className="text-body text-text-primary font-semibold">
            New Story
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredStories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <StoryCard
            story={item}
            onPress={() => router.push(`/story/${item.id}`)}
          />
        )}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      />

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
              <Button
                title="Create Story"
                onPress={handleSubmitNewStory}
                disabled={!newStoryTitle.trim()}
                size="large"
                className="w-full"
              />
              <Button
                title="Cancel"
                onPress={handleCloseModal}
                variant="outline"
                size="medium"
                className="w-full"
              />
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
