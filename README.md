# SoniChain - Collaborative Voice Stories

A React Native mobile application built with Expo that enables users to collaboratively create voice-based story chains. Users can contribute voice recordings, vote on submissions, and build immersive audio narratives together.

## 🌟 **What is SoniChain?**

SoniChain is a **revolutionary collaborative storytelling platform** that transforms the way people create and share stories. Built on the **Stacks blockchain** with **IPFS decentralized storage**, it combines the power of voice, community, and blockchain technology to create an entirely new form of digital storytelling.

### **🎯 Core Concept**

Imagine a world where stories aren't written by a single author, but **co-created by a community** through voice recordings. Each person adds their voice to continue the narrative, creating a living, breathing story that evolves with every contribution.

**How it works:**

1. **Start a Story** - Someone creates an opening prompt or beginning
2. **Community Contributes** - Others add 15-30 second voice recordings to continue the story
3. **Community Votes** - Everyone votes on the best continuation for each part
4. **Story Evolves** - The winning contributions become part of the final narrative
5. **NFT Rewards** - Contributors earn blockchain rewards and NFTs for participation

### **🚀 Key Benefits**

#### **For Story Creators:**

- **💰 Earn Rewards** - Get paid in STX tokens for quality contributions
- **🏆 NFT Recognition** - Receive unique NFTs for winning submissions
- **🎭 Creative Expression** - Share your voice and storytelling talent
- **📈 Build Reputation** - Gain XP and unlock achievements
- **🌟 Community Recognition** - Get voted as the best contributor

#### **For Story Listeners:**

- **🎧 Immersive Experience** - Listen to stories told by real human voices
- **🔄 Infinite Variety** - Every story is unique based on community choices
- **⚡ Real-time Updates** - Stories evolve live as people contribute
- **🎮 Gamified Experience** - Vote, earn XP, and unlock achievements
- **🌍 Global Community** - Connect with storytellers worldwide

#### **For the Platform:**

- **🔗 Blockchain Security** - All data is immutable and transparent
- **🌐 Decentralized Storage** - Audio files stored on IPFS, not centralized servers
- **⚡ Instant Payments** - Automatic reward distribution via smart contracts
- **🎯 Quality Control** - Community voting ensures only the best content wins
- **📱 Mobile-First** - Optimized for mobile voice recording and listening

### **🎮 How to Use SoniChain**

#### **Getting Started (5 minutes):**

1. **Download & Install** - Get the app from your app store
2. **Create Wallet** - Set up your Stacks wallet (automatic)
3. **Choose Username** - Pick your storyteller identity
4. **Start Exploring** - Browse active stories or create your own

#### **Contributing to Stories:**

1. **Browse Active Stories** - Find stories you want to contribute to
2. **Listen to Context** - Hear the story so far
3. **Record Your Part** - Add a 15-30 second voice recording
4. **Submit & Wait** - Your submission goes to community voting
5. **Earn Rewards** - Get STX tokens and NFTs if your contribution wins

#### **Creating Your Own Story:**

1. **Tap "New Story"** - Create a new story chain
2. **Set the Scene** - Write a prompt or record an opening
3. **Configure Rules** - Set max contributors, voting time, bounty amount
4. **Launch** - Your story goes live for the community
5. **Manage** - Moderate submissions and finalize rounds

#### **Voting & Rewards:**

1. **Review Submissions** - Listen to all voice contributions
2. **Vote for Best** - Choose your favorite continuation
3. **Earn XP** - Get experience points for participating
4. **Unlock Achievements** - Collect badges for milestones
5. **Track Progress** - See your contribution history and earnings

### **💡 Why SoniChain Matters**

#### **Revolutionary Storytelling:**

- **First-of-its-kind** voice-based collaborative storytelling platform
- **Democratizes creativity** - anyone can contribute, not just writers
- **Real human voices** create more emotional connections than text
- **Community-driven quality** through voting mechanisms

