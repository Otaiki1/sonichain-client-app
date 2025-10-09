import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mic, Link, Award, UserPlus, LogIn } from 'lucide-react-native';
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
    description:
      'Each voice memo becomes a new block in a collaborative story chain',
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

  const isAuthSlide = currentIndex === slides.length;
  const isUsernameSlide = currentIndex === slides.length + 1;

  const handleNext = () => {
    if (currentIndex < slides.length) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleLogin = () => {
    // TODO: Implement login flow later
    // For now, just navigate to username slide
    flatListRef.current?.scrollToIndex({ index: slides.length + 1 });
    setCurrentIndex(slides.length + 1);
  };

  const handleGetStarted = () => {
    if (username.trim()) {
      // Generate mock wallet data
      const randomWalletAddress = `SP${Math.random()
        .toString(36)
        .substring(2, 15)
        .toUpperCase()}${Math.random()
        .toString(36)
        .substring(2, 9)
        .toUpperCase()}`;
      const randomPrivateKey = Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      const randomBalance = Math.floor(Math.random() * 100) + 10;

      const newUser = {
        ...defaultUser,
        username: username.trim(),
        badges: mockBadges,
        walletAddress: randomWalletAddress,
        privateKey: randomPrivateKey,
        walletBalance: randomBalance,
        profileIcon: '👤',
        nfts: [],
      };
      setUser(newUser);
      setHasCompletedOnboarding(true);
      router.replace('/(tabs)');
    }
  };

  const renderSlide = ({ item }: { item: (typeof slides)[0] }) => {
    const Icon = item.icon;
    return (
      <View
        className="flex-1 justify-center items-center px-xl"
        style={{ width }}
      >
        <View className="w-40 h-40 rounded-full bg-card justify-center items-center mb-xl border-2 border-primary">
          <Icon size={80} color="#FF2E63" strokeWidth={1.5} />
        </View>
        <Text className="text-h1 text-text-primary text-center mb-md">
          {item.title}
        </Text>
        <Text className="text-body text-text-secondary text-center leading-6">
          {item.description}
        </Text>
      </View>
    );
  };

  const renderAuthSlide = () => (
    <View
      className="flex-1 justify-center items-center px-xl"
      style={{ width }}
    >
      <View className="w-full h-50 justify-center items-center mb-xl">
        <Image
          source={require('../assets/images/Logo.png')}
          className="w-64 h-40"
          resizeMode="contain"
        />
      </View>
      <Text className="text-h1 text-text-primary text-center mb-md">
        Welcome to SoniChain
      </Text>
      <Text className="text-body text-text-secondary text-center leading-6">
        Join our community of storytellers and start creating collaborative
        voice stories
      </Text>

      <View className="w-full mt-xl gap-md">
        <Button
          title="Login"
          onPress={handleLogin}
          size="large"
          variant="outline"
          className="w-full hover:bg-primary hover:text-white"
        />
      </View>
    </View>
  );

  const renderUsernameSlide = () => (
    <View
      className="flex-1 justify-center items-center px-xl"
      style={{ width }}
    >
      <View className="w-40 h-40 rounded-full bg-card justify-center items-center mb-xl border-2 border-primary">
        <Text className="text-7xl">🎤</Text>
      </View>
      <Text className="text-h1 text-text-primary text-center mb-md">
        Choose Your Name
      </Text>
      <Text className="text-body text-text-secondary text-center leading-6">
        What should we call you?
      </Text>
      <TextInput
        className="w-full bg-card rounded-md px-md py-md mt-xl text-text-primary text-lg border-2 border-border"
        placeholder="Enter username"
        placeholderTextColor="#D4A5B8"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <FlatList
        ref={flatListRef}
        data={[...slides, { id: 'auth' }, { id: 'username' }]}
        renderItem={({ item }) => {
          if (item.id === 'auth') return renderAuthSlide();
          if (item.id === 'username') return renderUsernameSlide();
          return renderSlide({ item: item as any });
        }}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerStyle={{ flexGrow: 1 }}
      />

      <View className="p-xl pb-xxl">
        <View className="flex-row justify-center items-center mb-lg gap-sm">
          {[...slides, { id: 'auth' }, { id: 'username' }].map((_, index) => (
            <View
              key={index}
              className={`h-2 rounded-full ${
                index === currentIndex ? 'w-6 bg-primary' : 'w-2 bg-border'
              }`}
            />
          ))}
        </View>

        {isUsernameSlide ? (
          <Button
            title="Get Started"
            onPress={handleGetStarted}
            disabled={!username.trim()}
            size="large"
            className="w-full"
          />
        ) : !isAuthSlide ? (
          <Button
            title="Next"
            onPress={handleNext}
            size="large"
            className="w-full"
          />
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}
