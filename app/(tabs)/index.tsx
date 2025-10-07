import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Search } from 'lucide-react-native';
import { theme } from '../../constants/theme';
import { StoryCard } from '../../components/StoryCard';
import { useAppStore } from '../../store/useAppStore';

export default function HomeScreen() {
  const router = useRouter();
  const { storyChains, addStoryChain } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStories = storyChains.filter((story) =>
    story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    story.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateStory = () => {
    const newStory = {
      id: Date.now().toString(),
      title: 'New Story Arc',
      coverArt: '✨',
      blocks: [],
      maxBlocks: 10,
      status: 'active' as const,
      category: 'Mystery',
      totalDuration: 0,
    };
    addStoryChain(newStory);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>EchoChain</Text>
        <Text style={styles.subtitle}>Collaborative Voice Stories</Text>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search stories..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Active Stories</Text>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateStory}>
          <Plus size={20} color={theme.colors.text} />
          <Text style={styles.createButtonText}>New Story</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredStories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <StoryCard story={item} onPress={() => router.push(`/story/${item.id}`)} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    color: theme.colors.text,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  filterLabel: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  createButtonText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
});
