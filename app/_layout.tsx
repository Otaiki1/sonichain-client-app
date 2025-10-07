import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useAppStore } from '@/store/useAppStore';

export default function RootLayout() {
  useFrameworkReady();

  const router = useRouter();
  const segments = useSegments();
  const { hasCompletedOnboarding, isLoading, initializeData } = useAppStore();

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inOnboarding = segments[0] === 'onboarding';

    if (!hasCompletedOnboarding && !inOnboarding) {
      router.replace('/onboarding');
    } else if (hasCompletedOnboarding && inOnboarding) {
      router.replace('/(tabs)');
    }
  }, [hasCompletedOnboarding, isLoading, segments]);

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
