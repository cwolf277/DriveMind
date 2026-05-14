import React, { useCallback, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useRecording } from './hooks/useRecording';
import { useNotes } from './hooks/useNotes';
import {
  useVoiceActivation,
  hasWakePhrase,
  stripWakePhrase,
} from './hooks/useVoiceActivation';
import { transcribeAudio } from './services/transcription';
import { structureNote } from './services/noteStructuring';
import { feedback } from './services/audioFeedback';
import { storageBackend } from './services/storage';

import { RecordButton } from './components/RecordButton';
import { MoodSelector } from './components/MoodSelector';
import { NotesFeed } from './components/NotesFeed';

export default function App() {
  const [processing, setProcessing] = useState(false);
  const [pendingMood, setPendingMood] = useState(null);
  const [useGPTStructuring, setUseGPTStructuring] = useState(false);
  const [requireWakePhrase, setRequireWakePhrase] = useState(false);

  const recording = useRecording();
  const { notes, addNote, removeNote, patchNote } = useNotes();

  const ingestSegment = useCallback(
    async (uri, { requireWakePhrase: needWake } = {}) => {
      try {
        setProcessing(true);
        const { text: rawText, latencyMs } = await transcribeAudio(uri);

        let payloadText = rawText;
        if (needWake) {
          if (!hasWakePhrase(rawText)) {
            setProcessing(false);
            return;
          }
          feedback.wakeWordDetected();
          payloadText = stripWakePhrase(rawText);
        }

        if (!payloadText.trim()) {
          setProcessing(false);
          return;
        }

        const structured = await structureNote(payloadText, { useGPT: useGPTStructuring });

        await addNote({
          ...structured,
          mood: pendingMood || structured.detectedMood || null,
          timestamp: new Date().toISOString(),
          audioUri: uri,
          transcriptionLatencyMs: latencyMs,
        });
        setPendingMood(null);
      } catch (err) {
        console.warn('ingestSegment failed', err);
        feedback.error('Transcription failed');
        Alert.alert('Error', err.message || 'Could not process recording.');
      } finally {
        setProcessing(false);
      }
    },
    [addNote, pendingMood, useGPTStructuring]
  );

  const voice = useVoiceActivation({
    onSegmentCaptured: ingestSegment,
    requireWakePhrase,
  });

  const onTapRecord = useCallback(async () => {
    if (recording.isRecording) {
      const uri = await recording.stop();
      if (uri) await ingestSegment(uri, { requireWakePhrase: false });
    } else {
      await recording.start();
    }
  }, [recording, ingestSegment]);

  const handleListeningToggle = useCallback(
    async (next) => {
      if (next) {
        await voice.startListening();
      } else {
        voice.stopListening();
      }
    },
    [voice]
  );

  const handleDelete = useCallback(
    async (id) => {
      try {
        await removeNote(id);
      } catch (err) {
        console.warn('delete failed', err);
        feedback.error('Could not delete note');
      }
    },
    [removeNote]
  );

  const handleChangeMood = useCallback(
    async (id, mood) => {
      try {
        await patchNote(id, { mood });
      } catch (err) {
        console.warn('mood update failed', err);
      }
    },
    [patchNote]
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>DriveMind</Text>
        <Text style={styles.subtitle}>
          Storage: {storageBackend === 'firebase' ? 'Firebase' : 'Local (set up Firebase to sync)'}
        </Text>

        <View style={styles.controls}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Listening mode</Text>
            <Switch value={voice.isListening} onValueChange={handleListeningToggle} />
          </View>
          {voice.isListening ? (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Require "Hey DriveMind"</Text>
              <Switch value={requireWakePhrase} onValueChange={setRequireWakePhrase} />
            </View>
          ) : null}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Smart structuring (GPT)</Text>
            <Switch value={useGPTStructuring} onValueChange={setUseGPTStructuring} />
          </View>
        </View>

        <RecordButton
          isRecording={recording.isRecording}
          isProcessing={processing}
          onPress={onTapRecord}
          disabled={voice.isListening}
        />

        {voice.isListening ? (
          <View style={styles.listeningRow}>
            {voice.isCapturingSpeech ? <ActivityIndicator color="#9cf" /> : null}
            <Text style={styles.listeningText}>
              {voice.isCapturingSpeech ? 'Capturing speech…' : 'Listening for speech…'}
            </Text>
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>Mood for next note</Text>
        <MoodSelector value={pendingMood} onChange={setPendingMood} />

        <NotesFeed notes={notes} onDelete={handleDelete} onChangeMood={handleChangeMood} />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 24,
    paddingHorizontal: 0,
  },
  title: {
    fontSize: 30,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  controls: { paddingHorizontal: 24, marginVertical: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  rowLabel: { color: '#ddd', fontSize: 14 },
  listeningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  listeningText: { color: '#9cf', fontSize: 13, marginLeft: 8 },
  sectionLabel: {
    color: '#aaa',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});
