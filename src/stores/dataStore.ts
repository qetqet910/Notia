import { create } from 'zustand';
import { supabase } from '@/services/supabaseClient';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Note, Reminder, ActivityData, EditorReminder } from '@/types';

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
    try {
      // 1. 노트 생성
      const { data: noteResult, error: noteError } = await supabase
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

      if (noteError) throw noteError;

      let finalReminders: Reminder[] = [];

      // 2. 리마인더가 있으면 DB 스키마에 맞게 변환하여 생성
      if (noteData.reminders && noteData.reminders.length > 0) {
        const reminderInserts = noteData.reminders
          .filter(reminder => reminder.date instanceof Date && !isNaN(reminder.date.getTime()))
          .map(reminder => ({
            note_id: noteResult.id,
            owner_id: noteData.owner_id,
            reminder_text: reminder.text,
            reminder_time: reminder.date.toISOString(),
            completed: reminder.completed || false,
            enabled: reminder.enabled ?? true,
            original_text: reminder.original_text,
          }));

        if (reminderInserts.length > 0) {
            const { data: reminderResult, error: reminderError } = await supabase
              .from('reminders')
              .insert(reminderInserts)
              .select();
            
            if (reminderError) {
              console.error('Failed to create reminders for new note:', reminderError);
            } else {
              finalReminders = reminderResult;
            }
        }
      }

      const newNote: Note = {
        ...noteResult,
        createdAt: new Date(noteResult.created_at),
        updatedAt: new Date(noteResult.updated_at),
        reminders: finalReminders,
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
          newNotes[noteId] = { ...note, reminders: newReminders };
          break;
        }
      }
      return { notes: newNotes, activityCache: null };
    });
  },

  addNoteState: (newNote: Note) => {
    set((state) => ({
      notes: {
        ...state.notes,
        [newNote.id]: newNote,
      },
      activityCache: null,
    }));
  },

  removeNoteState: (noteId) => {
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
        (payload: RealtimePostgresChangesPayload<Note>) => {
          const oldReminder = payload.old as { id: string; note_id: string };
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