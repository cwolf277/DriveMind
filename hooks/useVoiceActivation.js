import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import { feedback } from '../services/audioFeedback';

const SPEECH_DB_THRESHOLD = -35;
const SILENCE_HOLD_MS = 1200;
const MIN_SPEECH_MS = 500;
const POLL_MS = 150;

const WAKE_PHRASES = [
  'hey drivemind',
  'hey drive mind',
  'drive mind',
  'drivemind',
  'ok drivemind',
];

export function hasWakePhrase(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return WAKE_PHRASES.some((p) => lower.includes(p));
}

export function stripWakePhrase(text) {
  if (!text) return '';
  let out = text;
  for (const p of WAKE_PHRASES) {
    const re = new RegExp(`^[\\s,.!?-]*${p}[\\s,.!?-]*`, 'i');
    out = out.replace(re, '');
  }
  return out.trim();
}

export function useVoiceActivation({ onSegmentCaptured, requireWakePhrase = false } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isCapturingSpeech, setIsCapturingSpeech] = useState(false);
  const recordingRef = useRef(null);
  const speechStartedAtRef = useRef(null);
  const lastLoudAtRef = useRef(null);
  const stoppingRef = useRef(false);
  const optionsRef = useRef({ onSegmentCaptured, requireWakePhrase });

  useEffect(() => {
    optionsRef.current = { onSegmentCaptured, requireWakePhrase };
  }, [onSegmentCaptured, requireWakePhrase]);

  const startSegment = useCallback(async () => {
    if (recordingRef.current || stoppingRef.current) return;
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
    const { recording } = await Audio.Recording.createAsync(
      {
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        isMeteringEnabled: true,
      },
      (status) => {
        if (!status.isRecording || status.metering === undefined) return;
        const db = status.metering;
        const now = Date.now();
        if (db > SPEECH_DB_THRESHOLD) {
          if (!speechStartedAtRef.current) {
            speechStartedAtRef.current = now;
            setIsCapturingSpeech(true);
          }
          lastLoudAtRef.current = now;
        }
      },
      POLL_MS
    );
    recordingRef.current = recording;
    speechStartedAtRef.current = null;
    lastLoudAtRef.current = null;
    setIsCapturingSpeech(false);
  }, []);

  const finishSegment = useCallback(async () => {
    const rec = recordingRef.current;
    if (!rec || stoppingRef.current) return;
    stoppingRef.current = true;
    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      const startedAt = speechStartedAtRef.current;
      const lastLoudAt = lastLoudAtRef.current;
      recordingRef.current = null;
      speechStartedAtRef.current = null;
      lastLoudAtRef.current = null;
      setIsCapturingSpeech(false);

      const hadSpeech = startedAt && lastLoudAt && lastLoudAt - startedAt >= MIN_SPEECH_MS;
      if (uri && hadSpeech && optionsRef.current.onSegmentCaptured) {
        optionsRef.current.onSegmentCaptured(uri, {
          requireWakePhrase: optionsRef.current.requireWakePhrase,
        });
      }
    } catch (err) {
      console.warn('finishSegment failed', err);
    } finally {
      stoppingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isListening) return undefined;
    let cancelled = false;

    const loop = async () => {
      try {
        await startSegment();
      } catch (err) {
        console.warn('startSegment failed', err);
        feedback.error('Listening failed to start');
        setIsListening(false);
        return;
      }

      const interval = setInterval(async () => {
        if (cancelled) return;
        const lastLoudAt = lastLoudAtRef.current;
        const startedAt = speechStartedAtRef.current;
        if (startedAt && lastLoudAt && Date.now() - lastLoudAt > SILENCE_HOLD_MS) {
          clearInterval(interval);
          await finishSegment();
          if (!cancelled) loop();
        }
      }, POLL_MS);

      return () => clearInterval(interval);
    };

    loop();

    return () => {
      cancelled = true;
      const rec = recordingRef.current;
      if (rec) {
        rec.stopAndUnloadAsync().catch(() => {});
        recordingRef.current = null;
      }
      setIsCapturingSpeech(false);
    };
  }, [isListening, startSegment, finishSegment]);

  const startListening = useCallback(async () => {
    const permission = await Audio.requestPermissionsAsync();
    if (permission.status !== 'granted') {
      feedback.error('Microphone permission required');
      return false;
    }
    setIsListening(true);
    return true;
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
  }, []);

  return { isListening, isCapturingSpeech, startListening, stopListening };
}
