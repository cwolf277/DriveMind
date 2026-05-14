import React from 'react';
import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { NoteCard } from './NoteCard';

export function NotesFeed({ notes, onDelete, onChangeMood }) {
  if (!notes.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No notes yet. Tap record or enable listening.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onDelete={onDelete}
          onChangeMood={onChangeMood}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 60 },
  empty: { padding: 24, alignItems: 'center' },
  emptyText: { color: '#888', fontSize: 14, textAlign: 'center' },
});
