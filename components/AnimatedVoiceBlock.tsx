// AnimatedVoiceBlock.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Play, Pause } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { VoiceBlock } from '../types';
import { usePinata } from '../hooks/usePinata';

interface AnimatedVoiceBlockProps {
  block: VoiceBlock;
  isPlaying?: boolean;
  onPlayPress?: () => void;
  index?: number;
}

/**
 * Safely convert raw blockchain submission shape into VoiceBlock.
 * Exported so you can call it where you fetch chain data.
 */
export const convertBlockchainSubmission = (
  submission: any,
  submissionId?: number
): VoiceBlock => {
  const shortenPrincipal = (p: string) => {
    if (!p || typeof p !== 'string') return 'Unknown';
    if (p.length <= 12) return p;
    return `${p.slice(0, 6)}...${p.slice(-4)}`;
  };

  const toNumber = (val: any, fallback = 0): number => {
    if (val === undefined || val === null) return fallback;
    if (typeof val === 'number') return val;
    if (typeof val === 'string' && /^\d+$/.test(val)) return Number(val);
    if (typeof val === 'object' && val.value !== undefined)
      return toNumber(val.value, fallback);
    return fallback;
  };

  const normalizeTimestampIso = (raw: any): string => {
    const num = toNumber(raw, 0);
    if (num <= 0) return new Date().toISOString();
    // heuristic: >1e12 ms, else seconds
    const maybeMs = num > 1e12;
    const millis = maybeMs ? num : num * 1000;
    return new Date(millis).toISOString();
  };

  const contributorRaw =
    submission?.contributor?.value ?? submission?.contributor;
  const uriRaw = submission?.uri?.value ?? submission?.uri;
  const submittedAtRaw =
    submission?.['submitted-at']?.value ?? submission?.['submitted-at'];
  const voteCountRaw =
    submission?.['vote-count']?.value ?? submission?.['vote-count'];

  const contributor =
    typeof contributorRaw === 'string'
      ? contributorRaw
      : contributorRaw?.toString?.() ?? 'Unknown';
  const uri = typeof uriRaw === 'string' ? uriRaw : uriRaw?.toString?.() ?? '';

  const submittedAtIso = normalizeTimestampIso(submittedAtRaw);
  const voteCount = toNumber(voteCountRaw, 0);

  return {
    id:
      submissionId?.toString() ||
      submission?.['submission-id']?.toString?.() ||
      '0',
    username: shortenPrincipal(contributor),
    audioUri: uri,
    audioCid: uri,
    duration: 0,
    timestamp: submittedAtIso,
    votes: voteCount,
  };
};

/**
 * Enrich a VoiceBlock with IPFS data (duration and displayName if available).
 * Uses the same getFromIPFS method as in useStories.ts for consistency.
 */
