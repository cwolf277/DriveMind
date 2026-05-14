# DriveMind

Hands-free voice note-taking for drivers — built with React Native (Expo). Speak naturally; OpenAI Whisper transcribes, the app cleans + structures the text, and notes sync to Firebase Firestore.

> **There's also a [web version](https://github.com/cwolf277/drivemind-web)** that runs in any modern browser — same features, no app install needed for demo purposes.

## What it does

Existing voice-note apps still require tap → record → stop → save → edit. While you're driving you can't tap. DriveMind is purpose-built for a single hands-free loop:

> **"Hey DriveMind, remind me to email Sarah about the design review on Thursday."**
>
> *"Got it."*

## Features

- **Real-time voice → structured note pipeline** using OpenAI Whisper (3–5s end-to-end)
- **"Hey DriveMind" wake-phrase** with continuous voice activity detection (VAD)
- **Voice-activated listening mode** — auto-records when you speak, auto-stops on silence
- **Post-processed transcription** — fillers stripped, punctuation normalized, title / tags / mood derived
- **Mood tagging** — manual + automatic detection from text
- **Audio feedback** — spoken confirmations (`expo-speech`) + haptics (`expo-haptics`)
- **Firebase Firestore** for persistent, scalable note storage with `AsyncStorage` fallback for offline / unconfigured installs
- **Optional GPT-4o-mini structuring** — extracts title, summary, tags, and mood as JSON
- **SOLID-layered architecture** — services / hooks / components

## Architecture

```
DriveMind/
├── App.js                       composition only
├── config/firebase.js           Firebase init + isFirebaseConfigured flag
├── services/
│   ├── storage.js               Firebase Firestore | AsyncStorage interface
│   ├── transcription.js         OpenAI Whisper (axios + FormData)
│   ├── noteStructuring.js       cleaning + tags + mood + GPT structuring
│   └── audioFeedback.js         expo-speech + expo-haptics wrapper
├── hooks/
│   ├── useRecording.js          manual record + metering
│   ├── useNotes.js              CRUD over the storage interface
│   └── useVoiceActivation.js    continuous VAD + wake-phrase
└── components/
    ├── RecordButton.js
    ├── MoodSelector.js
    ├── NoteCard.js
    └── NotesFeed.js
```

Each layer depends only on the one below it. Replacing the transcription backend (e.g. Whisper → on-device model) or the storage backend (Firebase → Supabase) touches a single file each.

## Setup

```bash
git clone https://github.com/cwolf277/DriveMind.git
cd DriveMind
npm install
cp .env.example .env
# fill in OPENAI_API_KEY and optionally Firebase keys
npx expo start
```

Open in **Expo Go** on your phone, or launch in an iOS / Android simulator.

See [`SETUP.md`](SETUP.md) for full Firebase setup instructions.

## Tech stack

- **Framework**: React Native + Expo SDK 53
- **Audio**: `expo-av` (recording + metering for VAD)
- **Transcription**: OpenAI Whisper (`whisper-1`)
- **Structuring**: OpenAI GPT-4o-mini (optional)
- **Storage**: Firebase Firestore SDK v10 with `@react-native-async-storage/async-storage` fallback
- **TTS**: `expo-speech`
- **Haptics**: `expo-haptics`
- **State**: React hooks (no external state library)

## Security notes

- `OPENAI_API_KEY` and Firebase config are bundled into the client via `react-native-dotenv`. Fine for development; for production move Whisper / GPT calls behind a server (Cloud Functions, Cloudflare Worker, etc.) so the key isn't exposed.
- Firestore dev rules are wide-open in `SETUP.md`. Add Firebase Auth + per-user rules before shipping.

## Related

- **[cwolf277/drivemind-web](https://github.com/cwolf277/drivemind-web)** — web port (React + Vite) with screenshots, live demo, and additional features (conversational wake flow, screen wake lock for driving mode)
