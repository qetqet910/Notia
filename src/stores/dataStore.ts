import { create } from 'zustand';
import { supabase } from '@/services/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Note, Reminder } from '@/types';

interface DataState {
  notes: Note[];
  isInitialized: boolean;
  channels: RealtimeChannel[];
  initialize: (userId: string) => Promise<void>;
  unsubscribeAll: () => Promise<void>;
  updateNoteState: (updatedNote: Note) => void;
  updateReminderState: (reminderId: string, updates: Partial<Reminder>) => void;
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

    // 1. 이전 구독을 완전히 해제하고 기다립니다.
    await get().unsubscribeAll();

    // 2. 초기 데이터를 가져옵니다.
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*, reminders(*)')
        .eq('owner_id', userId);

      if (error) {
        console.error('Error fetching initial notes:', error);
        set({ isInitialized: false });
        return;
      }

      const formattedNotes = data.map((note) => ({
        ...note,
        createdAt: new Date(note.created_at),
        updatedAt: new Date(note.updated_at),
        reminders: (note.reminders || []).map((r) => ({
          ...r,
          date: new Date(r.reminder_time),
        })),
      }));
      set({ notes: formattedNotes as Note[] });
    } catch (err) {
      console.error('Initialization failed:', err);
      set({ isInitialized: false });
      return;
    }

    // 3. 사용자별 고유 채널로 실시간 구독을 설정합니다.
    const channel = supabase
      .channel(`notes-changes-for-user-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notes', filter: `owner_id=eq.${userId}` },
        (payload) => {
          const newNote = {
            ...(payload.new as Note),
            createdAt: new Date(payload.new.created_at),
            updatedAt: new Date(payload.new.updated_at),
            reminders: [],
          };
          get().addNoteState(newNote);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notes', filter: `owner_id=eq.${userId}` },
        (payload) => {
          const updatedNote = {
            ...(payload.new as Note),
            createdAt: new Date(payload.new.created_at),
            updatedAt: new Date(payload.new.updated_at),
          };
          get().updateNoteState(updatedNote);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'notes', filter: `owner_id=eq.${userId}` },
        (payload) => {
          get().removeNoteState(payload.old.id);
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to notes changes for user ${userId}!`);
        }
        if (status === 'CHANNEL_ERROR') {
          console.error(`Channel error for user ${userId}:`, err);
          set({ isInitialized: false });
        }
        if (status === 'TIMED_OUT') {
          console.warn(`Subscription timed out for user ${userId}.`);
          set({ isInitialized: false });
        }
      });

    set({ channels: [channel] });
  },

  unsubscribeAll: async () => {
    const { channels } = get();
    if (channels.length > 0) {
      await Promise.all(channels.map((c) => c.unsubscribe()));
      set({ channels: [] });
    }
  },
}));