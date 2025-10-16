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
  Linking,
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
import { useSupabase } from '../../hooks/useSupabase';
import { useContract } from '../../hooks/useContract';
import { useStories, extractBlockchainData } from '../../hooks/useStories';
import {
  openTransactionInExplorer,
  formatTxId,
} from '../../utils/explorerUtils';

export default function RecordScreen() {
  const router = useRouter();
  const { storyId } = useLocalSearchParams();
  const { user, addVoiceBlock, updateUser, addXP, unlockBadge, storyChains } =
    useAppStore();
  const { uploadAudio, isUploading } = useSupabase();
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
    //Get Story from the blockchain using the storyId
    const blockchainStoryRaw = await fetchStory(parseInt(storyId as string));
    console.log('🔍 Blockchain story raw:', blockchainStoryRaw);

    if (!blockchainStoryRaw) {
      Alert.alert('Error', 'Story not found on blockchain');
      return;
    }

    // Extract the nested blockchain data
    const blockchainStory = extractBlockchainData(blockchainStoryRaw);
    console.log('🔍 Blockchain story extracted:', blockchainStory);
    if (!recordedUri || !user) {
      console.log('recording uri', recordedUri);
      console.log('user', user);
      Alert.alert('Error', 'Missing required data');
      return;
    }

    if (isUploading || isProcessing) {
      return; // Prevent double submission
    }

    try {
      // Step 1: Validate submission conditions
      // NOTE: Story creators ARE allowed to contribute to their own stories!
      console.log('🔍 Validating submission conditions...');
      console.log('✅ Creators can submit voice blocks to their own stories');

      // Check if storyId is present and fetch blockchain data
      let blockchainStory: any = null;

      if (storyId) {
        // Only validate against blockchain if we have a numeric story ID
        console.log('🔍 Fetching story from blockchain...', storyId as string);
        const blockchainStoryRaw = await fetchStory(
          parseInt(storyId as string)
        );
        console.log('🔍 Blockchain story raw:', blockchainStoryRaw);

        if (!blockchainStoryRaw) {
          Alert.alert('Error', 'Story not found on blockchain');
          return;
        }

        // Extract the nested blockchain data
        blockchainStory = extractBlockchainData(blockchainStoryRaw);
        console.log('🔍 Blockchain story extracted:', blockchainStory);

        if (blockchainStory?.['is-sealed']) {
          Alert.alert(
            'Story Sealed',
            'This story has been sealed and is no longer accepting submissions.'
          );
          return;
        }

        // Check if voting is active (can't submit during voting)
        if (blockchainStory['is-sealed'] !== false) {
          Alert.alert(
            'Voting In Progress',
            'Cannot submit new recordings while voting is active. Please wait for the current round to complete.'
          );
          return;
        }
      } else {
        console.log('No Story ID provided');
        Alert.alert('Error', 'Story ID is required');
        return;
      }

      // Step 2: Upload audio file to Supabase Storage
      console.log('📤 Uploading audio file to Supabase Storage...');

      const currentRound =
        blockchainStory?.['current-round'] ||
        blockchainStory?.currentRound ||
        1;
      const audioFilename = `story-${storyId}-round-${currentRound}-${Date.now()}.m4a`;

      const supabaseResult = await uploadAudio(recordedUri, audioFilename);

      if (!supabaseResult) {
        Alert.alert(
          'Upload Failed',
          'Could not upload audio to Supabase. Please try again.'
        );
        return;
      }

      console.log('✅ Audio file uploaded to Supabase:');
      console.log('  - Public URL:', supabaseResult.url);
      console.log('  - Storage Path:', supabaseResult.path);
      console.log('  - Filename:', supabaseResult.filename);

      // Step 3: Submit to blockchain
      console.log('⛓️ Submitting to blockchain...');

      // Parse story ID for submission
      const storyIdForSubmission = parseInt(storyId as string);

      if (isNaN(storyIdForSubmission)) {
        Alert.alert('Error', 'Invalid story ID');
        return;
      }

      // Store only the storage path on blockchain (not full URL)
      // Full URL can be reconstructed from path + Supabase URL
      const txId = await submitBlockOnChain(
        storyIdForSubmission,
        supabaseResult.path // Store only the path: "uploads/xxx.m4a"
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
        audioUri: supabaseResult.url, // Supabase public URL for playback
        audioCid: supabaseResult.path, // Storage path in Supabase
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
        message: `Your voice block has been added to story #"${storyId}" on the blockchain!`,
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
                ? 'Uploading to Supabase...'
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
              <TouchableOpacity
                onPress={() => openTransactionInExplorer(resultData.txId!)}
                className="bg-background/50 rounded-xl p-md mb-lg border border-accent/30"
                activeOpacity={0.7}
              >
                <Text className="text-caption text-text-secondary text-center mb-xs">
                  ⛓️ View on Blockchain Explorer
                </Text>
                <Text
                  className="text-small text-accent font-mono text-center underline"
                  numberOfLines={1}
                >
                  {formatTxId(resultData.txId!)}
                </Text>
                <Text className="text-caption text-primary text-center mt-xs">
                  Tap to open →
                </Text>
              </TouchableOpacity>
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
