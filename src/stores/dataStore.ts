import { create } from 'zustand';
import { supabase } from '@/services/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Note, Reminder } from '@/types';

interface DataState {
  notes: Record<string, Note>;
  isInitialized: boolean;
  channels: RealtimeChannel[];
  initialize: (userId: string) => Promise<void>;
  unsubscribeAll: () => Promise<void>;
  createNote: (
    noteData: Pick<Note, 'owner_id' | 'title' | 'content' | 'tags'>,
  ) => Promise<Note | null>;
  updateNoteState: (updatedNote: Note) => void;
  updateReminderState: (
    reminderId: string,
    updates: Partial<Reminder>,
  ) => void;
  addNoteState: (newNote: Note) => void;
  removeNoteState: (noteId: string) => void;
}

export const useDataStore = create<DataState>((set, get) => ({
  notes: {},
  isInitialized: false,
  channels: [],

  createNote: async (
    noteData: Pick<Note, 'owner_id' | 'title' | 'content' | 'tags'>,
  ): Promise<Note | null> => {
    const { addNoteState } = get();
    try {
      const { data, error } = await supabase
        .from('notes')
        .insert([
          {
            owner_id: noteData.owner_id,
            title: noteData.title,
            content: noteData.content,
            tags: noteData.tags,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const newNote: Note = {
        ...data,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        reminders: [],
      };

      addNoteState(newNote);
      return newNote;
    } catch (err) {
      console.error('Failed to create note:', err);
      return null;
    }
  },

  updateNoteState: (updatedNote: Note) => {
    set((state) => {
      const existingNote = state.notes[updatedNote.id];
      if (existingNote) {
        const existingDate = new Date(existingNote.updated_at).getTime();
        const newDate = new Date(updatedNote.updated_at).getTime();
        if (newDate >= existingDate) {
          return {
            notes: {
              ...state.notes,
              [updatedNote.id]: { ...existingNote, ...updatedNote },
            },
          };
        }
      }
      return state;
    });
  },

  updateReminderState: (reminderId, updates) => {
    set((state) => {
      const newNotes = { ...state.notes };
      for (const noteId in newNotes) {
        const note = newNotes[noteId];
        const reminderIndex = note.reminders.findIndex(
          (r) => r.id === reminderId,
        );
        if (reminderIndex > -1) {
          const newReminders = [...note.reminders];
          newReminders[reminderIndex] = {
            ...newReminders[reminderIndex],
            ...updates,
          };
          newNotes[noteId] = { ...note, reminders: newReminders };
          break;
        }
      }
      return { notes: newNotes };
    });
  },

  addNoteState: (newNote: Note) => {
    set((state) => ({
      notes: {
        ...state.notes,
        [newNote.id]: newNote,
      },
    }));
  },

  removeNoteState: (noteId) => {
    set((state) => {
      const newNotes = { ...state.notes };
      delete newNotes[noteId];
      return { notes: newNotes };
    });
  },

  initialize: async (userId: string) => {
    if (get().isInitialized) return;
    set({ isInitialized: true });

    await get().unsubscribeAll();

    try {
      const { data, error } = await supabase
        .from('notes')
        .select(
          'id, title, owner_id, is_public, parent_id, note_type, tags, created_at, updated_at, content_preview, reminders(*)',
        )
        .eq('owner_id', userId);

      if (error) throw error;

      const formattedNotes = data.reduce(
        (acc, note) => {
          acc[note.id] = {
            ...note,
            createdAt: new Date(note.created_at),
            updatedAt: new Date(note.updated_at),
            reminders: note.reminders || [],
          };
          return acc;
        },
        {} as Record<string, Note>,
      );
      set({ notes: formattedNotes });
    } catch (err) {
      console.error('Initialization failed:', err);
      set({ isInitialized: false });
      return;
    }

    const notesChannel = supabase
      .channel(`notes-changes-for-user-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notes',
          filter: `owner_id=eq.${userId}`,
        },
        (payload) =>
          get().addNoteState({ ...(payload.new as Note), reminders: [] }),
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notes',
          filter: `owner_id=eq.${userId}`,
        },
        (payload) => get().updateNoteState(payload.new as Note),
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notes',
          filter: `owner_id=eq.${userId}`,
        },
        (payload) => get().removeNoteState(payload.old.id),
      )
      .subscribe();

    const remindersChannel = supabase
      .channel(`reminders-changes-for-user-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reminders',
          filter: `owner_id=eq.${userId}`,
        },
        (payload) => {
          const newReminder = payload.new as Reminder;
          const noteId = newReminder.note_id;
          set((state) => {
            const targetNote = state.notes[noteId];
            if (targetNote) {
              return {
                notes: {
                  ...state.notes,
                  [noteId]: {
                    ...targetNote,
                    reminders: [...targetNote.reminders, newReminder],
                  },
                },
              };
            }
            return state;
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'reminders',
          filter: `owner_id=eq.${userId}`,
        },
        (payload) => {
          const updatedReminder = payload.new as Reminder;
          const noteId = updatedReminder.note_id;
          set((state) => {
            const targetNote = state.notes[noteId];
            if (targetNote) {
              return {
                notes: {
                  ...state.notes,
                  [noteId]: {
                    ...targetNote,
                    reminders: targetNote.reminders.map((r) =>
                      r.id === updatedReminder.id ? updatedReminder : r,
                    ),
                  },
                },
              };
            }
            return state;
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'reminders',
          filter: `owner_id=eq.${userId}`,
        },
        (payload) => {
          const oldReminder = payload.old as Reminder;
          const noteId = oldReminder.note_id;
          set((state) => {
            const targetNote = state.notes[noteId];
            if (targetNote) {
              return {
                notes: {
                  ...state.notes,
                  [noteId]: {
                    ...targetNote,
                    reminders: targetNote.reminders.filter(
                      (r) => r.id !== oldReminder.id,
                    ),
                  },
                },
              };
            }
            return state;
          });
        },
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