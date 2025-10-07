import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mic, Link, Award } from 'lucide-react-native';
import { theme } from '../constants/theme';
import { Button } from '../components/Button';
import { useAppStore } from '../store/useAppStore';
import { defaultUser, mockBadges } from '../utils/mockData';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    icon: Mic,
    title: 'Record Your Voice',
    description: 'Create short 15-30 second voice memos to continue stories',
  },
  {
    id: '2',
    icon: Link,
    title: 'Chain Stories Together',
    description: 'Each voice memo becomes a new block in a collaborative story chain',
  },
  {
    id: '3',
    icon: Award,
    title: 'Earn Rewards',
    description: 'Gain XP, unlock badges, and level up as you create and vote',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [username, setUsername] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const { setUser, setHasCompletedOnboarding } = useAppStore();

  const isLastSlide = currentIndex === slides.length;

  const handleNext = () => {
    if (currentIndex < slides.length) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleGetStarted = () => {
    if (username.trim()) {
      const newUser = {
        ...defaultUser,
        username: username.trim(),
        badges: mockBadges,
      };
      setUser(newUser);
      setHasCompletedOnboarding(true);
      router.replace('/(tabs)');
    }
  };

  const renderSlide = ({ item }: { item: typeof slides[0] }) => {
    const Icon = item.icon;
    return (
      <View style={styles.slide}>
        <View style={styles.iconContainer}>
          <Icon size={80} color={theme.colors.primary} strokeWidth={1.5} />
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    );
  };

  const renderUsernameSlide = () => (
    <View style={styles.slide}>
      <View style={styles.iconContainer}>
        <Text style={styles.emoji}>🎤</Text>
      </View>
      <Text style={styles.title}>Choose Your Name</Text>
      <Text style={styles.description}>What should we call you?</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter username"
        placeholderTextColor={theme.colors.textSecondary}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <FlatList
        ref={flatListRef}
        data={[...slides, { id: 'username' }]}
        renderItem={({ item }) =>
          item.id === 'username' ? renderUsernameSlide() : renderSlide({ item: item as any })
        }
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerStyle={styles.flatListContent}
      />

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {[...slides, { id: 'username' }].map((_, index) => (
            <View
              key={index}
              style={[styles.dot, index === currentIndex && styles.activeDot]}
            />
          ))}
        </View>

        {isLastSlide ? (
          <Button
            title="Get Started"
            onPress={handleGetStarted}
            disabled={!username.trim()}
            size="large"
            style={styles.button}
          />
        ) : (
          <Button title="Next" onPress={handleNext} size="large" style={styles.button} />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flatListContent: {
    flexGrow: 1,
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  emoji: {
    fontSize: 80,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  input: {
    width: '100%',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.xl,
    color: theme.colors.text,
    fontSize: 18,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  footer: {
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.border,
  },
  activeDot: {
    width: 24,
    backgroundColor: theme.colors.primary,
  },
  button: {
    width: '100%',
  },
});
