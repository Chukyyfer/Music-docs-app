import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  music: 'library:music',
  documents: 'library:documents',
};

// kind is 'music' | 'documents'
export async function loadItems(kind) {
  try {
    const raw = await AsyncStorage.getItem(KEYS[kind]);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Failed to load library:', err);
    return [];
  }
}

export async function saveItems(kind, items) {
  try {
    await AsyncStorage.setItem(KEYS[kind], JSON.stringify(items));
  } catch (err) {
    console.warn('Failed to save library:', err);
  }
}
