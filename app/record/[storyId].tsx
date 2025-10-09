import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Mic, Square, Play, RotateCcw } from 'lucide-react-native';
import { Audio } from 'expo-av';
import { theme } from '../../constants/theme';
import { Button } from '../../components/Button';
import { useAppStore } from '../../store/useAppStore';

export default function RecordScreen() {
  const router = useRouter();
  const { storyId } = useLocalSearchParams();
  const { user, addVoiceBlock, updateUser, addXP, unlockBadge } = useAppStore();

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

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

  const handleSubmit = () => {
    if (!recordedUri || !user) return;

    const newBlock = {
      id: Date.now().toString(),
      username: user.username,
      audioUri: recordedUri,
      duration: recordingDuration,
      timestamp: new Date().toISOString(),
      votes: 0,
    };

    addVoiceBlock(storyId as string, newBlock);
    updateUser({
      totalRecordings: user.totalRecordings + 1,
    });
    addXP(25);

    if (user.totalRecordings === 0) {
      unlockBadge('badge1');
    }

    router.back();
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
          <Button
            title="Submit Recording"
            onPress={handleSubmit}
            size="large"
            className="w-full"
          />
        </View>
      )}
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
