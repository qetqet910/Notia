import { create } from 'zustand';
import { supabase } from '@/services/supabaseClient';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Note, Reminder, ActivityData, EditorReminder } from '@/types';
import { isTauri } from '@/utils/isTauri';
import { invoke } from '@tauri-apps/api/core';
import { localDB } from '@/services/localDB';
import { v4 as uuidv4 } from 'uuid';

interface CalculationResult {
  stats: {
    totalNotes: number;
    totalReminders: number;
    completedReminders: number;
    completionRate: number;
    tagsUsed: number;
  };
  activityData: ActivityData[];
}

interface DataState {
  notes: Record<string, Note>;
  isInitialized: boolean;
  channels: RealtimeChannel[];
  activityCache: CalculationResult | null;
  isCalculating: boolean;
  initialize: (userId: string) => Promise<void>;
  unsubscribeAll: () => Promise<void>;
  createNote: (
    noteData: Pick<Note, 'owner_id' | 'title' | 'content' | 'tags'> & {
      reminders?: Omit<EditorReminder, 'id'>[];
    },
  ) => Promise<Note | null>;
  updateNoteState: (updatedNote: Note) => void;
  updateReminderState: (
    reminderId: string,
    updates: Partial<Reminder>,
  ) => void;
  addNoteState: (newNote: Note) => void;
  removeNoteState: (noteId: string) => void;
  calculateActivityData: (notes: Note[]) => Promise<void>;
}

let worker: Worker | null = null;

