import * as DocumentPicker from 'expo-document-picker';
import { File, Directory, Paths } from 'expo-file-system';

// Returns (and creates if needed) the app's private folder for a
// given library ('music' or 'documents'). Files copied in here are
// safe from the OS clearing them, unlike the picker's cache copy.
function getLibraryDirectory(kind) {
  const dir = new Directory(Paths.document, kind);
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
  return dir;
}

function stripExtension(name) {
  const idx = name.lastIndexOf('.');
  return idx > 0 ? name.slice(0, idx) : name;
}

// Opens the system file picker, then copies every picked file into
// the app's own document storage so it persists across app restarts.
export async function pickAndImportFiles(kind, mimeTypes) {
  const result = await DocumentPicker.getDocumentAsync({
    type: mimeTypes,
    multiple: true,
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.length) return [];

  const dir = getLibraryDirectory(kind);
  const imported = [];

  for (const asset of result.assets) {
    try {
      const source = new File(asset.uri);
      // Prefix with a timestamp so same-named files never collide.
      const safeName = `${Date.now()}-${asset.name}`;
      const destination = new File(dir, safeName);
      await source.copy(destination);

      imported.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: stripExtension(asset.name),
        fileName: asset.name,
        uri: destination.uri,
        size: asset.size ?? destination.size ?? 0,
        mimeType: asset.mimeType ?? destination.type ?? '',
        addedAt: Date.now(),
      });
    } catch (err) {
      console.warn('Failed to import file:', asset.name, err);
    }
  }

  return imported;
}

export function deleteImportedFile(uri) {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch (err) {
    console.warn('Failed to delete file:', err);
  }
}

// Opens a file with the platform's native preview flow (Quick Look
// on iOS, an ACTION_VIEW chooser on Android) — no extra PDF reader
// dependency required. Returns false if nothing could preview it.
export async function previewFile(uri, title) {
  const file = new File(uri);
  try {
    if (await file.canPreview()) {
      await file.preview({ title });
      return true;
    }
  } catch (err) {
    console.warn('Preview failed:', err);
  }
  return false;
}
