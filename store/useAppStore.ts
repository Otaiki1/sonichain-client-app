import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, StoryChain, Badge } from '../types';
import { defaultUser, mockBadges } from '../utils/mockData'; // Only keep mockBadges for badge structure
import { CONTRACT_CONFIG } from '../lib/contract-config';

interface AppState {
  user: User | null;
  storyChains: StoryChain[];
  hasCompletedOnboarding: boolean;
  isLoading: boolean;

  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  addXP: (amount: number) => void;
  unlockBadge: (badgeId: string) => void;
  setHasCompletedOnboarding: (value: boolean) => void;
  addStoryChain: (story: StoryChain) => void;
  updateStoryChain: (storyId: string, updates: Partial<StoryChain>) => void;
  setStoryChains: (stories: StoryChain[]) => void;
  addVoiceBlock: (storyId: string, block: any) => void;
  initializeData: () => Promise<void>;
  saveData: () => Promise<void>;
  resetData: () => Promise<void>;
}

// PRODUCTION MODE: Always empty - blockchain stories only!
export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  storyChains: [], // ✅ PRODUCTION: Empty array - blockchain data ONLY
  hasCompletedOnboarding: false,
  isLoading: true,

  setUser: (user) => {
    set({ user });
    get().saveData();
  },

  updateUser: (updates) => {
    const currentUser = get().user;
    if (currentUser) {
      set({ user: { ...currentUser, ...updates } });
      get().saveData();
    }
  },

  addXP: (amount) => {
    const currentUser = get().user;
    if (currentUser) {
      const newXP = currentUser.xp + amount;
      const newLevel = Math.floor(newXP / 100) + 1;

      set({
        user: {
          ...currentUser,
          xp: newXP,
          level: newLevel,
        },
      });
      get().saveData();
    }
  },

  unlockBadge: (badgeId) => {
    const currentUser = get().user;
    if (currentUser) {
      const updatedBadges = currentUser.badges.map((badge) =>
        badge.id === badgeId
          ? { ...badge, unlocked: true, unlockedAt: new Date().toISOString() }
          : badge
      );

      set({
        user: {
          ...currentUser,
          badges: updatedBadges,
        },
      });
      get().saveData();
    }
  },

  setHasCompletedOnboarding: (value) => {
    set({ hasCompletedOnboarding: value });
    get().saveData();
  },

  addStoryChain: (story) => {
    set((state) => ({
      storyChains: [...state.storyChains, story],
    }));
    get().saveData();
  },

  updateStoryChain: (storyId, updates) => {
    set((state) => {
      const existingIndex = state.storyChains.findIndex(
        (chain) => chain.id === storyId
      );

      if (existingIndex >= 0) {
        // Update existing story
        const updatedChains = [...state.storyChains];
        updatedChains[existingIndex] = {
          ...updatedChains[existingIndex],
          ...updates,
        };
        return { storyChains: updatedChains };
      } else {
        // Add new story if it doesn't exist
        return { storyChains: [...state.storyChains, updates as StoryChain] };
      }
    });
    get().saveData();
  },

  setStoryChains: (stories) => {
    console.log(`📚 Setting ${stories.length} stories in store`);
    set({ storyChains: stories });
    get().saveData();
  },

  addVoiceBlock: (storyId, block) => {
    set((state) => ({
      storyChains: state.storyChains.map((chain) => {
        if (chain.id === storyId) {
          const newBlocks = [...chain.blocks, block];
          const newTotalDuration = newBlocks.reduce(
            (sum, b) => sum + b.duration,
            0
          );
          const shouldSeal =
            newBlocks.length >= chain.maxBlocks || newTotalDuration >= 120;

          return {
            ...chain,
            blocks: newBlocks,
            totalDuration: newTotalDuration,
            status: shouldSeal ? 'sealed' : 'active',
          };
        }
        return chain;
      }),
    }));
    get().saveData();
  },

  initializeData: async () => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      const onboardingJson = await AsyncStorage.getItem(
        'hasCompletedOnboarding'
      );
      const storyChainsJson = await AsyncStorage.getItem('storyChains');

      const user = userJson ? JSON.parse(userJson) : null;
      const hasCompletedOnboarding = onboardingJson === 'true';

      // PRODUCTION: Load ONLY blockchain stories from cache
      // No mock data ever!
      let storyChains: StoryChain[] = [];

      if (storyChainsJson) {
        const parsed = JSON.parse(storyChainsJson);
        // Filter: Only blockchain stories (have creator field or numeric IDs)
        storyChains = parsed.filter(
          (story: StoryChain) =>
            story.creator || // Has creator from blockchain
            (story.id && /^\d+$/.test(story.id)) // Numeric ID from blockchain
        );
        console.log(
          `🔄 Loaded ${storyChains.length} blockchain stories from cache`
        );
      }

      set({
        user,
        hasCompletedOnboarding,
        storyChains,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load data:', error);
      set({ isLoading: false });
    }
  },

  saveData: async () => {
    try {
      const { user, hasCompletedOnboarding, storyChains } = get();

      if (user) {
        await AsyncStorage.setItem('user', JSON.stringify(user));
      }
      await AsyncStorage.setItem(
        'hasCompletedOnboarding',
        String(hasCompletedOnboarding)
      );
      await AsyncStorage.setItem('storyChains', JSON.stringify(storyChains));
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  },

  resetData: async () => {
    try {
      await AsyncStorage.clear();
      set({
        user: null,
        storyChains: [], // ✅ PRODUCTION: Empty - blockchain will populate
        hasCompletedOnboarding: false,
        isLoading: false,
      });
      console.log('✅ PRODUCTION: Data reset - ready for blockchain stories');
    } catch (error) {
      console.error('Failed to reset data:', error);
    }
  },
}));