export const useDataStore = create<DataState>((set, get) => ({
  notes: {},
  isInitialized: false,
  channels: [],
  activityCache: null,
  isCalculating: false,

  calculateActivityData: async (notes: Note[]) => {
    if (get().isCalculating) return;

    set({ isCalculating: true });

    if (isTauri()) {
      try {
        // Rust implementation
        const result = await invoke<CalculationResult>('calculate_activity', { notes });
        set({ activityCache: result, isCalculating: false });
        return;
      } catch (err) {
        console.error('Rust calculation failed, falling back to worker:', err);
        // Fallback to worker if rust fails
      }
    }

    if (worker) {
      worker.terminate();
    }

    try {
      worker = new Worker(
        new URL('../workers/activityCalculator.worker.ts', import.meta.url),
        { type: 'module' },
      );

      worker.onmessage = (event: MessageEvent<CalculationResult>) => {
        set({ activityCache: event.data, isCalculating: false });
        if (worker) {
          worker.terminate();
          worker = null;
        }
      };

      worker.onerror = (error) => {
        console.error('Web worker error:', error);
        set({ isCalculating: false });
        if (worker) {
          worker.terminate();
          worker = null;
        }
      };

      worker.postMessage(notes);
    } catch (err) {
      console.error('Failed to create web worker:', err);
      set({ isCalculating: false });
    }
  },

  createNote: async (
    noteData: Pick<Note, 'owner_id' | 'title' | 'content' | 'tags'> & {
      reminders?: Omit<EditorReminder, 'id'>[];
    },
  ): Promise<Note | null> => {
    const { addNoteState } = get();
    // Generate UUID locally for optimistic update and local DB
    const newNoteId = uuidv4();
    const now = new Date().toISOString();

    const newNote: Note = {
      id: newNoteId,
      owner_id: noteData.owner_id,
      title: noteData.title,
      content: noteData.content,
      tags: noteData.tags || [],
      created_at: now,
      updated_at: now,
      reminders: [],
    };

    if (noteData.reminders && noteData.reminders.length > 0) {
        newNote.reminders = noteData.reminders
            .filter(reminder => reminder.date instanceof Date && !isNaN(reminder.date.getTime()))
            .map(reminder => ({
                id: uuidv4(),
                note_id: newNoteId,
                owner_id: noteData.owner_id,
                reminder_text: reminder.text,
                reminder_time: reminder.date.toISOString(),
                completed: reminder.completed || false,
                enabled: reminder.enabled ?? true,
                original_text: reminder.original_text,
                created_at: now,
                updated_at: now
            }));
    }

    // 1. Optimistic Update & Local DB Save
    addNoteState(newNote);
    await localDB.upsertNote(newNote, false); // false = not synced yet

    try {
      // 2. Sync to Supabase
      const { data: noteResult, error: noteError } = await supabase
        .from('notes')
        .insert([
          {
            id: newNoteId, // Use generated ID
            owner_id: noteData.owner_id,
            title: noteData.title,
            content: noteData.content,
            tags: noteData.tags,
          },
        ])
        .select()
        .single();

      if (noteError) throw noteError;

      if (newNote.reminders && newNote.reminders.length > 0) {
          const reminderInserts = newNote.reminders.map(r => ({
            id: r.id,
            note_id: noteResult.id,
            owner_id: noteData.owner_id,
            reminder_text: r.reminder_text,
            reminder_time: r.reminder_time,
            completed: r.completed,
            enabled: r.enabled,
            original_text: r.original_text,
          }));

          const { error: reminderError } = await supabase
            .from('reminders')
            .insert(reminderInserts);
          
          if (reminderError) {
             console.error('Failed to sync reminders to server:', reminderError);
             // Note: In a robust system, we would queue this failure.
          }
      }

      // Mark as synced in local DB
      await localDB.upsertNote(newNote, true);
      return newNote;
    } catch (err) {
      console.error('Failed to create note online, saving locally only:', err);
      // We already saved to localDB, so just return the optimistic note.
      // Ideally, we should indicate the sync status in UI.
      return newNote;
    }
  },

  updateNoteState: (updatedNote: Note) => {
    // Also update local DB whenever state updates (e.g. from realtime or optimistic)
    // Note: We might want to optimize this to avoid too many writes, 
    // but for now safety first.
    localDB.upsertNote(updatedNote); 

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
            activityCache: null,
          };
        }
      } else {
        // Realtime INSERT 이벤트 등으로 노트가 새로 추가될 때
        return {
          notes: { ...state.notes, [updatedNote.id]: updatedNote },
          activityCache: null,
        };
      }
      return state;
    });
  },

  updateReminderState: (reminderId, updates) => {
    set((state) => {
      const newNotes = { ...state.notes };
      for (const noteId in newNotes) {
        const note = newNotes[noteId];
        const reminderIndex = (note.reminders || []).findIndex(
          (r) => r.id === reminderId,
        );
        if (reminderIndex > -1) {
          const newReminders = [...note.reminders];
          newReminders[reminderIndex] = {
            ...newReminders[reminderIndex],
            ...updates,
          };
          const updatedNote = { ...note, reminders: newReminders };
          newNotes[noteId] = updatedNote;
          
          // Sync to local DB
          localDB.upsertNote(updatedNote); 
          break;
        }
      }
      return { notes: newNotes, activityCache: null };
    });
  },

  addNoteState: (newNote: Note) => {
    localDB.upsertNote(newNote);
    set((state) => ({
      notes: {
        ...state.notes,
        [newNote.id]: newNote,
      },
      activityCache: null,
    }));
  },

  removeNoteState: (noteId) => {
    localDB.deleteNote(noteId);
    set((state) => {
      const newNotes = { ...state.notes };
      delete newNotes[noteId];
      return { notes: newNotes, activityCache: null };
    });
  },

  initialize: async (userId: string) => {
    if (get().isInitialized) return;
    set({ isInitialized: true });

    await get().unsubscribeAll();

    // 1. Load from Local DB first (Fast!)
    try {
        const localNotes = await localDB.getNotes();
        const formattedLocalNotes = localNotes.reduce(
            (acc, note) => {
                acc[note.id] = note;
                return acc;
            },
            {} as Record<string, Note>,
        );
        
        if (Object.keys(formattedLocalNotes).length > 0) {
             set({ notes: formattedLocalNotes, activityCache: null });
             console.log('Loaded notes from Local DB');
        }
    } catch (err) {
        console.error('Failed to load from local DB:', err);
    }

    // 2. Fetch from Supabase and sync
    try {
      const { data, error } = await supabase
        .from('notes')
        .select(
          'id, title, owner_id, is_public, note_type, tags, created_at, updated_at, content_preview, reminders(*)',
        )
        .eq('owner_id', userId);

      if (error) throw error;

      const formattedNotes = data.reduce(
        (acc, note) => {
          const formatted = {
            ...note,
            createdAt: new Date(note.created_at),
            updatedAt: new Date(note.updated_at),
            reminders: note.reminders || [],
          };
          acc[note.id] = formatted;
          // Sync fetched data to local DB
          localDB.upsertNote(formatted); 
          return acc;
        },
        {} as Record<string, Note>,
      );
      set({ notes: formattedNotes, activityCache: null }); 
    } catch (err) {
      console.error('Online initialization failed, running in offline mode:', err);
      // Keep using local data if online fetch fails
    }

    const handleNoteChange = (payload: RealtimePostgresChangesPayload<Note>) => {
      if (payload.eventType === 'INSERT') {
        get().addNoteState({ ...(payload.new as Note), reminders: [] });
      } else if (payload.eventType === 'UPDATE') {
        get().updateNoteState(payload.new as Note);
      } else if (payload.eventType === 'DELETE') {
        get().removeNoteState((payload.old as { id: string }).id);
      }
    };

    const notesChannel = supabase
      .channel(`notes-changes-for-user-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
          filter: `owner_id=eq.${userId}`,
        },
        handleNoteChange,
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
              const updatedNote = {
                    ...targetNote,
                    reminders: [...(targetNote.reminders || []), newReminder],
              };
              localDB.upsertNote(updatedNote); // Sync local
              return {
                notes: {
                  ...state.notes,
                  [noteId]: updatedNote,
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
               const updatedNote = {
                    ...targetNote,
                    reminders: (targetNote.reminders || []).map((r) =>
                      r.id === updatedReminder.id ? updatedReminder : r,
                    ),
                  };
              localDB.upsertNote(updatedNote); // Sync local
              return {
                notes: {
                  ...state.notes,
                  [noteId]: updatedNote,
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
        (payload: RealtimePostgresChangesPayload<Note>) => {
          const oldReminder = payload.old as { id: string; note_id: string };
          const noteId = oldReminder.note_id;
          set((state) => {
            const targetNote = state.notes[noteId];
            if (targetNote) {
              const updatedNote = {
                    ...targetNote,
                    reminders: (targetNote.reminders || []).filter(
                      (r) => r.id !== oldReminder.id,
                    ),
                  };
              localDB.upsertNote(updatedNote); // Sync local
              return {
                notes: {
                  ...state.notes,
                  [noteId]: updatedNote,
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
    if (worker) {
      worker.terminate();
      worker = null;
    }
    const { channels } = get();
    if (channels.length > 0) {
      await Promise.all(channels.map((c) => c.unsubscribe()));
      set({ channels: [] });
    }
  },
}));