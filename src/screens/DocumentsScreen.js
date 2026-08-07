import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { loadItems, saveItems } from '../utils/storage';
import { pickAndImportFiles, deleteImportedFile, previewFile } from '../utils/library';
import { colors } from '../theme';
import EmptyState from '../components/EmptyState';
import PdfReaderScreen, { isLargeFile } from '../components/PdfReaderScreen';

function formatSize(bytes) {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function DocumentsScreen() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readerDoc, setReaderDoc] = useState(null);

  useEffect(() => {
    loadItems('documents').then((items) => {
      setDocs(items);
      setLoading(false);
    });
  }, []);

  const handleAdd = useCallback(async () => {
    const imported = await pickAndImportFiles('documents', 'application/pdf');
    if (imported.length === 0) return;
    const next = [...imported, ...docs];
    setDocs(next);
    await saveItems('documents', next);
  }, [docs]);

  const openExternally = useCallback(async (item) => {
    const ok = await previewFile(item.uri, item.name);
    if (!ok) {
      Alert.alert('Unable to open', 'No app on this device can preview this PDF.');
    }
  }, []);

  const handleOpen = useCallback(
    (item) => {
      if (isLargeFile(item.size)) {
        Alert.alert(
          'Large file',
          `"${item.name}" is ${formatSize(item.size)}. Reading it in-app may be slow.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Use system viewer', onPress: () => openExternally(item) },
            { text: 'Read in app', onPress: () => setReaderDoc(item) },
          ]
        );
        return;
      }
      setReaderDoc(item);
    },
    [openExternally]
  );

  const handleDelete = useCallback(
    (item) => {
      Alert.alert('Remove document', `Remove "${item.name}" from your library?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const next = docs.filter((d) => d.id !== item.id);
            setDocs(next);
            await saveItems('documents', next);
            deleteImportedFile(item.uri);
          },
        },
      ]);
    },
    [docs]
  );

  if (readerDoc) {
    return (
      <PdfReaderScreen
        document={readerDoc}
        onClose={() => setReaderDoc(null)}
        onOpenExternally={(item) => {
          setReaderDoc(null);
          openExternally(item);
        }}
      />
    );
  }

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <TouchableOpacity style={styles.rowMain} onPress={() => handleOpen(item)} activeOpacity={0.7}>
        <View style={styles.iconWrap}>
          <Ionicons name="document-text" size={18} color={colors.docs} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.itemMeta}>
            {formatSize(item.size)} · {new Date(item.addedAt).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => openExternally(item)} hitSlop={10} style={styles.sideBtn}>
        <Ionicons name="open-outline" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={10} style={styles.sideBtn}>
        <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Documents</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
          <Ionicons name="add" size={20} color={colors.bg} />
          <Text style={styles.addButtonText}>Add PDF</Text>
        </TouchableOpacity>
      </View>

      {!loading && docs.length === 0 ? (
        <EmptyState
          icon="document-outline"
          title="No documents yet"
          subtitle="Add PDF files from your device to build your library."
        />
      ) : (
        <FlatList
          data={docs}
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
    backgroundColor: colors.docs,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: { color: colors.bg, fontWeight: '700', fontSize: 13 },
  list: { paddingHorizontal: 12, paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    gap: 4,
  },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  sideBtn: { padding: 4 },
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