const enrichWithIpfsData = async (
  block: VoiceBlock,
  getFromIPFS: (cid: string) => Promise<any>
): Promise<VoiceBlock> => {
  try {
    const cidLike = block.audioCid || block.audioUri || '';
    if (!cidLike) return block;

    // Normalize CID from ipfs:// or /ipfs/ or raw cid
    const cid = cidLike.replace(/^ipfs:\/\//, '').replace(/^\/ipfs\//, '');

    // Check if it's a valid IPFS hash format
    const isIPFSHash =
      /^Qm[a-zA-Z0-9]{44}$/.test(cid) || /^baf[a-zA-Z0-9]{52,}$/.test(cid);

    if (!isIPFSHash) {
      // If not an IPFS hash, just use the raw URI
      return block;
    }

    console.log(`🔍 Fetching IPFS metadata for audio: ${cid}`);

    // Fetch metadata from IPFS using the same method as useStories
    const ipfsMetadata = await getFromIPFS(cid);

    console.log('🔍 IPFS metadata:', ipfsMetadata);

    if (!ipfsMetadata) {
      console.warn('⚠️ No IPFS metadata found for:', cid);
      return block;
    }

    // Extract metadata fields (same pattern as useStories)
    const duration =
      typeof ipfsMetadata.duration === 'number'
        ? ipfsMetadata.duration
        : Number(ipfsMetadata.duration) || block.duration || 0;

    const displayName =
      ipfsMetadata.artist ||
      ipfsMetadata.author ||
      ipfsMetadata.username ||
      ipfsMetadata.displayName ||
      ipfsMetadata.name ||
      block.username;

    // Construct the resolved URI for the audio file
    const audioFile =
      ipfsMetadata.file || ipfsMetadata.audio || ipfsMetadata.audioFile;
    const resolvedUri = audioFile
      ? `https://ipfs.io/ipfs/${cid}/${audioFile}`
      : `https://ipfs.io/ipfs/${cid}`;

    console.log('✅ IPFS audio metadata enriched:', {
      duration,
      displayName,
      resolvedUri,
    });

    return {
      ...block,
      duration,
      username: displayName,
      audioUri: resolvedUri,
    };
  } catch (err) {
    console.warn('⚠️ Failed to enrich with IPFS data:', err);
    return block;
  }
};

export const AnimatedVoiceBlock: React.FC<AnimatedVoiceBlockProps> = ({
  block,
  isPlaying = false,
  onPlayPress,
  index = 0,
}) => {
  // Use Pinata hook for IPFS data fetching (same as useStories)
  const { getFromIPFS } = usePinata();

  // Local state to allow enriching the block without mutating prop
  const [displayBlock, setDisplayBlock] = useState<VoiceBlock>(block);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0); // Current position in milliseconds
  const [playbackDuration, setPlaybackDuration] = useState(0); // Total duration in milliseconds

  useEffect(() => {
    console.log('🎵 AnimatedVoiceBlock received block:', {
      id: block.id,
      username: block.username,
      audioUri: block.audioUri,
      audioCid: block.audioCid,
      duration: block.duration,
    });
    // Keep state in sync if parent provides a new block object
    setDisplayBlock(block);

    // Reset playback state when block changes
    setPlaybackPosition(0);
    setPlaybackDuration(0);
  }, [block]);

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      if (sound) {
        console.log('🔊 Unloading sound');
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Enrich with IPFS metadata only if it's actually an IPFS hash
  useEffect(() => {
    let mounted = true;

    const audioUriOrCid =
      displayBlock?.audioCid || displayBlock?.audioUri || '';

    // Check if it's a Supabase URL (don't enrich Supabase URLs)
    const isSupabaseUrl =
      audioUriOrCid.includes('supabase') || audioUriOrCid.startsWith('http');

    // Only enrich if it's an IPFS hash (not a Supabase URL or HTTP URL)
    const isIPFSHash =
      !isSupabaseUrl &&
      (/^Qm[a-zA-Z0-9]{44}$/.test(audioUriOrCid) ||
        /^baf[a-zA-Z0-9]{52,}$/.test(audioUriOrCid));

    const needsEnrich =
      isIPFSHash &&
      (displayBlock?.duration === 0 ||
        displayBlock?.duration === undefined ||
        (typeof displayBlock?.username === 'string' &&
          displayBlock.username.includes('...')));

    console.log('🔍 Audio enrichment check:', {
      audioUriOrCid: audioUriOrCid.substring(0, 50),
      isSupabaseUrl,
      isIPFSHash,
      needsEnrich,
    });

    if (!needsEnrich) return;

    (async () => {
      // Pass getFromIPFS to enrichment function (same pattern as useStories)
      const enriched = await enrichWithIpfsData(displayBlock, getFromIPFS);
      if (!mounted) return;
      setDisplayBlock(enriched);
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    displayBlock.audioCid,
    displayBlock.audioUri,
    displayBlock.username,
    getFromIPFS,
  ]);

  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(buttonScaleAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(buttonScaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isPlaying]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Use displayBlock for UI
  const uiBlock = displayBlock;

  // Calculate display duration (use actual playback duration if available, otherwise fallback)
  const displayDurationSecs =
    playbackDuration > 0
      ? Math.floor(playbackDuration / 1000)
      : uiBlock.duration ?? 0;

  // Calculate playback progress percentage (0-1)
  const playbackProgress =
    playbackDuration > 0 ? playbackPosition / playbackDuration : 0;

  const handlePress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // If parent provides onPlayPress, use it (for coordinating multiple players)
    if (onPlayPress) {
      onPlayPress();
    }

    // Load and play audio if not already loaded
    if (!sound && uiBlock.audioUri && !isLoadingAudio) {
      setIsLoadingAudio(true);
      try {
        console.log('🔊 Loading audio from:', uiBlock.audioUri);

        // Configure audio mode
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: uiBlock.audioUri },
          { shouldPlay: true, progressUpdateIntervalMillis: 100 }, // Update every 100ms for smooth waveform
          (status) => {
            // Audio status updates
            if (status.isLoaded) {
              // Update duration from actual audio file
              if (status.durationMillis) {
                setPlaybackDuration(status.durationMillis);
                const durationSecs = Math.floor(status.durationMillis / 1000);
                if (displayBlock.duration !== durationSecs) {
                  setDisplayBlock({ ...displayBlock, duration: durationSecs });
                  console.log('🔊 Audio duration:', durationSecs, 'seconds');
                }
              }

              // Update playback position for waveform sync
              if (status.positionMillis !== undefined) {
                setPlaybackPosition(status.positionMillis);
              }

              // Handle playback finished
              if (status.didJustFinish) {
                console.log('🔊 Audio finished playing');
                setPlaybackPosition(0);
                if (onPlayPress) onPlayPress();
              }
            }
          }
        );

        setSound(newSound);
        console.log('✅ Audio playing');
      } catch (error) {
        console.error('❌ Error loading audio:', error);
      } finally {
        setIsLoadingAudio(false);
      }
    } else if (sound) {
      // Toggle play/pause
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        if (isPlaying) {
          await sound.pauseAsync();
          console.log('⏸️ Audio paused');
        } else {
          await sound.playAsync();
          console.log(
            '▶️ Audio resumed from:',
            Math.floor(playbackPosition / 1000),
            'seconds'
          );
        }
      }
    }
  };

  // Reset playback position when not playing
  useEffect(() => {
    if (!isPlaying && sound) {
      // When stopped, reset to beginning
      const resetPosition = async () => {
        try {
          const status = await sound.getStatusAsync();
          if (
            status.isLoaded &&
            status.positionMillis === status.durationMillis
          ) {
            // Only reset if we're at the end
            setPlaybackPosition(0);
          }
        } catch (error) {
          console.warn('Error checking sound status:', error);
        }
      };
      resetPosition();
    }
  }, [isPlaying, sound]);

  return (
    <Animated.View
      style={{
        opacity: opacityAnim,
        transform: [{ translateY: translateYAnim }],
      }}
    >
      <View className="flex-row bg-card rounded-2xl p-md mb-md border border-border overflow-hidden relative">
        {/* Glow background when playing */}
        {isPlaying && (
          <View
            className="absolute inset-0"
            style={{ backgroundColor: '#00FFFF', opacity: 0.1 }}
          />
        )}

        {/* Play button */}
        <TouchableOpacity
          className="w-11 h-11 rounded-full bg-primary items-center justify-center mr-md relative z-10"
          onPress={handlePress}
          activeOpacity={0.7}
          disabled={isLoadingAudio}
        >
          <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
            {isLoadingAudio ? (
              <Text className="text-xs text-white">...</Text>
            ) : isPlaying ? (
              <Pause size={20} color="#FFFFFF" fill="#FFFFFF" />
            ) : (
              <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
            )}
          </Animated.View>
        </TouchableOpacity>

        {/* Content */}
        <View className="flex-1 relative z-10">
          <View className="flex-row justify-between items-center mb-sm">
            <Text className="text-body text-text-primary font-semibold">
              {uiBlock.username}
            </Text>
            <Text className="text-caption text-text-secondary">
              {formatDuration(displayDurationSecs)}
            </Text>
          </View>

          {/* Waveform - synced with actual playback progress */}
          <View className="flex-row items-center gap-0.5 h-10">
            {Array.from({ length: 40 }).map((_, i) => {
              // Random height for visual variety
              const height = Math.random() * 30 + 10;

              // Calculate if this bar should be active based on playback progress
              const barProgress = i / 40; // This bar represents progress from 0 to barProgress
              const isActive = isPlaying && barProgress <= playbackProgress;

              return (
                <View
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{
                    height: height,
                    backgroundColor: isActive ? '#00FFFF' : '#3D1F2E',
                  }}
                />
              );
            })}
          </View>

          {uiBlock.votes !== undefined && (
            <View className="flex-row items-center mt-sm">
              <Text className="text-caption text-text-secondary">
                ❤️ {uiBlock.votes} votes
              </Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
};
