import { useCallback, useEffect, useState } from 'react';
import { storage, storageBackend } from '../services/storage';
import { feedback } from '../services/audioFeedback';

export function useNotes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const list = await storage.getNotes();
      setNotes(list);
      setError(null);
    } catch (err) {
      console.warn('load notes failed', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addNote = useCallback(async (note) => {
    const saved = await storage.saveNote(note);
    setNotes((prev) => [saved, ...prev]);
    feedback.noteSaved();
    return saved;
  }, []);

  const removeNote = useCallback(async (id) => {
    await storage.deleteNote(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    feedback.noteDeleted();
  }, []);

  const patchNote = useCallback(async (id, patch) => {
    await storage.updateNote(id, patch);
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }, []);

  return { notes, loading, error, refresh, addNote, removeNote, patchNote, backend: storageBackend };
}
