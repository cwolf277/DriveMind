import axios from 'axios';
import { OPENAI_API_KEY } from '@env';

const FILLERS = /\b(um+|uh+|er+|ah+|like|you know|i mean|sort of|kind of)\b/gi;

const MOOD_KEYWORDS = {
  stressed: ['stressed', 'anxious', 'overwhelmed', 'panic', 'tense'],
  focused: ['focused', 'working', 'plan', 'todo', 'task', 'deadline'],
  happy: ['happy', 'great', 'excited', 'good', 'awesome', 'love'],
  tired: ['tired', 'exhausted', 'sleepy', 'drained'],
  reflective: ['thinking', 'wondering', 'maybe', 'reflecting', 'remember'],
};

export function cleanTranscription(raw) {
  if (!raw) return '';
  let text = raw.trim();
  text = text.replace(/\s+/g, ' ');
  text = text.replace(FILLERS, '').replace(/\s+/g, ' ').trim();
  text = text.replace(/\s+([.,!?;:])/g, '$1');
  if (text.length) text = text[0].toUpperCase() + text.slice(1);
  if (text.length && !/[.!?]$/.test(text)) text += '.';
  return text;
}

export function deriveTitle(text, max = 60) {
  if (!text) return 'Untitled note';
  const firstSentence = text.split(/[.!?]/)[0].trim();
  if (firstSentence.length <= max) return firstSentence || 'Untitled note';
  return firstSentence.slice(0, max - 1).trimEnd() + '…';
}

export function deriveTags(text) {
  if (!text) return [];
  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const stop = new Set([
    'this', 'that', 'with', 'from', 'have', 'they', 'them', 'were', 'been',
    'will', 'just', 'into', 'about', 'because', 'there', 'their', 'would',
    'could', 'should', 'really', 'going', 'thing', 'things', 'today',
  ]);
  const counts = {};
  for (const w of words) {
    if (stop.has(w)) continue;
    counts[w] = (counts[w] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w);
}

export function detectMood(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS)) {
    const score = keywords.reduce((n, k) => (lower.includes(k) ? n + 1 : n), 0);
    if (score > bestScore) {
      bestScore = score;
      best = mood;
    }
  }
  return best;
}

export function structureLocally(rawText) {
  const cleaned = cleanTranscription(rawText);
  return {
    rawText,
    cleanedText: cleaned,
    title: deriveTitle(cleaned),
    tags: deriveTags(cleaned),
    detectedMood: detectMood(cleaned),
  };
}

export async function structureWithGPT(rawText, { signal } = {}) {
  if (!OPENAI_API_KEY || !rawText) return null;
  const prompt = `You convert a raw voice transcript into a compact structured JSON note.
Return ONLY JSON with keys: title (<=60 chars), summary (<=140 chars), tags (3-5 short lowercase strings), mood (one of: happy, focused, stressed, tired, reflective, neutral).
Transcript: """${rawText.replace(/"""/g, '"')}"""`;

  const res = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a concise note-structuring assistant. Respond with JSON only.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal,
    }
  );

  const content = res.data?.choices?.[0]?.message?.content;
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function structureNote(rawText, { useGPT = false } = {}) {
  const local = structureLocally(rawText);
  if (!useGPT) return local;
  try {
    const gpt = await structureWithGPT(rawText);
    if (!gpt) return local;
    return {
      ...local,
      title: gpt.title || local.title,
      summary: gpt.summary || null,
      tags: Array.isArray(gpt.tags) && gpt.tags.length ? gpt.tags : local.tags,
      detectedMood: gpt.mood || local.detectedMood,
    };
  } catch {
    return local;
  }
}
