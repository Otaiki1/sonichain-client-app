import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Clipboard,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  LogOut,
  Copy,
  Eye,
  EyeOff,
  Wallet,
  Image as ImageIcon,
  CheckCircle,
  RefreshCw,
} from 'lucide-react-native';
import { AnimatedXPBar } from '../../components/AnimatedXPBar';
import { Button } from '../../components/Button';
import { GameButton } from '../../components/GameButton';
import { BackgroundPulse } from '../../components/BackgroundPulse';
import { NFTCard } from '../../components/NFTCard';
import { useAppStore } from '../../store/useAppStore';
import { useWallet } from '../../contexts/WalletContext';
import { useNFT } from '../../hooks/useNFT';
import { getStxBalance, microStxToStx } from '../../lib/stx-utils';

const PROFILE_ICONS = [
  '👤',
  '😀',
  '🎭',
  '🎨',
  '🎮',
  '🎸',
  '🚀',
  '🌟',
  '⚡',
  '🔥',
  '💎',
  '👑',
  '🦄',
  '🐉',
  '🦊',
  '🐺',
];

export default function ProfileScreen() {
  const router = useRouter();
  const {
    user,
    storyChains,
    setUser,
    setHasCompletedOnboarding,
    resetData,
    updateUser,
  } = useAppStore();

  const {
    address,
    mnemonic,
    getPrivateKey,
    logout: walletLogout,
  } = useWallet();

  const { nfts, isLoading: isLoadingNFTs, fetchUserNFTs } = useNFT();

  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [showSeedPhraseModal, setShowSeedPhraseModal] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [realBalance, setRealBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch real balance from blockchain
  const fetchBalance = async () => {
    if (!address) return;

    setIsLoadingBalance(true);
    try {
      const balanceInMicroStx = await getStxBalance(address);
      const balanceInStx = microStxToStx(balanceInMicroStx);
      setRealBalance(balanceInStx);

      // Update user's balance in store for offline access
      if (user) {
        updateUser({ walletBalance: balanceInStx });
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      // Don't alert on every error, just log it
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Fetch balance and NFTs on mount and when address changes
  useEffect(() => {
    if (address) {
      fetchBalance();
      fetchUserNFTs();
    }
  }, [address]);

  // Pull to refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchBalance(), fetchUserNFTs()]);
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await walletLogout();
    setUser(null);
    setHasCompletedOnboarding(false);
    router.replace('/onboarding');
  };

  const handleResetData = async () => {
    await walletLogout();
    await resetData();
    router.replace('/onboarding');
  };

  const copyToClipboard = (text: string, type: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied!', `${type} copied to clipboard`);
  };

  const handleIconSelect = (icon: string) => {
    if (user) {
      updateUser({ profileIcon: icon });
      setShowIconPicker(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Text className="text-h2 text-text-primary text-center mt-xxl">
          No user data
        </Text>
      </SafeAreaView>
    );
  }

  const contributedStories = storyChains.filter((story) =>
    story.blocks.some((block) => block.username === user.username)
  );

  // Filter stories created by current user (by blockchain address)
  const createdStories = storyChains.filter((story) => {
    // Compare creator address from blockchain with current user's address
    const creator = (story.creator as any)?.value || story.creator || '';
    const isMatch = creator === address;

    console.log('🔍 Checking story:', {
      storyId: story.id,
      storyTitle: story.title,
      creator: creator,
      currentAddress: address,
      isMatch: isMatch,
    });

    return isMatch;
  });

  console.log('👑 Total created stories:', createdStories.length);
  console.log('📚 Total stories in store:', storyChains.length);
  console.log('🎤 Current user address:', address);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <BackgroundPulse />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF2E63"
            colors={['#FF2E63']}
          />
        }
      >
        <View className="items-center py-xl px-lg">
          <TouchableOpacity
            onPress={() => setShowIconPicker(true)}
            className="w-24 h-24 rounded-full bg-card justify-center items-center mb-md border-2 border-primary"
          >
            <Text className="text-5xl">{user.profileIcon || '👤'}</Text>
          </TouchableOpacity>
          <Text className="text-h1 text-text-primary">{user.username}</Text>
        </View>

        {/* Wallet Section */}
        <View className="px-lg mb-lg">
          <View className="bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg p-md border border-primary/30">
            <View className="flex-row items-center mb-md">
              <Wallet size={20} color="#FF2E63" />
              <Text className="text-body text-text-primary font-bold ml-sm">
                Stacks Wallet
              </Text>
            </View>

            {/* Wallet Address */}
            <View className="mb-sm">
              <Text className="text-caption text-text-secondary mb-xs">
                Wallet Address
              </Text>
              <View className="flex-row items-center justify-between bg-background/50 rounded-md px-md py-sm">
                <Text
                  className="text-small text-text-primary font-mono flex-1"
                  numberOfLines={1}
                >
                  {address || user.walletAddress || 'No wallet connected'}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    copyToClipboard(
                      address || user.walletAddress || '',
                      'Wallet address'
                    )
                  }
                  className="ml-sm"
                >
                  <Copy size={16} color="#FF6B9D" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Balance */}
            <View>
              <View className="flex-row items-center justify-between mb-xs">
                <Text className="text-caption text-text-secondary">
                  Balance (On-Chain)
                </Text>
                <TouchableOpacity
                  onPress={fetchBalance}
                  disabled={isLoadingBalance}
                  className="p-xs"
                >
                  {isLoadingBalance ? (
                    <ActivityIndicator size="small" color="#FF2E63" />
                  ) : (
                    <RefreshCw size={16} color="#FF6B9D" />
                  )}
                </TouchableOpacity>
              </View>
              <View className="flex-row items-center">
                {isLoadingBalance && realBalance === null ? (
                  <ActivityIndicator size="small" color="#FF2E63" />
                ) : (
                  <Text className="text-h2 text-primary font-bold">
                    {(realBalance !== null
                      ? realBalance
                      : user.walletBalance || 0
                    ).toFixed(4)}{' '}
                    STX
                  </Text>
                )}
              </View>
              {realBalance !== null && (
                <Text className="text-caption text-accent mt-xs">
                  ✓ Live from blockchain
                </Text>
              )}
            </View>

            {/* Export Seed Phrase */}
            <TouchableOpacity
              onPress={() => setShowSeedPhraseModal(true)}
              className="mt-md bg-error/20 rounded-md px-md py-sm border border-error/30"
            >
              <Text className="text-small text-error font-semibold text-center">
                🔑 Export Seed Phrase
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="px-lg mb-xl relative z-10">
          <AnimatedXPBar xp={user.xp} level={user.level} />
        </View>

        <View className="flex-row px-lg mb-xl gap-md">
          <View className="flex-1 bg-card rounded-lg p-md items-center border border-border">
            <Text className="text-h1 text-primary mb-xs">
              {user.totalRecordings}
            </Text>
            <Text className="text-caption text-text-secondary">Recordings</Text>
          </View>
          <View className="flex-1 bg-card rounded-lg p-md items-center border border-border">
            <Text className="text-h1 text-primary mb-xs">
              {user.totalVotes}
            </Text>
            <Text className="text-caption text-text-secondary">Votes Cast</Text>
          </View>
          <View className="flex-1 bg-card rounded-lg p-md items-center border border-border">
            <Text className="text-h1 text-primary mb-xs">
              {contributedStories.length}
            </Text>
            <Text className="text-caption text-text-secondary">Stories</Text>
          </View>
        </View>

        <View className="px-lg mb-xl">
          <Text className="text-h2 text-text-primary mb-md">Badges</Text>
          <View className="flex-row flex-wrap gap-md">
            {user.badges.map((badge) => (
              <View
                key={badge.id}
                className={`w-[47%] bg-card rounded-lg p-md items-center ${
                  badge.unlocked
                    ? 'border-2 border-primary'
                    : 'opacity-40 border border-border'
                }`}
              >
                <Text className="text-4xl mb-sm">{badge.icon}</Text>
                <Text className="text-body text-text-primary font-bold text-center mb-xs">
                  {badge.name}
                </Text>
                <Text className="text-small text-text-secondary text-center">
                  {badge.description}
                </Text>
                {badge.unlocked && (
                  <Text className="text-small text-accent font-bold mt-sm">
                    ✓ Unlocked
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* NFT Collection */}
        <View className="px-lg mb-xl">
          <View className="flex-row items-center justify-between mb-md">
            <View className="flex-row items-center">
              <Text className="text-2xl mr-sm">🎨</Text>
              <Text className="text-h2 text-text-primary">
                My NFTs ({nfts.length})
              </Text>
            </View>
            {isLoadingNFTs && (
              <ActivityIndicator size="small" color="#FF2E63" />
            )}
          </View>

          {isLoadingNFTs && nfts.length === 0 ? (
            <View className="bg-card rounded-lg p-xl items-center border border-border">
              <ActivityIndicator size="large" color="#FF2E63" />
              <Text className="text-caption text-text-secondary mt-md">
                Loading NFTs...
              </Text>
            </View>
          ) : nfts.length === 0 ? (
            <View className="bg-card rounded-lg p-xl items-center border border-border">
              <Text className="text-4xl mb-md">✨</Text>
              <Text className="text-body text-text-primary font-semibold mb-xs">
                No NFTs yet
              </Text>
              <Text className="text-caption text-text-secondary text-center">
                Complete stories to earn exclusive NFTs!
              </Text>
            </View>
          ) : (
            nfts.map((nft) => (
              <NFTCard
                key={nft.tokenId}
                tokenId={nft.tokenId}
                uri={nft.uri}
                metadata={nft.metadata}
                onPress={() => {
                  // Optional: Navigate to NFT detail screen
                  Alert.alert(
                    `NFT #${nft.tokenId}`,
                    nft.metadata?.description || 'Story Completion NFT'
                  );
                }}
              />
            ))
          )}
        </View>

        {/* My Created Stories */}
        <View className="px-lg mb-xl">
          <View className="flex-row items-center mb-md">
            <Text className="text-2xl mr-sm">👑</Text>
            <Text className="text-h2 text-text-primary">
              My Created Stories ({createdStories.length})
            </Text>
          </View>
          {createdStories.length === 0 ? (
            <View className="bg-card rounded-lg p-xl items-center border border-border">
              <Text className="text-4xl mb-md">✨</Text>
              <Text className="text-body text-text-primary font-semibold mb-xs">
                No stories created yet
              </Text>
              <Text className="text-caption text-text-secondary text-center">
                Create your first story to manage rounds and rewards
              </Text>
            </View>
          ) : (
            createdStories.map((story) => (
              <TouchableOpacity
                key={story.id}
                className="bg-gradient-to-r from-accent/20 to-primary/20 rounded-lg p-md mb-md border-2 border-accent/50"
                onPress={() => router.push(`/story/${story.id}`)}
              >
                <View className="flex-row items-center mb-sm">
                  <Text className="text-3xl mr-md">{story.coverArt}</Text>
                  <View className="flex-1">
                    <View className="flex-row items-center mb-xs">
                      <Text className="text-body text-text-primary font-bold">
                        {story.title}
                      </Text>
                      <View className="bg-accent/30 px-sm py-0.5 rounded ml-sm">
                        <Text className="text-small text-accent font-bold">
                          CREATOR
                        </Text>
                      </View>
                    </View>
                    <Text className="text-caption text-text-secondary">
                      {story.blocks.length} blocks • Round{' '}
                      {story.currentRound || 1}
                    </Text>
                  </View>
                </View>

                {/* Story Status */}
                <View className="flex-row gap-sm">
                  {story.status === 'sealed' ? (
                    <View className="flex-1 bg-secondary/30 rounded px-sm py-xs">
                      <Text className="text-small text-secondary font-semibold text-center">
                        🔒 Sealed
                      </Text>
                    </View>
                  ) : (
                    <>
                      <View className="flex-1 bg-accent/30 rounded px-sm py-xs">
                        <Text className="text-small text-accent font-semibold text-center">
                          ⚡ Active
                        </Text>
                      </View>
                      <View className="flex-1 bg-primary/30 rounded px-sm py-xs">
                        <Text className="text-small text-primary font-semibold text-center">
                          Tap to Manage
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* My Contributions */}
        <View className="px-lg mb-xl">
          <Text className="text-h2 text-text-primary mb-md">
            My Contributions
          </Text>
          {contributedStories.length === 0 ? (
            <View className="items-center py-xl">
              <Text className="text-body text-text-secondary mb-xs">
                No contributions yet
              </Text>
              <Text className="text-caption text-text-secondary">
                Start recording to see your stories here!
              </Text>
            </View>
          ) : (
            contributedStories.map((story) => (
              <TouchableOpacity
                key={story.id}
                className="flex-row items-center bg-card rounded-md p-md mb-md border border-border"
                onPress={() => router.push(`/story/${story.id}`)}
              >
                <Text className="text-3xl mr-md">{story.coverArt}</Text>
                <View className="flex-1">
                  <Text className="text-body text-text-primary font-semibold mb-xs">
                    {story.title}
                  </Text>
                  <Text className="text-caption text-text-secondary">
                    {
                      story.blocks.filter((b) => b.username === user.username)
                        .length
                    }{' '}
                    contribution(s)
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* NFT Collection */}
        <View className="px-lg mb-xl">
          <View className="flex-row items-center mb-md">
            <ImageIcon size={20} color="#FF4081" />
            <Text className="text-h2 text-text-primary ml-sm">
              My NFTs ({(user.nfts || []).length})
            </Text>
          </View>

          {(user.nfts || []).length === 0 ? (
            <View className="bg-card rounded-lg p-xl items-center border border-border">
              <Text className="text-4xl mb-md">🎨</Text>
              <Text className="text-body text-text-primary font-semibold mb-xs">
                No NFTs yet
              </Text>
              <Text className="text-caption text-text-secondary text-center">
                Contribute to stories to earn NFTs
              </Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-md">
              {(user.nfts || []).map((nft) => (
                <View
                  key={nft.id}
                  className="w-[47%] bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg p-md border-2 border-primary/50"
                >
                  <View className="items-center mb-sm">
                    <Text className="text-5xl mb-sm">{nft.coverArt}</Text>
                    <Text className="text-body text-text-primary font-bold text-center mb-xs">
                      {nft.storyTitle}
                    </Text>
                    <Text className="text-caption text-text-secondary text-center">
                      by {nft.mintedBy}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-center bg-accent/20 px-sm py-xs rounded-md">
                    <CheckCircle size={12} color="#FF4081" />
                    <Text className="text-small text-accent font-bold ml-xs">
                      Owned
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View className="px-lg mt-md gap-md">
          <TouchableOpacity
            className="flex-row items-center justify-center bg-card rounded-md p-md border border-secondary gap-sm"
            onPress={handleResetData}
          >
            <Text className="text-body text-secondary font-semibold">
              🔄 Reset All Data
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-center bg-card rounded-md p-md border border-error gap-sm"
            onPress={handleLogout}
          >
            <LogOut size={20} color="#FF4444" />
            <Text className="text-body text-error font-semibold">Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Seed Phrase Modal */}
      <Modal
        visible={showSeedPhraseModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSeedPhraseModal(false)}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          className="flex-1 bg-black/80 px-lg"
        >
          <View className="bg-card rounded-lg p-lg my-lg border border-error">
            <Text className="text-h2 text-text-primary mb-md">
              ⚠️ Seed Phrase
            </Text>
            <Text className="text-body text-text-secondary mb-lg">
              Never share your seed phrase with anyone. It gives full access to
              your wallet. Write it down and store it safely.
            </Text>

            <View className="bg-background rounded-md p-md mb-md">
              <View className="flex-row items-center justify-between mb-sm">
                <Text className="text-caption text-text-secondary">
                  Your 24-Word Seed Phrase
                </Text>
                <TouchableOpacity
                  onPress={() => setShowSeedPhrase(!showSeedPhrase)}
                >
                  {showSeedPhrase ? (
                    <EyeOff size={18} color="#D4A5B8" />
                  ) : (
                    <Eye size={18} color="#D4A5B8" />
                  )}
                </TouchableOpacity>
              </View>
              <Text className="text-small text-text-primary leading-6">
                {showSeedPhrase
                  ? mnemonic || 'No seed phrase available'
                  : '•••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• •••• ••••'}
              </Text>
            </View>

            {getPrivateKey() && (
              <View className="bg-background rounded-md p-md mb-md">
                <Text className="text-caption text-text-secondary mb-sm">
                  Private Key (Advanced)
                </Text>
                <Text
                  className="text-small text-text-primary font-mono"
                  numberOfLines={2}
                >
                  {showSeedPhrase
                    ? getPrivateKey()
                    : '••••••••••••••••••••••••••••••••'}
                </Text>
              </View>
            )}

            <View className="flex-row gap-md">
              <Button
                title="Copy Seed"
                onPress={() => {
                  copyToClipboard(mnemonic || '', 'Seed phrase');
                }}
                variant="primary"
                size="medium"
                className="flex-1"
              />
              <Button
                title="Close"
                onPress={() => {
                  setShowSeedPhrase(false);
                  setShowSeedPhraseModal(false);
                }}
                variant="outline"
                size="medium"
                className="flex-1"
              />
            </View>
          </View>
        </ScrollView>
      </Modal>

      {/* Icon Picker Modal */}
      <Modal
        visible={showIconPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowIconPicker(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-card rounded-t-3xl p-lg">
            <Text className="text-h2 text-text-primary mb-lg">
              Choose Profile Icon
            </Text>
            <View className="flex-row flex-wrap gap-md mb-lg">
              {PROFILE_ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  onPress={() => handleIconSelect(icon)}
                  className={`w-16 h-16 items-center justify-center rounded-lg border-2 ${
                    user.profileIcon === icon
                      ? 'bg-primary border-primary'
                      : 'bg-background border-border'
                  }`}
                >
                  <Text className="text-4xl">{icon}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button
              title="Cancel"
              onPress={() => setShowIconPicker(false)}
              variant="outline"
              size="medium"
              className="w-full"
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
