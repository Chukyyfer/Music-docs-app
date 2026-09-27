# Music & Docs

A mobile app (built with Expo / React Native) with two sections:

- **Music** — pick audio files from your phone, they're copied into
  the app's private storage, and you get a mini player with play/pause,
  skip, a scrubber, and **background playback** (keeps playing when
  you lock the screen or switch to another app).
- **Documents** — pick PDFs from your phone, they're saved into the
  app, and tapping one opens a **built-in scrollable reader** (pinch
  to zoom, scroll through every page) — no need for a separate PDF
  app. You can keep listening to music while you read, since the
  mini player stays on screen.

Everything is stored locally on the device (no account, no server).

## Setup

You'll need [Node.js](https://nodejs.org) and the **Expo Go** app on
your phone (search "Expo Go" in the App Store / Play Store).

```bash
cd music-docs-app
npm install

# Important: this auto-corrects every expo-* package to the exact
# version that matches your installed Expo SDK. I hand-wrote the
# versions in package.json, so always run this once before starting.
npx expo install --fix

npx expo start
```

Scan the QR code that appears with the Expo Go app (Android: in-app
scanner; iOS: Camera app) and the app will open on your phone.

## How the PDF reader works

There's no native PDF library involved (those need a custom "dev
client" build, which won't run in plain Expo Go). Instead, the reader
loads your PDF's bytes into a hidden web page and renders every page
onto a canvas using Mozilla's `pdf.js`, scrolled and zoomed like a
normal document. Two things worth knowing:

- The **first time** you open a PDF, it needs a moment of internet
  access to fetch the `pdf.js` renderer itself (a small script from a
  CDN) — the PDF content never leaves your device, only the generic
  renderer code gets downloaded.
- Very large PDFs (25 MB+) will prompt you to choose between reading
  in-app or opening in your phone's system PDF viewer, since huge
  files can be slow to load this way.

## How background music works

- `app.json` and the player are already configured for background
  playback (`shouldPlayInBackground`, plus the Android foreground
  service permissions).
- On Android specifically, the app registers "lock screen controls"
  the moment a track starts (`setActiveForLockScreen`) — this is what
  keeps Android from silently killing playback after ~3 minutes in
  the background. You'll see a persistent media notification with
  play/pause controls while music is playing.
- **Heads up:** since you're running this through Expo Go (not a
  custom build), Android's background-audio notification may not
  look/behave exactly as configured — Expo Go uses its own generic
  version of these native modules. For the most reliable, fully
  polished background-audio experience (and to publish the app),
  you'd eventually want an [EAS development build](https://docs.expo.dev/develop/development-builds/introduction/),
  which applies your exact `app.json` config. Basic background
  playback should still work fine in Expo Go for everyday testing.






## Download

[📱 Download Music App APK](https://github.com/Chukyyfer/Music-docs-app/releases/tag/v1.0.0)








## Project structure

```
App.js                      Root component, tab switching
src/
  theme.js                  Colors
  context/PlayerContext.js  Global audio player (expo-audio), background + lock screen
  utils/library.js          File picking, copying, deleting, previewing
  utils/storage.js          Saves your library lists (AsyncStorage)
  components/
    TabBar.js                Bottom Music / Documents switcher
    PlayerBar.js              Mini player with scrubber & controls
    PdfReaderScreen.js        In-app scrollable PDF reader (pdf.js + WebView)
    EmptyState.js
  screens/
    MusicScreen.js
    DocumentsScreen.js
```

## Notes & things you might want to add next

- Track/document names are taken from the file name — you could add
  a rename feature or read ID3 tags for real song titles later.
- Search/jump-to-page within the PDF reader would be a natural next
  step (pdf.js supports text search; it's just not wired up yet).
- Everything's local-only right now; syncing across devices would
  need a backend.
