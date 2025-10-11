# SoniChain - Collaborative Voice Stories

A React Native mobile application built with Expo that enables users to collaboratively create voice-based story chains. Users can contribute voice recordings, vote on submissions, and build immersive audio narratives together.

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [Project Structure](#project-structure)
- [Core Features](#core-features)
- [State Management](#state-management)
- [Navigation Flow](#navigation-flow)
- [Data Models](#data-models)
- [Blockchain Integration](#blockchain-integration-stacks)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Conventions](#coding-conventions)

## 🛠 Tech Stack

### Core Framework

- **React Native** (0.81.4) - Cross-platform mobile development
- **Expo** (54.0.10) - Development platform and tooling
- **React** (19.1.0) - UI library
- **TypeScript** (5.9.2) - Type safety

### Navigation & Routing

- **Expo Router** (6.0.8) - File-based routing system
- **React Navigation** (7.0.14) - Navigation primitives
- **React Navigation Bottom Tabs** (7.2.0) - Tab navigation

### State Management & Persistence

- **Zustand** (5.0.8) - Lightweight state management
- **AsyncStorage** (2.2.0) - Local data persistence

### UI & Media

- **Expo AV** (16.0.7) - Audio/video playback
- **Expo Camera** (17.0.8) - Camera integration
- **Expo Haptics** (15.0.7) - Haptic feedback
- **Expo Blur** (15.0.7) - Blur effects
- **Expo Linear Gradient** (15.0.7) - Gradient components
- **Lucide React Native** (0.544.0) - Icon library
- **Lottie React Native** (7.3.4) - Animation support

### Backend (Prepared)

- **Supabase JS** (2.58.0) - Backend-as-a-Service client (ready for integration)

## 🏗 Project Architecture

### Architecture Pattern

The app follows a **modular, component-based architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────┐
│              UI Layer (Screens)                 │
│     File-based routing with Expo Router         │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│         Component Layer                         │
│   Reusable UI components (StoryCard, etc.)     │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│         State Management (Zustand)              │
│   Global state, business logic, persistence     │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│         Data Layer (AsyncStorage)               │
│   Local persistence, mock data                  │
└─────────────────────────────────────────────────┘
```

### Key Architectural Decisions

1. **File-based Routing**: Uses Expo Router for automatic route generation from file structure
2. **Centralized State**: Single Zustand store (`useAppStore`) manages all global state
3. **Type Safety**: Strict TypeScript types defined in `/types/index.ts`
4. **Design System**: Centralized theme in `/constants/theme.ts`
5. **Component Composition**: Reusable, atomic components with clear props interfaces

## 📁 Project Structure

```
/
├── app/                          # Screens & routing (Expo Router)
│   ├── _layout.tsx              # Root layout with navigation logic
│   ├── onboarding.tsx           # Onboarding screen
│   ├── +not-found.tsx           # 404 screen
│   ├── (tabs)/                  # Tab-based screens (authenticated)
│   │   ├── _layout.tsx          # Tab navigation layout
│   │   ├── index.tsx            # Home screen (story feed)
│   │   └── profile.tsx          # User profile screen
│   ├── story/
│   │   └── [id].tsx             # Story detail view (dynamic route)
│   ├── record/
│   │   └── [storyId].tsx        # Voice recording screen
│   ├── voting/
│   │   └── [storyId].tsx        # Vote on submissions
│   └── sealed/
│       └── [storyId].tsx        # View completed stories
│
├── components/                   # Reusable UI components
│   ├── Button.tsx               # Custom button component
│   ├── StoryCard.tsx            # Story list item display
│   ├── WaveformCard.tsx         # Audio waveform visualization
│   └── XPBar.tsx                # Experience progress bar
│
├── store/                        # State management
│   └── useAppStore.ts           # Zustand store (single source of truth)
│
├── types/                        # TypeScript type definitions
│   └── index.ts                 # All app-wide interfaces
│
├── constants/                    # App-wide constants
│   └── theme.ts                 # Design system (colors, spacing, typography)
│
├── hooks/                        # Custom React hooks
│   └── useFrameworkReady.ts     # Framework initialization hook
│
├── utils/                        # Utility functions & mock data
│   └── mockData.ts              # Development mock data
│
├── assets/                       # Static assets
│   └── images/                  # Icons, images
│
├── app.json                      # Expo configuration
├── package.json                  # Dependencies
└── tsconfig.json                # TypeScript configuration
```

## 🎯 Core Features

### 1. Story Chains (Collaborative Storytelling)

- **Active Stories**: Users browse and contribute to ongoing story chains
- **Voice Blocks**: Each contribution is a voice recording (voice block)
- **Story Limits**: Stories have max blocks (default 10) or max duration (120s)
- **Auto-Sealing**: Stories automatically seal when limits are reached

### 2. User System

- **Onboarding Flow**: First-time user setup
- **XP & Levels**: Gamification with experience points
- **Badges**: Achievement system for milestones
- **Profile**: User stats and contribution history

### 3. Recording & Voting

- **Voice Recording**: Record voice blocks to contribute to stories
- **Voting System**: Community votes on submitted voice blocks
- **Submission Review**: View and vote on multiple submissions

### 4. Story States

- **Active**: Accepting new voice blocks
- **Sealed**: Completed and locked for listening only

## 🗄 State Management

### Zustand Store (`useAppStore`)

The app uses a single Zustand store with the following state slices:

#### State Shape

```typescript
{
  user: User | null,              // Current user data
  storyChains: StoryChain[],      // All story chains
  hasCompletedOnboarding: boolean,// Onboarding status
  isLoading: boolean              // App initialization state
}
```

#### Key Actions

- **User Management**

  - `setUser(user)`: Set current user
  - `updateUser(updates)`: Partial user updates
  - `addXP(amount)`: Add experience points (auto-levels)
  - `unlockBadge(badgeId)`: Unlock achievement badge

- **Story Management**

  - `addStoryChain(story)`: Create new story
  - `updateStoryChain(storyId, updates)`: Update story metadata
  - `addVoiceBlock(storyId, block)`: Add voice block (auto-seals if limits reached)

- **Persistence**

  - `initializeData()`: Load from AsyncStorage on app start
  - `saveData()`: Persist to AsyncStorage (auto-called after mutations)

- **Onboarding**
  - `setHasCompletedOnboarding(value)`: Update onboarding status

### Persistence Strategy

All state changes are automatically persisted to AsyncStorage:

- User data → `user` key
- Story chains → `storyChains` key
- Onboarding status → `hasCompletedOnboarding` key

Data is loaded on app initialization and saved after every mutation.

## 🧭 Navigation Flow

### Route Structure

```
Root (_layout.tsx)
├── onboarding              [Public]
└── (tabs)                  [Protected - requires onboarding]
    ├── index (Home)
    ├── profile
    └── [Modal routes]
        ├── story/[id]
        ├── record/[storyId]
        ├── voting/[storyId]
        └── sealed/[storyId]
```

### Navigation Guards

The root layout (`app/_layout.tsx`) implements navigation guards:

```typescript
// Redirect logic in useEffect
if (!hasCompletedOnboarding && !inOnboarding) {
  router.replace('/onboarding');
} else if (hasCompletedOnboarding && inOnboarding) {
  router.replace('/(tabs)');
}
```

### Tab Navigation

Two main tabs (defined in `app/(tabs)/_layout.tsx`):

1. **Home** (`index.tsx`) - Browse and search story chains
2. **Profile** (`profile.tsx`) - User stats and achievements

### Dynamic Routes

- `story/[id]` - View story details with parameter `id`
- `record/[storyId]` - Record voice block for story `storyId`
- `voting/[storyId]` - Vote on submissions for story `storyId`
- `sealed/[storyId]` - Listen to completed story `storyId`

## 📊 Data Models

### Core Types (from `/types/index.ts`)

#### VoiceBlock

```typescript
{
  id: string;              // Unique identifier
  username: string;        // Contributor username
  audioUri: string;        // Audio file URI
  duration: number;        // Duration in seconds
  timestamp: string;       // ISO 8601 timestamp
  votes?: number;          // Vote count (optional)
}
```

#### StoryChain

```typescript
{
  id: string;              // Unique identifier
  title: string;           // Story title
  coverArt: string;        // Emoji/icon
  blocks: VoiceBlock[];    // Voice contributions
  maxBlocks: number;       // Maximum blocks allowed
  status: 'active' | 'sealed';
  category: string;        // Genre/category
  totalDuration: number;   // Total duration in seconds
}
```

#### User

```typescript
{
  username: string;
  xp: number;                    // Experience points
  level: number;                 // User level (xp / 100 + 1)
  totalVotes: number;            // Votes cast
  totalRecordings: number;       // Voice blocks recorded
  badges: Badge[];               // Unlocked achievements
  contributedStories: string[];  // Story IDs contributed to
}
```

#### Badge

```typescript
{
  id: string;
  name: string;
  description: string;
  icon: string;            // Emoji
  unlocked: boolean;
  unlockedAt?: string;     // ISO 8601 timestamp
}
```

#### VotingSubmission

```typescript
{
  id: string;
  storyId: string; // Related story
  username: string; // Submitter
  audioUri: string; // Audio file URI
  duration: number;
  votes: number;
}
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for web
npm run build:web

# Type checking
npm run typecheck

# Linting
npm run lint
```

### Development Server

```bash
npm run dev
```

This starts the Expo development server. You can:

- Press `i` to open iOS Simulator
- Press `a` to open Android Emulator
- Press `w` to open in web browser
- Scan QR code with Expo Go app on physical device

## 💻 Development Workflow

### Adding a New Screen

1. Create file in `/app/` directory

   - For tab screen: `/app/(tabs)/new-screen.tsx`
   - For modal: `/app/new-screen.tsx`
   - For dynamic route: `/app/category/[id].tsx`

2. Export default component:

```typescript
export default function NewScreen() {
  return <View>...</View>;
}
```

3. Add to layout if needed (for tab navigation in `(tabs)/_layout.tsx`)

### Adding a New Component

1. Create file in `/components/ComponentName.tsx`
2. Define props interface
3. Export as named export (prefer) or default export

```typescript
interface ComponentNameProps {
  title: string;
  onPress: () => void;
}

export const ComponentName: React.FC<ComponentNameProps> = ({
  title,
  onPress,
}) => {
  return <TouchableOpacity onPress={onPress}>...</TouchableOpacity>;
};
```

### Adding New State

1. Open `/store/useAppStore.ts`
2. Add state to interface:

```typescript
interface AppState {
  newState: YourType;
  setNewState: (value: YourType) => void;
}
```

3. Implement in store:

```typescript
export const useAppStore = create<AppState>((set, get) => ({
  newState: initialValue,
  setNewState: (value) => {
    set({ newState: value });
    get().saveData(); // Auto-persist
  },
}));
```

### Working with Theme

All styling should use the centralized theme from `/constants/theme.ts`:

```typescript
import { theme } from '@/constants/theme';

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
  },
});
```

## 📝 Coding Conventions

### TypeScript

- ✅ Use strict TypeScript types
- ✅ Define interfaces in `/types/index.ts` for shared types
- ✅ Use type inference where obvious
- ❌ Avoid `any` type

### Components

- ✅ Use functional components with hooks
- ✅ Define props interfaces explicitly
- ✅ Use `React.FC<PropsType>` for component types
- ✅ Extract StyleSheet to bottom of file
- ❌ Avoid inline styles except for dynamic values

### File Naming

- **Screens**: PascalCase (e.g., `HomeScreen.tsx`) or lowercase for routes (`index.tsx`)
- **Components**: PascalCase (e.g., `StoryCard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useFrameworkReady.ts`)
- **Utils**: camelCase (e.g., `mockData.ts`)

### Import Order

1. React & React Native
2. Third-party libraries
3. Expo packages
4. Local imports (components, utils, types)
5. Styles

```typescript
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Home } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { StoryCard } from '@/components/StoryCard';
import { useAppStore } from '@/store/useAppStore';
```

### Path Aliases

The project uses `@/` alias for clean imports:

- `@/components` → `/components`
- `@/store` → `/store`
- `@/types` → `/types`
- `@/constants` → `/constants`
- `@/utils` → `/utils`
- `@/hooks` → `/hooks`

### State Management Best Practices

- ✅ Use Zustand store for global state
- ✅ Use local `useState` for component-only state
- ✅ Call `saveData()` after mutations that need persistence
- ✅ Use selectors for derived state

## 🔌 Blockchain Integration (Stacks)

The project has a complete Stacks blockchain integration layer ready for your smart contract:

### Structure

```
lib/
├── contract-config.ts    # Contract address, network settings
├── contract-utils.ts     # Contract function wrappers
├── stx-utils.ts         # Balance, transactions, utilities
└── INTEGRATION_GUIDE.md # Detailed integration guide

hooks/
└── useContract.ts       # Hook for contract interactions

contexts/
└── WalletContext.tsx    # Wallet state management
```

### Quick Setup

1. **Deploy your Clarity smart contract** to Stacks testnet/mainnet
2. **Update `lib/contract-config.ts`** with your contract address and name
3. **Implement your functions** in `lib/contract-utils.ts`
4. **Use in components** via `useContract()` hook

### Example Usage

```typescript
import { useContract } from '@/hooks/useContract';

const { isConnected, address, createStoryOnChain, sendSTX } = useContract();

// Create story on blockchain
await createStoryOnChain('Title', 'Mystery', 10, 5);

// Send STX
await sendSTX('SP1234...', stxToMicroStx(5), 'Bounty payment');
```

See `lib/INTEGRATION_GUIDE.md` for complete documentation.

## 🔌 Backend Integration (Supabase)

The project has Supabase client installed for off-chain data:

1. Configure Supabase in environment variables
2. Create service layer in `/services/`
3. Store audio files, user profiles, and metadata
4. Implement real-time subscriptions for collaborative features

## 📱 Platform Support

- ✅ iOS (primary target)
- ✅ Android (supported)
- ✅ Web (basic support via Expo web)

## 🎨 Design System

The app uses a dark neon theme with energetic pink-cyan colors for a game-like feel:

**Colors:**

- Primary: `#FF2E63` (Hot Pink - sonic pulse energy)
- Secondary: `#FF6B9D` (Neon Pink)
- Accent: `#00FFFF` (Cyan - pulse glow highlight)
- Success: `#28FFBF` (Minty success glow)
- Background: `#1A0E14` (Deep dark plum)
- Card: `#2A1520` (Dark rose)

**Spacing Scale:** 4px, 8px, 16px, 24px, 32px, 48px

**Typography:** System font with weights 400, 600, 700

## 🎮 Game-Like Features

The app includes energetic animations and tactile feedback for an engaging experience:

**Animations:**

- ✨ Pulsing background with sound ripples
- 🌊 Animated waveforms that respond to playback
- 💫 Glowing buttons with gradient pulses
- 🎭 Staggered card entry animations
- ⚡ XP bar with moving cyan particles
- 🎯 Battle-style voting with slide-in animations

**Haptic Feedback:**

- 📱 Medium impact on button presses
- 🎵 Light impact on card taps
- ⚡ Heavy impact on major actions (finalize)
- ✅ Success notifications on achievements

**Sound Effects:**

- 🔊 Tap clicks, success chimes, vote whooshes
- 🎵 Optional (can be disabled)
- 🌐 Web-hosted (no app bloat)

See `GAME_TRANSFORMATION.md` for complete details.

## 🐛 Debugging Tips

- **Check AsyncStorage**: Use React Native Debugger to inspect persisted data
- **Navigation issues**: Check `segments` in root layout for route debugging
- **State not updating**: Ensure `saveData()` is called in store actions
- **Type errors**: Run `npm run typecheck` for full TypeScript validation

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router Docs](https://expo.github.io/router/docs/)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [React Native Docs](https://reactnative.dev/docs/getting-started)

---

**Happy Coding! 🚀**

For questions or issues, please refer to the component-level documentation in the source files.
