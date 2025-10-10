import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Image } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useAppStore } from '@/store/useAppStore';
import { WalletProvider, useWallet } from '@/contexts/WalletContext';
import '../global.css';

function RootNavigator() {
  useFrameworkReady();

  const router = useRouter();
  const segments = useSegments();
  const { hasCompletedOnboarding, isLoading, initializeData } = useAppStore();
  const { isLoading: walletLoading } = useWallet();

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    if (isLoading || walletLoading) return;

    const inOnboarding = segments[0] === 'onboarding';

    if (!hasCompletedOnboarding && !inOnboarding) {
      router.replace('/onboarding');
    } else if (hasCompletedOnboarding && inOnboarding) {
      router.replace('/(tabs)');
    }
  }, [hasCompletedOnboarding, isLoading, walletLoading, segments]);

  // Show loading screen while initializing
  if (isLoading || walletLoading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <Image
          source={require('../assets/images/Logo.png')}
          className="w-64 h-40 mb-xl"
          resizeMode="contain"
        />
        <View className="w-16 h-16 rounded-full bg-primary/20 justify-center items-center">
          <ActivityIndicator size="large" color="#FF2E63" />
        </View>
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="story/[id]" />
        <Stack.Screen name="record/[storyId]" />
        <Stack.Screen name="voting/[storyId]" />
        <Stack.Screen name="sealed/[storyId]" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}

export default function RootLayout() {
  return (
    <WalletProvider>
      <RootNavigator />
    </WalletProvider>
  );
}
