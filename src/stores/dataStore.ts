import { create } from 'zustand';
import { supabase } from '@/services/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Note, Reminder, ActivityData } from '@/types';

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
    noteData: Pick<Note, 'owner_id' | 'title' | 'content' | 'tags'>,
  ) => Promise<Note | null>;
  updateNoteState: (updatedNote: Note) => void;
  updateReminderState: (
    reminderId: string,
    updates: Partial<Reminder>,
  ) => void;
  addNoteState: (newNote: Note) => void;
  removeNoteState: (noteId: string) => void;
  calculateActivityData: (notes: Note[]) => void;
}

let worker: Worker | null = null;

export const useDataStore = create<DataState>((set, get) => ({
  notes: {},
  isInitialized: false,
  channels: [],
  activityCache: null,
  isCalculating: false,

  calculateActivityData: (notes: Note[]) => {
    if (get().isCalculating) return;

    set({ isCalculating: true });

    if (worker) {
      worker.terminate();
    }

    worker = new Worker(
      new URL('@/workers/activityCalculator.worker.ts', import.meta.url),
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
  },

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
      } else {
        // Realtime INSERT 이벤트 등으로 노트가 새로 추가될 때
        return {
          notes: { ...state.notes, [updatedNote.id]: updatedNote },
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
      set({ notes: formattedNotes, activityCache: null }); // 초기화 시 캐시 비우기
    } catch (err) {
      console.error('Initialization failed:', err);
      set({ isInitialized: false });
      return;
    }

    const handleNoteChange = (payload: any) => {
      if (payload.eventType === 'INSERT') {
        get().addNoteState({ ...(payload.new as Note), reminders: [] });
      } else if (payload.eventType === 'UPDATE') {
        get().updateNoteState(payload.new as Note);
      } else if (payload.eventType === 'DELETE') {
        get().removeNoteState(payload.old.id);
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
              return {
                notes: {
                  ...state.notes,
                  [noteId]: {
                    ...targetNote,
                    reminders: [...(targetNote.reminders || []), newReminder],
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
                    reminders: (targetNote.reminders || []).map((r) =>
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
          const oldReminder = payload.old as any;
          const noteId = oldReminder.note_id;
          set((state) => {
            const targetNote = state.notes[noteId];
            if (targetNote) {
              return {
                notes: {
                  ...state.notes,
                  [noteId]: {
                    ...targetNote,
                    reminders: (targetNote.reminders || []).filter(
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