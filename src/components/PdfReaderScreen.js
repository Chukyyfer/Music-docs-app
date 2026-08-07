import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { File } from 'expo-file-system';
import { colors } from '../theme';

const PDFJS_VERSION = '3.11.174';
const PDFJS_BASE = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;

// Builds a self-contained HTML page that renders every page of the
// PDF onto its own <canvas> using pdf.js, lazily (only pages near the
// viewport get rendered) so long documents stay smooth to scroll.
function buildViewerHtml(base64) {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
<script src="${PDFJS_BASE}/pdf.min.js"></script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; background: #12141A; }
  body { display: flex; flex-direction: column; align-items: center; padding: 12px 0 40px; }
  #pdf-container { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 12px; }
  .page-wrap { width: calc(100% - 24px); background: #ffffff; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.4); }
  .page-wrap canvas { display: block; width: 100%; height: 100%; }
  #status { color: #9498A6; font-family: -apple-system, Roboto, sans-serif; font-size: 14px; padding: 40px 24px; text-align: center; }
</style>
</head>
<body>
  <div id="status">Loading document…</div>
  <div id="pdf-container"></div>
  <script>
    function post(msg) {
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
    }
    pdfjsLib.GlobalWorkerOptions.workerSrc = '${PDFJS_BASE}/pdf.worker.min.js';

    (async function () {
      try {
        const raw = atob('${base64}');
        const bytes = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);

        const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
        const statusEl = document.getElementById('status');
        if (statusEl) statusEl.remove();
        post({ type: 'ready', numPages: pdf.numPages });

        const container = document.getElementById('pdf-container');
        const contentWidth = document.body.clientWidth - 24;
        const pages = [];

        for (let n = 1; n <= pdf.numPages; n++) {
          const page = await pdf.getPage(n);
          const vp = page.getViewport({ scale: 1 });
          const scale = contentWidth / vp.width;
          const div = document.createElement('div');
          div.className = 'page-wrap';
          div.dataset.page = String(n);
          div.style.height = (vp.height * scale) + 'px';
          container.appendChild(div);
          pages.push({ div, page, scale });
        }

        post({ type: 'dimensions', height: document.body.scrollHeight });

        const rendered = new Set();
        async function renderPage(i) {
          if (rendered.has(i)) return;
          rendered.add(i);
          const { div, page, scale } = pages[i];
          const pixelRatio = Math.max(window.devicePixelRatio || 1, 2);
          const viewport = page.getViewport({ scale: scale * pixelRatio });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d', { alpha: false });
          div.innerHTML = '';
          div.appendChild(canvas);
          await page.render({ canvasContext: ctx, viewport, background: '#ffffff' }).promise;
        }

        const observer = new IntersectionObserver(
          (entries) => {
            let topMost = null;
            entries.forEach((entry) => {
              const idx = Number(entry.target.dataset.page) - 1;
              if (entry.isIntersecting) {
                renderPage(idx);
                if (topMost === null || idx < topMost) topMost = idx;
              }
            });
            if (topMost !== null) post({ type: 'page', page: topMost + 1 });
          },
          { rootMargin: '600px 0px', threshold: 0.01 }
        );

        pages.forEach((p) => observer.observe(p.div));
      } catch (err) {
        const statusEl = document.getElementById('status');
        const message = err && err.message ? err.message : String(err);
        if (statusEl) statusEl.textContent = 'Could not render this PDF.';
        post({ type: 'error', message });
      }
    })();
  </script>
</body>
</html>`;
}

// Warn before loading very large files in-app, since the whole file
// has to be base64-encoded and embedded in the WebView at once.
const LARGE_FILE_BYTES = 25 * 1024 * 1024;

export default function PdfReaderScreen({ document: doc, onClose, onOpenExternally }) {
  const [base64, setBase64] = useState(null);
  const [readError, setReadError] = useState(null);
  const [renderError, setRenderError] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const file = new File(doc.uri);
        const data = await file.base64();
        if (!cancelled) setBase64(data);
      } catch (err) {
        if (!cancelled) setReadError("Couldn't read this file from storage.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [doc.uri]);

  const html = useMemo(() => (base64 ? buildViewerHtml(base64) : null), [base64]);

  const handleMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'ready') setNumPages(data.numPages);
      if (data.type === 'page') setCurrentPage(data.page);
      if (data.type === 'error') setRenderError("Couldn't render this PDF.");
    } catch {
      // ignore malformed messages
    }
  }, []);

  const error = readError || renderError;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {doc.name}
        </Text>
        {numPages ? (
          <Text style={styles.pageIndicator}>
            {currentPage} / {numPages}
          </Text>
        ) : (
          <View style={{ width: 32 }} />
        )}
      </View>

      {error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={32} color={colors.textSecondary} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.fallbackBtn} onPress={() => onOpenExternally(doc)}>
            <Text style={styles.fallbackBtnText}>Open with system viewer</Text>
          </TouchableOpacity>
        </View>
      ) : !html ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.docs} />
        </View>
      ) : (
        <WebView
          originWhitelist={['*']}
          source={{ html }}
          style={styles.webview}
          javaScriptEnabled
          domStorageEnabled
          onMessage={handleMessage}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.center}>
              <ActivityIndicator color={colors.docs} />
            </View>
          )}
        />
      )}
    </View>
  );
}

export function isLargeFile(bytes) {
  return bytes > LARGE_FILE_BYTES;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: 4,
  },
  iconBtn: { padding: 6 },
  title: { flex: 1, color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  pageIndicator: { color: colors.textSecondary, fontSize: 12, paddingRight: 6 },
  webview: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  errorText: { color: colors.textSecondary, textAlign: 'center' },
  fallbackBtn: {
    backgroundColor: colors.docs,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  fallbackBtnText: { color: colors.bg, fontWeight: '700', fontSize: 13 },
});
