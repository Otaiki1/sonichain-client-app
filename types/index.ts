export interface VoiceBlock {
  id: string;
  username: string;
  audioUri: string;
  duration: number;
  timestamp: string;
  votes?: number;
}

export interface StoryChain {
  id: string;
  title: string;
  coverArt: string;
  blocks: VoiceBlock[];
  maxBlocks: number;
  status: 'active' | 'sealed';
  category: string;
  totalDuration: number;
}

export interface User {
  username: string;
  xp: number;
  level: number;
  totalVotes: number;
  totalRecordings: number;
  badges: Badge[];
  contributedStories: string[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface VotingSubmission {
  id: string;
  storyId: string;
  username: string;
  audioUri: string;
  duration: number;
  votes: number;
}
