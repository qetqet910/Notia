import { useState, useCallback, useEffect } from 'react';
import type { Note } from '../types';
import { db } from '../services/db';

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 초기 데이터 로드
  useEffect(() => {
    const loadNotes = async () => {
      try {
        const savedNotes = await db.getAllNotes();
        setNotes(savedNotes);
      } catch (error) {
        console.error('Failed to load notes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotes();
  }, []);

  const addNote = useCallback(async (note: Omit<Note, 'id' | 'date' | 'syncStatus' | 'lastModified'>) => {
    const newNote: Note = {
      ...note,
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      syncStatus: 'pending',
      lastModified: Date.now()
    };

    try {
      await db.saveNote(newNote);
      setNotes(prev => [newNote, ...prev]);
      syncNote(newNote);
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  }, []);

  const updateNote = useCallback(async (id: number, updates: Partial<Note>) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    if (updates.lastModified && note.lastSynced && updates.lastModified < note.lastSynced) {
      setNotes(prev => prev.map(n => 
        n.id === id ? { ...n, syncStatus: 'conflict' } : n
      ));
      return;
    }

    const updatedNote = { ...note, ...updates, syncStatus: 'pending' };
    try {
      await db.saveNote(updatedNote);
      setNotes(prev => prev.map(n => n.id === id ? updatedNote : n));
      await syncNote(updatedNote);
    } catch (error) {
      console.error('Failed to update note:', error);
      setNotes(prev => prev.map(n => 
        n.id === id ? { ...n, syncStatus: 'error' } : n
      ));
    }
  }, [notes]);

  const deleteNote = useCallback(async (id: number) => {
    try {
      await db.deleteNote(id);
      setNotes(prev => prev.filter(note => note.id !== id));
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  }, []);

  const syncNote = async (note: Note) => {
    try {
      // 실제 서버 동기화 로직을 여기에 구현
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const syncedNote = { ...note, syncStatus: 'synced', lastSynced: Date.now() };
      await db.saveNote(syncedNote);
      setNotes(prev => prev.map(n => 
        n.id === note.id ? syncedNote : n
      ));
    } catch (error) {
      const errorNote = { ...note, syncStatus: 'error' };
      await db.saveNote(errorNote);
      setNotes(prev => prev.map(n => 
        n.id === note.id ? errorNote : n
      ));
    }
  };

  return { notes, isLoading, addNote, updateNote, deleteNote };
};