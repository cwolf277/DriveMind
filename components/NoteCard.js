import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { MOOD_OPTIONS } from './MoodSelector';

const MOOD_EMOJI = MOOD_OPTIONS.reduce((acc, m) => {
  acc[m.id] = m.emoji;
  return acc;
}, {});

function formatTimestamp(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && typeof value.toDate === 'function') {
    return value.toDate().toLocaleString();
  }
  if (typeof value === 'number') return new Date(value).toLocaleString();
  return '';
}

export function NoteCard({ note, onDelete, onChangeMood }) {
  const [expanded, setExpanded] = useState(false);

  const renderRight = () => (
    <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(note.id)}>
      <Text style={styles.deleteText}>🗑️</Text>
    </TouchableOpacity>
  );

  const text = note.cleanedText || note.text || note.rawText || '';
  const title = note.title || text.slice(0, 60) || 'Untitled';
  const moodEmoji = note.mood ? MOOD_EMOJI[note.mood] : null;

  return (
    <Swipeable renderRightActions={renderRight}>
      <TouchableOpacity style={styles.card} onPress={() => setExpanded((v) => !v)}>
        <View style={styles.headerRow}>
          <Text style={styles.timestamp}>{formatTimestamp(note.timestamp)}</Text>
          {moodEmoji ? <Text style={styles.mood}>{moodEmoji}</Text> : null}
        </View>
        <Text style={styles.title} numberOfLines={expanded ? 0 : 1}>
          {title}
        </Text>
        {note.summary ? (
          <Text style={styles.summary} numberOfLines={expanded ? 0 : 2}>
            {note.summary}
          </Text>
        ) : null}
        <Text style={styles.body} numberOfLines={expanded ? 0 : 2} ellipsizeMode="tail">
          {text}
        </Text>
        {expanded && note.tags?.length ? (
          <View style={styles.tagRow}>
            {note.tags.map((t) => (
              <Text key={t} style={styles.tag}>#{t}</Text>
            ))}
          </View>
        ) : null}
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  timestamp: { color: '#888', fontSize: 12 },
  mood: { fontSize: 16 },
  title: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  summary: { color: '#bbb', fontSize: 13, marginBottom: 6, fontStyle: 'italic' },
  body: { color: '#ddd', fontSize: 14, lineHeight: 20 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  tag: {
    color: '#9cf',
    fontSize: 12,
    marginRight: 8,
    marginTop: 4,
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    borderRadius: 12,
    marginVertical: 6,
  },
  deleteText: { color: '#fff', fontSize: 20 },
});
