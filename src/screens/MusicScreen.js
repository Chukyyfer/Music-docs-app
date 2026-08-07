import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { loadItems, saveItems } from '../utils/storage';
import { pickAndImportFiles, deleteImportedFile } from '../utils/library';
import { usePlayer } from '../context/PlayerContext';
import { colors } from '../theme';
import EmptyState from '../components/EmptyState';

function formatSize(bytes) {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function MusicScreen() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentTrack, isPlaying, playAt } = usePlayer();

  useEffect(() => {
    loadItems('music').then((items) => {
      setTracks(items);
      setLoading(false);
    });
  }, []);

  const handleAdd = useCallback(async () => {
    const imported = await pickAndImportFiles('music', 'audio/*');
    if (imported.length === 0) return;
    const next = [...imported, ...tracks];
    setTracks(next);
    await saveItems('music', next);
  }, [tracks]);

  const handleDelete = useCallback(
    (item) => {
      Alert.alert('Remove track', `Remove "${item.name}" from your library?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const next = tracks.filter((t) => t.id !== item.id);
            setTracks(next);
            await saveItems('music', next);
            deleteImportedFile(item.uri);
          },
        },
      ]);
    },
    [tracks]
  );

  const renderItem = ({ item, index }) => {
    const active = currentTrack?.id === item.id;
    return (
      <TouchableOpacity
        style={[styles.row, active && styles.rowActive]}
        onPress={() => playAt(tracks, index)}
        activeOpacity={0.7}
      >
        <View style={styles.iconWrap}>
          <Ionicons
            name={active && isPlaying ? 'volume-high' : 'musical-note'}
            size={18}
            color={colors.music}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.itemMeta}>{formatSize(item.size)}</Text>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={10}>
          <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Music</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Ionicons name="add" size={20} color={colors.bg} />
          <Text style={styles.addButtonText}>Add music</Text>
        </TouchableOpacity>
      </View>

      {!loading && tracks.length === 0 ? (
        <EmptyState
          icon="musical-notes-outline"
          title="No music yet"
          subtitle="Add audio files from your device to start listening."
        />
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: { color: colors.textPrimary, fontSize: 26, fontWeight: '800' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.music,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: { color: colors.bg, fontWeight: '700', fontSize: 13 },
  list: { paddingHorizontal: 12, paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  rowActive: { borderWidth: 1, borderColor: colors.music },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  itemMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
});
