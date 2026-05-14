import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';

const LOCAL_KEY = 'driveMindNotes';
const COLLECTION = 'notes';

class FirebaseStorage {
  async getNotes() {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async saveNote(note) {
    const ref = await addDoc(collection(db, COLLECTION), {
      ...note,
      createdAt: serverTimestamp(),
    });
    return { id: ref.id, ...note };
  }

  async deleteNote(id) {
    await deleteDoc(doc(db, COLLECTION, id));
  }

  async updateNote(id, patch) {
    await updateDoc(doc(db, COLLECTION, id), patch);
  }
}

class LocalStorage {
  async getNotes() {
    const raw = await AsyncStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  async _writeAll(notes) {
    await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(notes));
  }

  async saveNote(note) {
    const notes = await this.getNotes();
    const withId = { id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, ...note };
    const updated = [withId, ...notes];
    await this._writeAll(updated);
    return withId;
  }

  async deleteNote(id) {
    const notes = await this.getNotes();
    await this._writeAll(notes.filter((n) => n.id !== id));
  }

  async updateNote(id, patch) {
    const notes = await this.getNotes();
    const updated = notes.map((n) => (n.id === id ? { ...n, ...patch } : n));
    await this._writeAll(updated);
  }
}

export const storage = isFirebaseConfigured ? new FirebaseStorage() : new LocalStorage();
export const storageBackend = isFirebaseConfigured ? 'firebase' : 'local';
