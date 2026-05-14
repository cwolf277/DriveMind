import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { OPENAI_API_KEY } from '@env';

const WHISPER_URL = 'https://api.openai.com/v1/audio/transcriptions';

export async function transcribeAudio(uri) {
  const fileInfo = await FileSystem.getInfoAsync(uri);
  if (!fileInfo.exists) throw new Error('Audio file not found');

  const formData = new FormData();
  formData.append('file', {
    uri: fileInfo.uri,
    name: 'voice.m4a',
    type: 'audio/m4a',
  });
  formData.append('model', 'whisper-1');

  const started = Date.now();
  const response = await axios.post(WHISPER_URL, formData, {
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  const latencyMs = Date.now() - started;

  return { text: response.data.text || '', latencyMs };
}
