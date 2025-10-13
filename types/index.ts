export interface VoiceBlock {
  id: string;
  username: string;
  audioUri: string;
  audioCid?: string; // IPFS hash for audio
  metadataCid?: string; // IPFS hash for metadata
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
  metadataCid?: string; // IPFS hash for story metadata
  metadataUrl?: string; // IPFS gateway URL for metadata

  // Blockchain-specific fields (from Clarity contract)
  creator?: string; // Creator's principal address
  createdAt?: number; // Block height when story was created
  totalBlocks?: number; // Number of finalized blocks in the story chain
  currentRound?: number; // Current voting round number

  // IPFS-specific fields
  ipfsHash?: string | null; // IPFS hash from blockchain prompt
  ipfsMetadata?: any; // Parsed IPFS metadata
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
