# DriveMind setup

## 1. Install new dependencies

```bash
npm install
```

This pulls in the additions:
- `firebase` — Firestore-backed persistent storage
- `expo-speech` — spoken audio feedback ("note saved", "listening")
- `expo-haptics` — haptic feedback on record start / save / errors

## 2. Configure environment

Copy `.env.example` to `.env` and fill in values:

```
OPENAI_API_KEY=sk-...
```

`OPENAI_API_KEY` is required (Whisper transcription + optional GPT structuring).

## 3. (Optional) Connect Firebase

Without Firebase keys the app falls back to local AsyncStorage. To enable cloud sync:

1. Create a Firebase project and enable **Firestore (in production mode)**
2. Add a Web app → copy the config keys into `.env`:

```
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
FIREBASE_PROJECT_ID=...
FIREBASE_STORAGE_BUCKET=...
FIREBASE_MESSAGING_SENDER_ID=...
FIREBASE_APP_ID=...
```

3. Add a Firestore rule for the `notes` collection (replace later when you add auth):

```
match /notes/{doc} {
  allow read, write: if true; // dev only — restrict before shipping
}
```

The app detects whether Firebase is configured at startup (`isFirebaseConfigured` in `config/firebase.js`) and routes through `services/storage.js` accordingly.

## 4. Architecture

```
App.js                          composition / screen layout
config/firebase.js              Firebase init + isFirebaseConfigured flag
services/
  storage.js                    storage interface (Firebase | AsyncStorage)
  transcription.js              OpenAI Whisper
  noteStructuring.js            text cleaning + tags + mood + GPT structuring
  audioFeedback.js              expo-speech + expo-haptics wrapper
hooks/
  useRecording.js               manual record/stop with metering
  useNotes.js                   load/save/delete/update notes
  useVoiceActivation.js         continuous listening + VAD + wake-phrase
components/
  RecordButton.js
  MoodSelector.js
  NoteCard.js
  NotesFeed.js
```

Each layer depends on the one below it (components → hooks → services → config). This keeps the app open to swapping any backend (e.g. replacing Whisper with a self-hosted model) without touching UI.

## 5. Features

- **Manual recording** — tap the record button, tap again to stop and transcribe.
- **Listening mode** — toggle on; the app auto-records when you start speaking and auto-stops on ~1.2s of silence (voice activity detection).
- **Wake phrase** — when "Require Hey DriveMind" is on, segments without "hey drivemind" / "drive mind" are discarded. The phrase is stripped from the saved note.
- **Mood tagging** — pick a mood before recording, or let local/GPT structuring auto-detect it from the transcript.
- **Smart structuring (GPT)** — when on, sends the cleaned transcript to `gpt-4o-mini` to extract title, summary, tags, and mood as JSON. Off by default to save tokens.
- **Audio feedback** — spoken confirmations ("listening", "note saved") + haptic taps.
- **Cloud sync** — Firebase Firestore when configured; AsyncStorage fallback otherwise.

## 6. Notes for iOS Expo Go

Wake-phrase mode and listening mode use `expo-av`'s metering callback. Make sure to grant microphone permission on first launch. The continuous listening loop ends recordings on silence and immediately restarts a new one — you may briefly see two record indicators on iOS during the handover.
