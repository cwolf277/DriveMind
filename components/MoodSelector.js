import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export const MOOD_OPTIONS = [
  { id: 'happy', label: 'Happy', emoji: '😊' },
  { id: 'focused', label: 'Focused', emoji: '🎯' },
  { id: 'stressed', label: 'Stressed', emoji: '😣' },
  { id: 'tired', label: 'Tired', emoji: '😴' },
  { id: 'reflective', label: 'Reflective', emoji: '🤔' },
  { id: 'neutral', label: 'Neutral', emoji: '😐' },
];

export function MoodSelector({ value, onChange }) {
  return (
    <View style={styles.row}>
      {MOOD_OPTIONS.map((mood) => {
        const selected = value === mood.id;
        return (
          <TouchableOpacity
            key={mood.id}
            style={[styles.chip, selected && styles.chipSelected]}
            onPress={() => onChange(selected ? null : mood.id)}
          >
            <Text style={styles.emoji}>{mood.emoji}</Text>
            <Text style={[styles.label, selected && styles.labelSelected]}>{mood.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    margin: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipSelected: {
    borderColor: '#9cf',
    backgroundColor: '#22344a',
  },
  emoji: { fontSize: 14, marginRight: 6 },
  label: { color: '#aaa', fontSize: 12 },
  labelSelected: { color: '#fff' },
});