#### **Blockchain Innovation:**

- **Transparent rewards** - all payments are public and verifiable
- **Immutable stories** - once created, stories can't be censored or deleted
- **Decentralized ownership** - no single entity controls the platform
- **Global accessibility** - works anywhere with internet connection

#### **Economic Opportunity:**

- **Monetize creativity** - earn real money for storytelling talent
- **Fair compensation** - smart contracts ensure automatic payments
- **NFT collectibles** - unique digital assets for achievements
- **Growing economy** - as platform grows, rewards increase

#### **Community Building:**

- **Global collaboration** - connect with storytellers worldwide
- **Shared experiences** - create memories through collaborative stories
- **Skill development** - improve storytelling and voice acting abilities
- **Social recognition** - gain reputation through quality contributions

### **🎯 Perfect For:**

- **Aspiring Voice Actors** - Practice and showcase talent
- **Storytelling Enthusiasts** - Share creative narratives
- **Blockchain Enthusiasts** - Experience Web3 applications
- **Content Creators** - Monetize voice-based content
- **Community Builders** - Connect through collaborative creation
- **NFT Collectors** - Earn unique storytelling NFTs
- **Mobile Users** - Optimized for smartphone storytelling

### **🌟 The Future of Storytelling**

SoniChain represents the **next evolution** of storytelling:

- **From Text to Voice** - More emotional and engaging
- **From Individual to Community** - Collective creativity
- **From Static to Dynamic** - Stories that evolve in real-time
- **From Free to Rewarded** - Monetized creative contributions
- **From Centralized to Decentralized** - User-owned platform

**Join the storytelling revolution and be part of creating the future of collaborative narrative creation!**

---

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

### ✅ **FULLY INTEGRATED - Production Ready!**

The app is **100% integrated** with Stacks blockchain using the Sonichain Clarity smart contract. All core features interact directly with the blockchain.

### **Integration Status**

- ✅ **User Registration**: Register username on blockchain
- ✅ **Story Creation**: Create stories with IPFS metadata stored on-chain
- ✅ **Audio Submission**: Submit voice blocks to blockchain with IPFS hashes
- ✅ **Voting System**: Vote on submissions with blockchain consensus
- ✅ **Round Finalization**: Select winners and mint NFTs
- ✅ **Bounty System**: Fund bounties and distribute rewards
- ✅ **Story Sealing**: Finalize stories and distribute funds
- ✅ **Data Caching**: Reduce blockchain calls with smart caching
- ✅ **Real-time Updates**: Auto-sync with blockchain every 30s
- ✅ **Error Handling**: Comprehensive error handling with retry logic

### **Architecture**

```
┌─────────────────────────────────────────┐
│     UI Layer (React Native)             │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│     Hooks Layer                         │
│  • useContract   • useStories           │
│  • useUserData   • useCache             │
│  • usePinata     • useRealTimeUpdates   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│     Utilities                           │
│  • contract-utils  • errorHandler       │
│  • stx-utils       • validation         │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│     External Services                   │
│  • Stacks Blockchain (Clarity)          │
│  • IPFS/Pinata (Audio Storage)          │
│  • AsyncStorage (Local Cache)           │
└─────────────────────────────────────────┘
```

### **File Structure**

```
lib/
├── contract-config.ts        # ✅ Contract configuration & constants
├── contract-utils.ts         # ✅ All contract functions
├── stx-utils.ts             # ✅ STX utilities
└── pinata-config.ts         # ✅ IPFS configuration

hooks/
├── useContract.ts           # ✅ Contract interactions
├── useUserData.ts           # ✅ User blockchain data
├── useStories.ts            # ✅ Story blockchain data
├── useCache.ts              # ✅ Data caching
├── useRealTimeUpdates.ts    # ✅ Auto-sync
├── useTransactionTracking.ts # ✅ Transaction history
└── usePinata.ts             # ✅ IPFS uploads

contexts/
└── WalletContext.tsx        # ✅ Wallet management

utils/
├── errorHandler.ts          # ✅ Error handling
└── validation.ts            # ✅ Validation utilities
```

