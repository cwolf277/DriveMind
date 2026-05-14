import { useCallback, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import { feedback } from '../services/audioFeedback';

export function useRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [meteringDb, setMeteringDb] = useState(-160);
  const recordingRef = useRef(null);

  const requestPermission = useCallback(async () => {
    const permission = await Audio.requestPermissionsAsync();
    return permission.status === 'granted';
  }, []);

  const start = useCallback(async ({ onMetering } = {}) => {
    const granted = await requestPermission();
    if (!granted) {
      feedback.error('Microphone permission required');
      return false;
    }

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
        if (status.metering !== undefined) {
          setMeteringDb(status.metering);
          onMetering?.(status.metering);
        }
      },
      150
    );

    recordingRef.current = recording;
    setIsRecording(true);
    feedback.recordingStarted();
    return true;
  }, [requestPermission]);

  const stop = useCallback(async () => {
    const rec = recordingRef.current;
    if (!rec) return null;
    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      recordingRef.current = null;
      setIsRecording(false);
      feedback.recordingStopped();
      return uri;
    } catch (err) {
      console.warn('stop recording failed', err);
      recordingRef.current = null;
      setIsRecording(false);
      return null;
    }
  }, []);

  return { isRecording, meteringDb, start, stop };
}
