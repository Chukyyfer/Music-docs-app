import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '../context/PlayerContext';
import { colors } from '../theme';

function formatTime(seconds) {
  if (!seconds || Number.isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlayPause,
    playNext,
    playPrevious,
    seekTo,
    hasNext,
    hasPrevious,
  } = usePlayer();

  if (!currentTrack) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title} numberOfLines={1}>
        {currentTrack.name}
      </Text>

      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={duration > 0 ? duration : 1}
        value={currentTime}
        onSlidingComplete={seekTo}
        minimumTrackTintColor={colors.music}
        maximumTrackTintColor={colors.border}
        thumbTintColor={colors.music}
      />

      <View style={styles.row}>
        <Text style={styles.time}>{formatTime(currentTime)}</Text>

        <View style={styles.controls}>
          <TouchableOpacity onPress={playPrevious} disabled={!hasPrevious} hitSlop={8}>
            <Ionicons
              name="play-skip-back"
              size={22}
              color={hasPrevious ? colors.textPrimary : colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={togglePlayPause} style={styles.playBtn}>
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color={colors.bg} />
          </TouchableOpacity>

          <TouchableOpacity onPress={playNext} disabled={!hasNext} hitSlop={8}>
            <Ionicons
              name="play-skip-forward"
              size={22}
              color={hasNext ? colors.textPrimary : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.time}>{formatTime(duration)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceAlt,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  title: { color: colors.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 2 },
  slider: { width: '100%', height: 28 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  time: { color: colors.textSecondary, fontSize: 11, width: 36 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 22 },
  playBtn: {
    backgroundColor: colors.music,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
