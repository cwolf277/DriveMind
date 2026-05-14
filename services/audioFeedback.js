import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';

const SPEECH_OPTS = { rate: 1.0, pitch: 1.0, language: 'en-US' };

let enabled = true;

export function setAudioFeedbackEnabled(value) {
  enabled = Boolean(value);
}

export function isAudioFeedbackEnabled() {
  return enabled;
}

function speak(phrase) {
  if (!enabled) return;
  try {
    Speech.stop();
    Speech.speak(phrase, SPEECH_OPTS);
  } catch {}
}

function tap(style = Haptics.ImpactFeedbackStyle.Medium) {
  try {
    Haptics.impactAsync(style);
  } catch {}
}

export const feedback = {
  recordingStarted() {
    tap(Haptics.ImpactFeedbackStyle.Medium);
    speak('Listening');
  },
  recordingStopped() {
    tap(Haptics.ImpactFeedbackStyle.Light);
  },
  noteSaved() {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
    speak('Note saved');
  },
  noteDeleted() {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}
  },
  error(message = 'Something went wrong') {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {}
    speak(message);
  },
  wakeWordDetected() {
    tap(Haptics.ImpactFeedbackStyle.Heavy);
    speak('Yes');
  },
};
