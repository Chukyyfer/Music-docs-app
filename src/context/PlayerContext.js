import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Platform } from 'react-native';
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
  requestNotificationPermissionsAsync,
} from 'expo-audio';

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  // A single persistent player for the whole app. Switching tracks
  // is done imperatively with player.replace(), not by re-creating
  // the hook, since hooks can't be called conditionally.
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  useEffect(() => {
    // doNotMix is required for setActiveForLockScreen (below) to
    // correctly associate lock-screen / notification controls with
    // this player, and shouldPlayInBackground keeps audio going when
    // the app is backgrounded or the screen locks.
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    });

    // Android 13+ needs this permission granted for the media
    // notification (with its play/pause/skip controls) to be shown.
    // Without it, background playback still works but silently stops
    // after ~3 minutes since there's no foreground-service notification.
    if (Platform.OS === 'android') {
      if (typeof requestNotificationPermissionsAsync === 'function') { requestNotificationPermissionsAsync().catch(() => {}); }
    }
  }, []);

  const playAt = useCallback(
    (list, index) => {
      const track = list[index];
      if (!track) return;
      setQueue(list);
      setCurrentIndex(index);
      player.replace({ uri: track.uri });
      player.play();
      // Registers this player for lock-screen / notification controls
      // with the track's title. On Android this is what keeps
      // playback alive indefinitely in the background (see note above).
      player.setActiveForLockScreen(true, {
        title: track.name,
        artist: 'Music library',
      });
    },
    [player]
  );

  const togglePlayPause = useCallback(() => {
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  }, [player, status.playing]);

  const playNext = useCallback(() => {
    if (currentIndex < queue.length - 1) playAt(queue, currentIndex + 1);
  }, [queue, currentIndex, playAt]);

  const playPrevious = useCallback(() => {
    if (currentIndex > 0) playAt(queue, currentIndex - 1);
  }, [queue, currentIndex, playAt]);

  const seekTo = useCallback(
    (seconds) => {
      player.seekTo(seconds);
    },
    [player]
  );

  const currentTrack = currentIndex >= 0 ? queue[currentIndex] : null;

  const value = {
    currentTrack,
    isPlaying: !!status.playing,
    currentTime: status.currentTime ?? 0,
    duration: status.duration ?? 0,
    playAt,
    togglePlayPause,
    playNext,
    playPrevious,
    seekTo,
    hasNext: currentIndex < queue.length - 1,
    hasPrevious: currentIndex > 0,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within a PlayerProvider');
  return ctx;
}
