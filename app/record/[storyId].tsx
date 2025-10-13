import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Mic,
  Square,
  Play,
  RotateCcw,
  Copy,
  ExternalLink,
} from 'lucide-react-native';
import { Audio } from 'expo-av';
import { theme } from '../../constants/theme';
import { Button } from '../../components/Button';
import { GameButton } from '../../components/GameButton';
import { BackgroundPulse } from '../../components/BackgroundPulse';
import { useAppStore } from '../../store/useAppStore';
import { usePinata } from '../../hooks/usePinata';
import { useContract } from '../../hooks/useContract';
import { useStories } from '../../hooks/useStories';

export default function RecordScreen() {
  const router = useRouter();
  const { storyId } = useLocalSearchParams();
  const { user, addVoiceBlock, updateUser, addXP, unlockBadge, storyChains } =
    useAppStore();
  const { uploadAudioWithMetadata, isUploading, getPinataUrl } = usePinata();
  const { submitBlockOnChain, isProcessing, checkVotingActive, fetchStory } =
    useContract();
  const { refreshStory } = useStories();

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultData, setResultData] = useState<{
    success: boolean;
    title: string;
    message: string;
    txId?: string;
  } | null>(null);

  const story = storyChains.find((s) => s.id === storyId);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration((prev) => {
          if (prev >= 30) {
            stopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission required',
          'Please grant microphone access to record.'
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordedUri(uri);
      setRecording(null);
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const playRecording = async () => {
    if (!recordedUri) return;

    try {
      if (isPlaying && sound) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else if (sound) {
        await sound.playAsync();
        setIsPlaying(true);
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync({
          uri: recordedUri,
        });
        setSound(newSound);
        await newSound.playAsync();
        setIsPlaying(true);

        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      }
    } catch (err) {
      console.error('Failed to play recording', err);
    }
  };

  const handleReset = () => {
    if (sound) {
      sound.unloadAsync();
      setSound(null);
    }
    setRecordedUri(null);
    setRecordingDuration(0);
    setIsPlaying(false);
  };

  const handleSubmit = async () => {
    if (!recordedUri || !user || !story) {
      Alert.alert('Error', 'Missing required data');
      return;
    }

    if (isUploading || isProcessing) {
      return; // Prevent double submission
    }

    try {
      // Step 1: Validate submission conditions
      console.log('🔍 Validating submission conditions...');

      // Check if story exists and is active
      if (story.status !== 'active') {
        Alert.alert(
          'Story Not Active',
          'This story is no longer accepting submissions.'
        );
        return;
      }

      // Check if storyId is a transaction ID (starts with 0x) or numeric ID
      const isTransactionId = (storyId as string).startsWith('0x');

      if (!isTransactionId) {
        // Only validate against blockchain if we have a numeric story ID
        Alert.alert('🔍 Fetching story from blockchain...', storyId as string);
        const blockchainStory = await fetchStory(parseInt(storyId as string));
        Alert.alert('🔍 Blockchain story:', blockchainStory as string);
        if (!blockchainStory) {
          Alert.alert('Error', 'Story not found on blockchain');
          return;
        }

        if (blockchainStory['is-sealed']) {
          Alert.alert(
            'Story Sealed',
            'This story has been sealed and is no longer accepting submissions.'
          );
          return;
        }
      } else {
        console.log(
          '⚠️ Using transaction ID as story ID - skipping blockchain validation'
        );
      }

      // Check if voting is active (can't submit during voting)
      if (!isTransactionId) {
        const currentRound = 1; // Default to round 1
        const votingActive = await checkVotingActive(
          parseInt(storyId as string),
          currentRound
        );

        if (votingActive) {
          Alert.alert(
            'Voting In Progress',
            'Cannot submit new recordings while voting is active. Please wait for the current round to complete.'
          );
          return;
        }
      }

      // Step 2: Upload audio to IPFS
      console.log('📤 Uploading audio to IPFS...');
      const metadata = {
        storyId: story.id,
        username: user.username,
        duration: recordingDuration,
        timestamp: new Date().toISOString(),
        blockNumber: story.blocks.length + 1,
        walletAddress: user.walletAddress || '',
        storyTitle: story.title,
        category: story.category,
      };

      const ipfsResult = await uploadAudioWithMetadata(
        recordedUri,
        metadata,
        `story-${story.id}-block-${story.blocks.length + 1}.m4a`,
        `metadata-${story.id}-block-${story.blocks.length + 1}.json`
      );

      if (!ipfsResult) {
        Alert.alert(
          'IPFS Upload Failed',
          'Could not upload audio to IPFS. Please try again.'
        );
        return;
      }

      console.log('✅ Audio uploaded to IPFS:', ipfsResult.audioCid);

      // Step 3: Submit to blockchain
      console.log('⛓️ Submitting to blockchain...');

      // For now, we'll use a placeholder story ID since we're using transaction IDs
      // In a real implementation, you'd need to map transaction IDs to actual story IDs
      const storyIdForSubmission = isTransactionId
        ? 1
        : parseInt(storyId as string);

      const txId = await submitBlockOnChain(
        storyIdForSubmission,
        ipfsResult.audioCid // Use IPFS hash as URI
      );

      if (!txId) {
        Alert.alert(
          'Blockchain Submission Failed',
          'Could not submit your recording to the blockchain. Please try again.'
        );
        return;
      }

      console.log('✅ Submitted to blockchain, txId:', txId);

      // Step 4: Update local state
      const newBlock = {
        id: txId, // Use transaction ID as block ID
        username: user.username,
        audioUri: ipfsResult.audioUrl, // Gateway URL for playback
        audioCid: ipfsResult.audioCid, // IPFS hash
        metadataCid: ipfsResult.metadataCid, // Metadata hash
        duration: recordingDuration,
        timestamp: new Date().toISOString(),
        votes: 0,
      };

      // Add to local store for immediate display
      addVoiceBlock(storyId as string, newBlock);

      // Update user stats
      updateUser({
        totalRecordings: user.totalRecordings + 1,
      });
      addXP(25); // Award XP for submission

      // Unlock first recording badge
      if (user.totalRecordings === 0) {
        unlockBadge('badge1');
      }

      // Refresh story data from blockchain
      await refreshStory(parseInt(storyId as string));

      console.log('🎉 Submission complete!');

      // Show success popup
      setResultData({
        success: true,
        title: '🎤 Recording Submitted!',
        message: `Your voice block has been added to "${story.title}" on the blockchain!`,
        txId: txId,
      });
      setShowResultModal(true);
    } catch (error: any) {
      console.error('❌ Submission error:', error);

      // Determine error message
      let errorMessage =
        error.message || 'An unexpected error occurred. Please try again.';

      if (error.message?.includes('ERR-ALREADY-SUBMITTED')) {
        errorMessage = 'You have already submitted a recording for this round.';
      } else if (error.message?.includes('ERR-VOTING-CLOSED')) {
        errorMessage = 'The voting window has closed for this round.';
      } else if (error.message?.includes('ERR-STORY-SEALED')) {
        errorMessage =
          'This story has been sealed and is no longer accepting submissions.';
      }

      // Show error popup
      setResultData({
        success: false,
        title: '❌ Submission Failed',
        message: errorMessage,
      });
      setShowResultModal(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Record Voice</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.recordingSection}>
          <View style={styles.timerContainer}>
            <Text style={styles.timer}>{formatTime(recordingDuration)}</Text>
            <Text style={styles.maxTime}>/ 0:30</Text>
          </View>

          <View style={styles.waveformPlaceholder}>
            {isRecording && (
              <View style={styles.waveformBars}>
                {Array.from({ length: 30 }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.waveBar,
                      {
                        height: Math.random() * 60 + 20,
                        backgroundColor: theme.colors.primary,
                      },
                    ]}
                  />
                ))}
              </View>
            )}
            {recordedUri && !isRecording && (
              <View style={styles.waveformBars}>
                {Array.from({ length: 30 }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.waveBar,
                      {
                        height: Math.random() * 60 + 20,
                        backgroundColor: isPlaying
                          ? theme.colors.primary
                          : theme.colors.border,
                      },
                    ]}
                  />
                ))}
              </View>
            )}
          </View>

          <View style={styles.controls}>
            {!recordedUri ? (
              <TouchableOpacity
                style={[
                  styles.recordButton,
                  isRecording && styles.recordingActive,
                ]}
                onPress={isRecording ? stopRecording : startRecording}
                activeOpacity={0.8}
              >
                {isRecording ? (
                  <Square
                    size={32}
                    color={theme.colors.text}
                    fill={theme.colors.text}
                  />
                ) : (
                  <Mic size={32} color={theme.colors.text} />
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.playbackControls}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={handleReset}
                >
                  <RotateCcw size={24} color={theme.colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={playRecording}
                >
                  <Play
                    size={32}
                    color={theme.colors.text}
                    fill={isPlaying ? theme.colors.text : 'transparent'}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <Text style={styles.instruction}>
            {!recordedUri && !isRecording && 'Tap to start recording'}
            {isRecording && 'Recording... Tap to stop'}
            {recordedUri && 'Preview your recording'}
          </Text>
        </View>
      </View>

      {recordedUri && (
        <View style={styles.footer}>
          <GameButton
            title={
              isUploading
                ? 'Uploading to IPFS...'
                : isProcessing
                ? 'Submitting to Blockchain...'
                : 'Submit Recording'
            }
            onPress={handleSubmit}
            disabled={isUploading || isProcessing}
            loading={isUploading || isProcessing}
            size="large"
            variant="accent"
            className="w-full"
          />
        </View>
      )}

      {/* Game-Style Result Popup Modal */}
      <Modal
        visible={showResultModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setShowResultModal(false);
          if (resultData?.success) {
            router.back();
          }
        }}
      >
        <View className="flex-1 justify-center items-center bg-black/90 px-lg">
          <View
            className={`rounded-3xl p-xl w-full max-w-md border-4 ${
              resultData?.success
                ? 'bg-gradient-to-br from-accent/20 to-secondary/20 border-accent'
                : 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border-red-500'
            }`}
            style={{
              shadowColor: resultData?.success ? '#00FFFF' : '#FF0000',
              shadowOffset: { width: 0, height: 0 },
              shadowRadius: 30,
              shadowOpacity: 0.8,
            }}
          >
            {/* Animated Icon */}
            <View className="items-center mb-lg">
              <View
                className={`w-32 h-32 rounded-full items-center justify-center mb-md ${
                  resultData?.success
                    ? 'bg-accent/30 border-4 border-accent'
                    : 'bg-red-500/30 border-4 border-red-500'
                }`}
                style={{
                  shadowColor: resultData?.success ? '#00FFFF' : '#FF0000',
                  shadowOffset: { width: 0, height: 0 },
                  shadowRadius: 20,
                  shadowOpacity: 1,
                }}
              >
                <Text className="text-7xl">
                  {resultData?.success ? '🎤' : '💥'}
                </Text>
              </View>
            </View>

            {/* Title */}
            <Text
              className={`text-h1 text-center mb-md font-bold ${
                resultData?.success ? 'text-accent' : 'text-red-500'
              }`}
            >
              {resultData?.title}
            </Text>

            {/* Message */}
            <Text className="text-body text-text-primary text-center mb-lg leading-6">
              {resultData?.message}
            </Text>

            {/* Transaction ID (for success) */}
            {resultData?.success && resultData?.txId && (
              <View className="bg-background/50 rounded-xl p-md mb-lg border border-accent/30">
                <Text className="text-caption text-text-secondary text-center mb-xs">
                  ⛓️ Blockchain Transaction
                </Text>
                <Text
                  className="text-small text-accent font-mono text-center"
                  numberOfLines={1}
                >
                  {resultData.txId.substring(0, 8)}...
                  {resultData.txId.substring(resultData.txId.length - 6)}
                </Text>
              </View>
            )}

            {/* XP Earned (for success) */}
            {resultData?.success && (
              <View className="bg-secondary/20 rounded-xl p-md mb-lg border border-secondary/30">
                <Text className="text-h3 text-secondary text-center font-bold">
                  +25 XP
                </Text>
                <Text className="text-caption text-text-secondary text-center">
                  Experience Points Earned!
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View className="gap-md">
              <GameButton
                title={resultData?.success ? 'Awesome!' : 'Okay'}
                onPress={() => {
                  setShowResultModal(false);
                  if (resultData?.success) {
                    router.back();
                  }
                }}
                size="large"
                variant={resultData?.success ? 'accent' : 'secondary'}
                className="w-full"
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  recordingSection: {
    width: '100%',
    alignItems: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: theme.spacing.xl,
  },
  timer: {
    fontSize: 64,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  maxTime: {
    fontSize: 24,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  waveformPlaceholder: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  waveformBars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 80,
  },
  waveBar: {
    width: 6,
    borderRadius: 3,
  },
  controls: {
    marginBottom: theme.spacing.lg,
  },
  recordButton: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingActive: {
    backgroundColor: theme.colors.error,
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  playButton: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  instruction: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  footer: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  submitButton: {
    width: '100%',
  },
});
