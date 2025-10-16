import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Mic,
  Link as LinkIcon,
  Award,
  ExternalLink,
  Copy,
  AlertCircle,
} from 'lucide-react-native';
import { Button } from '../components/Button';
import { useAppStore } from '../store/useAppStore';
import { useWallet } from '../contexts/WalletContext';
import { useContract } from '../hooks/useContract';
// Mock data imports removed - using real blockchain data

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    icon: Mic,
    title: 'Record Your Voice',
    description: 'Create short 15-30 second voice memos to continue stories',
  },
  {
    id: '2',
    icon: LinkIcon,
    title: 'Chain Stories Together',
    description:
      'Each voice memo becomes a new block in a collaborative story chain',
  },
  {
    id: '3',
    icon: Award,
    title: 'Earn Rewards',
    description: 'Gain XP, unlock badges, and level up as you create and vote',
  },
];

const FAUCET_URL = 'https://learnweb3.io/faucets/stacks/';

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [username, setUsername] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isRegisteringUser, setIsRegisteringUser] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const { setUser, setHasCompletedOnboarding } = useAppStore();
  const { createNewWallet, loginWithMnemonic, address, getPrivateKey } =
    useWallet();
  const { registerUserOnChain, isConnected } = useContract();

  const isAuthSlide = currentIndex === slides.length;
  const isWalletSlide = currentIndex === slides.length + 1;
  const isFundingSlide = currentIndex === slides.length + 2;
  const isUsernameSlide = currentIndex === slides.length + 3;

  const handleNext = () => {
    if (currentIndex < slides.length) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleCreateAccount = () => {
    setIsCreatingAccount(true);
    flatListRef.current?.scrollToIndex({ index: slides.length + 1 });
    setCurrentIndex(slides.length + 1);
  };

  const handleLogin = () => {
    setIsCreatingAccount(false);
    flatListRef.current?.scrollToIndex({ index: slides.length + 1 });
    setCurrentIndex(slides.length + 1);
  };

  const handleWalletNext = async () => {
    setIsProcessing(true);
    setLoadingMessage(
      isCreatingAccount
        ? 'Generating secure wallet...'
        : 'Restoring your wallet...'
    );

    try {
      if (isCreatingAccount) {
        // Generate new wallet
        setLoadingMessage('Generating 24-word seed phrase...');
        await new Promise((resolve) => setTimeout(resolve, 500)); // Brief delay for UX
        await createNewWallet();
        setLoadingMessage('Deriving wallet address...');
        await new Promise((resolve) => setTimeout(resolve, 500));
      } else {
        // Login with mnemonic
        setLoadingMessage('Validating seed phrase...');
        await new Promise((resolve) => setTimeout(resolve, 500));
        const success = await loginWithMnemonic(mnemonic);
        if (!success) {
          setIsProcessing(false);
          setLoadingMessage('');
          Alert.alert(
            'Invalid Mnemonic',
            'Please check your seed phrase and try again.'
          );
          return;
        }
        setLoadingMessage('Restoring wallet data...');
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      setLoadingMessage('Almost there...');
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Move to funding instruction slide
      flatListRef.current?.scrollToIndex({ index: slides.length + 2 });
      setCurrentIndex(slides.length + 2);
    } catch (error) {
      Alert.alert('Error', 'Failed to setup wallet. Please try again.');
      console.error('Wallet setup error:', error);
    } finally {
      setIsProcessing(false);
      setLoadingMessage('');
    }
  };

  const handleGetStarted = async () => {
    if (!username.trim() || !address) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    if (!isConnected) {
      Alert.alert(
        'Wallet Not Connected',
        'Please ensure your wallet is connected before registering.'
      );
      return;
    }

    setIsRegisteringUser(true);
    setLoadingMessage('Registering username on blockchain...');

    try {
      // Call the smart contract to register the user
      const txId = await registerUserOnChain(username.trim());

      if (!txId) {
        // Transaction failed or was rejected
        Alert.alert(
          'Registration Failed',
          'Could not register your username on the blockchain. Please try again.'
        );
        setIsRegisteringUser(false);
        setLoadingMessage('');
        return;
      }

      // Transaction was broadcast successfully
      setLoadingMessage('Username registered! Setting up your profile...');

      // Wait a bit for visual feedback
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Create the user with minimal data - real data will be fetched from blockchain
      const newUser = {
        username: username.trim(),
        walletAddress: address,
        privateKey: getPrivateKey() || '',
        walletBalance: 0, // Will be fetched from blockchain
        profileIcon: '👤',
        badges: [], // Will be fetched from blockchain activity
        contributedStories: [], // Will be updated based on blockchain activity
        totalRecordings: 0, // Will be updated based on blockchain activity
        totalVotes: 0, // Will be updated based on blockchain activity
        xp: 0, // Will be updated based on blockchain activity
        level: 1,
        nfts: [], // Will be fetched from blockchain
      };

      setUser(newUser);
      setHasCompletedOnboarding(true);
      setIsRegisteringUser(false);
      setLoadingMessage('');
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Registration error:', error);
      Alert.alert(
        'Registration Failed',
        error.message || 'An unexpected error occurred. Please try again.'
      );
      setIsRegisteringUser(false);
      setLoadingMessage('');
    }
  };

  const renderSlide = ({ item }: { item: (typeof slides)[0] }) => {
    const Icon = item.icon;
    return (
      <View
        className="flex-1 justify-center items-center px-xl"
        style={{ width }}
      >
        <View className="w-40 h-40 rounded-full bg-card justify-center items-center mb-xl border-2 border-primary">
          <Icon size={80} color="#FF2E63" strokeWidth={1.5} />
        </View>
        <Text className="text-h1 text-text-primary text-center mb-md">
          {item.title}
        </Text>
        <Text className="text-body text-text-secondary text-center leading-6">
          {item.description}
        </Text>
      </View>
    );
  };

  const renderAuthSlide = () => (
    <View
      className="flex-1 justify-center items-center px-xl"
      style={{ width }}
    >
      <View className="w-full h-50 justify-center items-center mb-xl">
        <Image
          source={require('../assets/images/Logo.png')}
          className="w-64 h-40"
          resizeMode="contain"
        />
      </View>
      <Text className="text-h1 text-text-primary text-center mb-md">
        Welcome to SoniChain
      </Text>
      <Text className="text-body text-text-secondary text-center leading-6">
        Join our community of storytellers and start creating collaborative
        voice stories
      </Text>

      <View className="w-full mt-xl gap-md">
        <Button
          title="Create New Account"
          onPress={handleCreateAccount}
          size="large"
          variant="primary"
          className="w-full"
        />
        <Button
          title="Login with Seed Phrase"
          onPress={handleLogin}
          size="large"
          variant="outline"
          className="w-full"
        />
      </View>
    </View>
  );

  const renderWalletSlide = () => (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
      style={{ width }}
    >
      <View className="flex-1 justify-center px-xl">
        <View className="items-center mb-xl">
          <View className="w-20 h-20 rounded-full bg-primary/20 justify-center items-center mb-md">
            <Text className="text-5xl">🔐</Text>
          </View>
          <Text className="text-h1 text-text-primary text-center mb-md">
            {isCreatingAccount ? 'Secure Your Wallet' : 'Restore Your Wallet'}
          </Text>
          <Text className="text-body text-text-secondary text-center leading-6">
            {isCreatingAccount
              ? 'Your wallet will be generated with a seed phrase. Keep it safe!'
              : 'Enter your 12 or 24 word seed phrase to restore your wallet'}
          </Text>
        </View>

        {!isCreatingAccount && (
          <View className="mb-lg">
            <Text className="text-body text-text-primary font-semibold mb-sm">
              Seed Phrase *
            </Text>
            <TextInput
              className="bg-card rounded-md px-md py-lg text-text-primary text-base border-2 border-border"
              placeholder="Enter your 12 or 24 word seed phrase..."
              placeholderTextColor="#D4A5B8"
              value={mnemonic}
              onChangeText={setMnemonic}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{ minHeight: 120 }}
              autoCorrect={false}
              autoCapitalize="none"
            />
            <Text className="text-caption text-text-secondary mt-xs">
              Separate each word with a space
            </Text>
          </View>
        )}

        {isCreatingAccount && (
          <View className="bg-secondary/20 rounded-lg p-md mb-lg border border-secondary/30">
            <Text className="text-body text-text-primary font-semibold mb-xs">
              🔒 Security Notice
            </Text>
            <Text className="text-caption text-text-secondary leading-5">
              Your seed phrase will be shown on the next screen. Write it down
              and store it safely. You'll need it to recover your wallet.
            </Text>
          </View>
        )}

        {/* Funding Notice - Always shown */}
        <View className="bg-accent/20 rounded-lg p-md mb-lg border-2 border-accent/50">
          <View className="flex-row items-center mb-xs">
            <AlertCircle size={20} color="#00FFFF" className="mr-sm" />
            <Text className="text-body text-accent font-semibold">
              ⚠️ Funding Required
            </Text>
          </View>
          <Text className="text-caption text-text-secondary leading-5">
            After creating your wallet, you'll need to add testnet STX tokens to
            pay for blockchain transaction fees. Don't worry - we'll show you
            exactly how to get free testnet tokens!
          </Text>
        </View>

        <Button
          title={isCreatingAccount ? 'Generate Wallet' : 'Restore Wallet'}
          onPress={handleWalletNext}
          size="large"
          loading={isProcessing}
          disabled={!isCreatingAccount && !mnemonic.trim()}
          className="w-full"
        />
      </View>
    </ScrollView>
  );

  const renderFundingSlide = () => {
    const handleCopyAddress = () => {
      if (address) {
        Alert.alert('Your Wallet Address', address, [
          { text: 'OK', style: 'default' },
        ]);
      }
    };

    const handleOpenFaucet = async () => {
      try {
        await Linking.openURL(FAUCET_URL);
      } catch (error) {
        Alert.alert(
          'Error',
          'Could not open browser. Please visit: ' + FAUCET_URL
        );
      }
    };

    return (
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        style={{ width }}
      >
        <View className="flex-1 justify-center px-xl py-xl">
          <View className="items-center mb-xl">
            <View className="w-24 h-24 rounded-full bg-accent/20 justify-center items-center mb-md border-2 border-accent">
              <Text className="text-6xl">💰</Text>
            </View>
            <Text className="text-h1 text-text-primary text-center mb-md">
              Fund Your Wallet
            </Text>
            <Text className="text-body text-text-secondary text-center leading-6">
              Before you can use SoniChain, you need to add testnet STX tokens
              to your wallet to pay for transaction fees
            </Text>
          </View>

          {/* Wallet Address Card */}
          {address && (
            <TouchableOpacity
              onPress={handleCopyAddress}
              className="mb-lg bg-card rounded-xl p-md border-2 border-primary"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center justify-between mb-sm">
                <Text className="text-body text-text-primary font-semibold">
                  Your Wallet Address
                </Text>
                <Copy size={20} color="#00FFFF" />
              </View>
              <Text
                className="text-small text-text-secondary font-mono leading-5"
                numberOfLines={1}
              >
                {address}
              </Text>
              <Text className="text-caption text-accent mt-xs">
                Tap to view full address
              </Text>
            </TouchableOpacity>
          )}

          {/* Instructions */}
          <View className="bg-accent/10 rounded-xl p-md mb-lg border border-accent/30">
            <Text className="text-body text-accent font-semibold mb-md">
              📋 How to Get Free Testnet STX
            </Text>

            <View className="gap-md">
              <View className="flex-row">
                <Text className="text-body text-accent font-bold mr-sm">
                  1.
                </Text>
                <Text className="text-caption text-text-secondary flex-1 leading-5">
                  Copy your wallet address above
                </Text>
              </View>

              <View className="flex-row">
                <Text className="text-body text-accent font-bold mr-sm">
                  2.
                </Text>
                <Text className="text-caption text-text-secondary flex-1 leading-5">
                  Tap "Get Free Tokens" button below
                </Text>
              </View>

              <View className="flex-row">
                <Text className="text-body text-accent font-bold mr-sm">
                  3.
                </Text>
                <Text className="text-caption text-text-secondary flex-1 leading-5">
                  Paste your address and request 500 STX tokens
                </Text>
              </View>

              <View className="flex-row">
                <Text className="text-body text-accent font-bold mr-sm">
                  4.
                </Text>
                <Text className="text-caption text-text-secondary flex-1 leading-5">
                  Come back here and tap "Continue"
                </Text>
              </View>
            </View>
          </View>

          {/* Requirements Box */}
          <View className="bg-secondary/20 rounded-lg p-md mb-lg border border-secondary/30">
            <Text className="text-body text-text-primary font-semibold mb-xs">
              💡 What You Need
            </Text>
            <Text className="text-caption text-text-secondary leading-5">
              • Minimum: 1 STX (for ~10 transactions){'\n'}• Recommended: 10 STX
              (comfortable buffer){'\n'}• Faucet gives: 500 STX (plenty for
              testing)
            </Text>
          </View>

          {/* Faucet Button */}
          <TouchableOpacity
            onPress={handleOpenFaucet}
            className="bg-accent rounded-lg p-md mb-md flex-row items-center justify-center"
            activeOpacity={0.8}
          >
            <ExternalLink size={20} color="#1A0E14" className="mr-sm" />
            <Text className="text-body text-background font-bold">
              Get Free Testnet Tokens
            </Text>
          </TouchableOpacity>

          {/* Skip Warning */}
          <View className="bg-error/20 rounded-lg p-sm border border-error/30">
            <Text className="text-caption text-error text-center leading-5">
              ⚠️ Without tokens, you won't be able to create stories, vote, or
              submit contributions
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderUsernameSlide = () => (
    <View
      className="flex-1 justify-center items-center px-xl"
      style={{ width }}
    >
      <View className="w-40 h-40 rounded-full bg-card justify-center items-center mb-xl border-2 border-primary">
        <Text className="text-7xl">🎤</Text>
      </View>
      <Text className="text-h1 text-text-primary text-center mb-md">
        Choose Your Name
      </Text>
      <Text className="text-body text-text-secondary text-center leading-6">
        What should we call you?
      </Text>
      <TextInput
        className="w-full bg-card rounded-md px-md py-md mt-xl text-text-primary text-lg border-2 border-border"
        placeholder="Enter username"
        placeholderTextColor="#D4A5B8"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {address && (
        <View className="w-full mt-lg bg-primary/20 rounded-lg p-md border border-primary/30">
          <Text className="text-caption text-text-secondary mb-xs">
            Your Wallet Address
          </Text>
          <Text
            className="text-small text-text-primary font-mono"
            numberOfLines={1}
          >
            {address}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <FlatList
        ref={flatListRef}
        data={[
          ...slides,
          { id: 'auth' },
          { id: 'wallet' },
          { id: 'funding' },
          { id: 'username' },
        ]}
        renderItem={({ item }) => {
          if (item.id === 'auth') return renderAuthSlide();
          if (item.id === 'wallet') return renderWalletSlide();
          if (item.id === 'funding') return renderFundingSlide();
          if (item.id === 'username') return renderUsernameSlide();
          return renderSlide({ item: item as any });
        }}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerStyle={{ flexGrow: 1 }}
      />

      <View className="p-xl pb-xxl">
        <View className="flex-row justify-center items-center mb-lg gap-sm">
          {[
            ...slides,
            { id: 'auth' },
            { id: 'wallet' },
            { id: 'funding' },
            { id: 'username' },
          ].map((_, index) => (
            <View
              key={index}
              className={`h-2 rounded-full ${
                index === currentIndex ? 'w-6 bg-primary' : 'w-2 bg-border'
              }`}
            />
          ))}
        </View>

        {isUsernameSlide ? (
          <Button
            title="Get Started"
            onPress={handleGetStarted}
            disabled={!username.trim() || isRegisteringUser}
            loading={isRegisteringUser}
            size="large"
            className="w-full"
          />
        ) : isFundingSlide ? (
          <Button
            title="Continue to Username"
            onPress={() => {
              flatListRef.current?.scrollToIndex({ index: slides.length + 3 });
              setCurrentIndex(slides.length + 3);
            }}
            size="large"
            className="w-full"
          />
        ) : !isAuthSlide && !isWalletSlide ? (
          <Button
            title="Next"
            onPress={handleNext}
            size="large"
            className="w-full"
          />
        ) : null}
      </View>

      {/* Loading Overlay */}
      <Modal
        visible={isProcessing || isRegisteringUser}
        transparent={true}
        animationType="fade"
      >
        <View className="flex-1 justify-center items-center bg-black/80">
          <View className="bg-card rounded-2xl p-xl items-center min-w-[280px] border-2 border-primary">
            <View className="w-20 h-20 rounded-full bg-primary/20 justify-center items-center mb-lg">
              <ActivityIndicator size="large" color="#FF2E63" />
            </View>
            <Text className="text-h3 text-text-primary mb-sm text-center">
              {isRegisteringUser
                ? 'Registering on Blockchain'
                : isCreatingAccount
                ? 'Creating Wallet'
                : 'Restoring Wallet'}
            </Text>
            <Text className="text-body text-text-secondary text-center">
              {loadingMessage}
            </Text>
            {isRegisteringUser && (
              <Text className="text-caption text-accent mt-md text-center">
                💫 Broadcasting transaction to Stacks blockchain...
              </Text>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