### **Quick Setup**

#### **1. Contract Configuration**

Update `lib/contract-config.ts`:

```typescript
CONTRACT_ADDRESS: 'YOUR_DEPLOYED_CONTRACT',
CONTRACT_NAME: 'Sonichain',
NETWORK: STACKS_TESTNET, // or STACKS_MAINNET
```

#### **2. IPFS Configuration**

Create `.env` file:

```env
EXPO_PUBLIC_PINATA_JWT=your_jwt_here
EXPO_PUBLIC_PINATA_GATEWAY=your-gateway.mypinata.cloud
```

#### **3. Run the App**

```bash
npm install
npm run dev
```

### **Example Usage**

#### **Register User**

```typescript
const { registerUserOnChain } = useContract();
const txId = await registerUserOnChain('alice');
```

#### **Create Story**

```typescript
const { createStoryOnChain } = useContract();
const { uploadMetadata } = usePinata();

// Upload metadata to IPFS
const ipfs = await uploadMetadata(metadata, 'story.json');

// Create on blockchain
const txId = await createStoryOnChain(ipfs.cid);
```

#### **Submit Audio**

```typescript
const { submitBlockOnChain } = useContract();
const { uploadAudioWithMetadata } = usePinata();

// Upload audio to IPFS
const ipfs = await uploadAudioWithMetadata(
  uri,
  metadata,
  'audio.m4a',
  'meta.json'
);

// Submit to blockchain
const txId = await submitBlockOnChain(storyId, ipfs.audioCid);
```

#### **Vote**

```typescript
const { voteOnChain, checkHasVoted } = useContract();

// Check if already voted
const hasVoted = await checkHasVoted(storyId, roundNum, address);

if (!hasVoted) {
  const txId = await voteOnChain(submissionId);
}
```

### **Documentation**

- 📖 `CONTRACT_INTEGRATION_README.md` - Complete integration docs
- 📖 `CONTRACT_INTEGRATION_GUIDE.md` - Step-by-step integration guide
- 📖 `DEPLOYMENT_CHECKLIST.md` - Pre-deployment validation
- 📖 `PINATA_SETUP.md` - IPFS setup guide

### **Testing**

```bash
# Run integration validation
npm run validate-integration

# Run tests
npm test
```

See `CONTRACT_INTEGRATION_README.md` for complete blockchain integration documentation.

## 📦 IPFS Integration (Pinata)

The project includes complete Pinata/IPFS integration for decentralized audio storage:

### Structure

```
lib/
└── pinata-config.ts          # Pinata JWT, gateway config

hooks/
└── usePinata.ts             # Hook for IPFS uploads
```

### Quick Setup

1. **Create Pinata account** at https://app.pinata.cloud
2. **Get API key (JWT)** from dashboard → API Keys
3. **Get gateway URL** from dashboard → Gateways
4. **Add to environment**:
   ```bash
   EXPO_PUBLIC_PINATA_JWT=your_jwt_here
   EXPO_PUBLIC_PINATA_GATEWAY=your-gateway.mypinata.cloud
   ```

### Example Usage

```typescript
import { usePinata } from '@/hooks/usePinata';

const { uploadAudio, uploadMetadata, isUploading } = usePinata();

// Upload audio to IPFS
const result = await uploadAudio(audioUri, 'recording.m4a');
console.log('IPFS CID:', result.cid);
console.log('Gateway URL:', result.url);

// Upload with metadata
const ipfsData = await uploadAudioWithMetadata(audioUri, {
  storyId: '123',
  username: 'alice',
  duration: 30,
  timestamp: new Date().toISOString(),
});

// Store CID on blockchain
await submitBlockOnChain(storyId, ipfsData.audioCid);
```

See `PINATA_SETUP.md` for complete documentation and examples.

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
