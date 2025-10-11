import { Audio } from 'expo-av';

/**
 * Sound Effects Manager for Sonichain
 * Provides simple sound effect playback for game-like feedback
 */

let isSoundEnabled = true;

export const SoundEffects = {
  /**
   * Enable or disable sound effects globally
   */
  setEnabled: (enabled: boolean) => {
    isSoundEnabled = enabled;
  },

  /**
   * Play a tap/click sound
   */
  playTap: async () => {
    if (!isSoundEnabled) return;
    try {
      const { sound } = await Audio.Sound.createAsync(
        {
          uri: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
        },
        { shouldPlay: true, volume: 0.3 }
      );
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.log('Sound effect error:', error);
    }
  },

  /**
   * Play success/level up sound
   */
  playSuccess: async () => {
    if (!isSoundEnabled) return;
    try {
      const { sound } = await Audio.Sound.createAsync(
        {
          uri: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
        },
        { shouldPlay: true, volume: 0.4 }
      );
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.log('Sound effect error:', error);
    }
  },

  /**
   * Play vote/whoosh sound
   */
  playWhoosh: async () => {
    if (!isSoundEnabled) return;
    try {
      const { sound } = await Audio.Sound.createAsync(
        {
          uri: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
        },
        { shouldPlay: true, volume: 0.3 }
      );
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.log('Sound effect error:', error);
    }
  },

  /**
   * Play recording beep
   */
  playRecordingBeep: async () => {
    if (!isSoundEnabled) return;
    try {
      const { sound } = await Audio.Sound.createAsync(
        {
          uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
        },
        { shouldPlay: true, volume: 0.5 }
      );
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.log('Sound effect error:', error);
    }
  },
};
