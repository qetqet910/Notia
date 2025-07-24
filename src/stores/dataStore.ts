import { create } from 'zustand';
import { supabase } from '@/services/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Note, Reminder, EditorReminder } from '@/types';

interface DataState {
  notes: Note[];
  isInitialized: boolean;
  channels: RealtimeChannel[];
  initialize: (userId: string) => Promise<void>;
  unsubscribeAll: () => Promise<void>;
  updateNoteState: (updatedNote: Note) => void;
  updateReminderState: (
    reminderId: string,
    updates: Partial<Reminder>,
  ) => void;
  addNoteState: (newNote: Note) => void;
  removeNoteState: (noteId: string) => void;
}

export const useDataStore = create<DataState>((set, get) => ({
  notes: [],
  isInitialized: false,
  channels: [],

  updateNoteState: (updatedNote: Note) => {
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === updatedNote.id ? { ...note, ...updatedNote } : note,
      ),
    }));
  },

  updateReminderState: (reminderId, updates) => {
    set((state) => ({
      notes: state.notes.map((note) => ({
        ...note,
        reminders: (note.reminders || []).map((r) =>
          r.id === reminderId ? { ...r, ...updates } : r,
        ),
      })),
    }));
  },

  addNoteState: (newNote: Note) => {
    set((state) => ({
      notes: [newNote, ...state.notes],
    }));
  },

  removeNoteState: (noteId) => {
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== noteId),
    }));
  },

  initialize: async (userId: string) => {
    if (get().isInitialized) return;
    set({ isInitialized: true });

    await get().unsubscribeAll();

    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*, reminders(*)')
        .eq('owner_id', userId);

      if (error) throw error;

      const formattedNotes = data.map((note) => ({
        ...note,
        createdAt: new Date(note.created_at),
        updatedAt: new Date(note.updated_at),
        reminders: note.reminders || [],
      }));
      set({ notes: formattedNotes as Note[] });
    } catch (err) {
      console.error('Initialization failed:', err);
      set({ isInitialized: false });
      return;
    }

    const notesChannel = supabase
      .channel(`notes-changes-for-user-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notes', filter: `owner_id=eq.${userId}` },
        (payload) => get().addNoteState({ ...(payload.new as Note), reminders: [] })
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notes', filter: `owner_id=eq.${userId}` },
        (payload) => get().updateNoteState(payload.new as Note)
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'notes', filter: `owner_id=eq.${userId}` },
        (payload) => get().removeNoteState(payload.old.id)
      )
      .subscribe();

    const remindersChannel = supabase
      .channel(`reminders-changes-for-user-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reminders', filter: `owner_id=eq.${userId}` },
        (payload) => {
          const newReminder = payload.new as Reminder;
          set((state) => ({
            notes: state.notes.map((note) =>
              note.id === payload.new.note_id
                ? { ...note, reminders: [...(note.reminders || []), newReminder] }
                : note
            ),
          }));
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reminders', filter: `owner_id=eq.${userId}` },
        (payload) => {
          const updatedReminder = payload.new as Reminder;
          set((state) => ({
            notes: state.notes.map((note) =>
              note.id === payload.new.note_id
                ? {
                    ...note,
                    reminders: (note.reminders || []).map((r) =>
                      r.id === updatedReminder.id ? updatedReminder : r
                    ),
                  }
                : note
            ),
          }));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'reminders', filter: `owner_id=eq.${userId}` },
        (payload) => {
          set((state) => ({
            notes: state.notes.map((note) =>
              note.id === payload.old.note_id
                ? {
                    ...note,
                    reminders: (note.reminders || []).filter(
                      (r) => r.id !== payload.old.id
                    ),
                  }
                : note
            ),
          }));
        }
      )
      .subscribe();

    set({ channels: [notesChannel, remindersChannel] });
  },

  unsubscribeAll: async () => {
    const { channels } = get();
    if (channels.length > 0) {
      await Promise.all(channels.map((c) => c.unsubscribe()));
      set({ channels: [] });
    }
  },
}));
