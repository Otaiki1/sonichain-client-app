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
  description?: string;
  coverArt: string;
  blocks: VoiceBlock[];
  maxBlocks: number;
  status: 'active' | 'sealed' | 'finalized';
  category: string;
  totalDuration: number;
  bountyStx?: number;
  votingWindowHours?: number;
  creatorUsername?: string;
  nftMinted?: boolean;
  nftId?: string;
}

export interface User {
  username: string;
  xp: number;
  level: number;
  totalVotes: number;
  totalRecordings: number;
  badges: Badge[];
  contributedStories: string[];
  walletAddress?: string;
  walletBalance?: number;
  privateKey?: string;
  profileIcon?: string;
  nfts?: NFT[];
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

export interface NFT {
  id: string;
  storyId: string;
  storyTitle: string;
  coverArt: string;
  mintedTo: string;
  mintedBy: string;
  mintedAt: string;
  audioUri?: string;
}
