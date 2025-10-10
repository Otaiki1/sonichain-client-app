import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Clipboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  LogOut,
  Copy,
  Eye,
  EyeOff,
  Wallet,
  Image as ImageIcon,
  CheckCircle,
} from 'lucide-react-native';
import { XPBar } from '../../components/XPBar';
import { Button } from '../../components/Button';
import { useAppStore } from '../../store/useAppStore';
import { useWallet } from '../../contexts/WalletContext';

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

  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [showSeedPhraseModal, setShowSeedPhraseModal] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

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

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
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
              <Text className="text-caption text-text-secondary mb-xs">
                Balance
              </Text>
              <Text className="text-h2 text-primary font-bold">
                {user.walletBalance || 0} STX
              </Text>
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

        <View className="px-lg mb-xl">
          <XPBar xp={user.xp} level={user.level} />
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

        <View className="px-lg mb-xl">
          <Text className="text-h2 text-text-primary mb-md">My Chains</Text>
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
