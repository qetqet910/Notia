import { create } from 'zustand';
import { supabase } from '@/services/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Note, Reminder } from '@/types';
import { parseNoteContent } from '@/utils/noteParser'; // 파서 유틸리티 import

interface DataState {
  notes: Note[];
  isInitialized: boolean;
  channels: RealtimeChannel[];
  initialize: (userId: string) => Promise<void>;
  unsubscribeAll: () => Promise<void>;
  createNote: (noteData: {
    owner_id: string;
    title: string;
    content: string;
  }) => Promise<void>;
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

  createNote: async ({ owner_id, title, content }) => {
    const { tags, reminders: parsedReminders } = parseNoteContent(content);
    const tagTexts = tags.map(t => t.text);
    
    // 1. 낙관적 업데이트를 위한 임시 객체 생성
    const tempNoteId = `temp-note-${Date.now()}`;
    const tempReminders: Reminder[] = parsedReminders.map((r, index) => ({
      id: `temp-reminder-${index}-${Date.now()}`,
      note_id: tempNoteId,
      owner_id: owner_id,
      reminder_text: r.reminderText || '',
      reminder_time: r.parsedDate?.toISOString() || new Date().toISOString(),
      original_text: r.originalText,
      completed: false,
      enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const newNote: Note = {
      id: tempNoteId,
      owner_id,
      title,
      content,
      tags: tagTexts,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      reminders: tempReminders, // 임시 리마인더를 포함
      is_public: false,
      parent_id: null,
      note_type: 'note',
      content_preview: content.substring(0, 100),
    };

    // 2. UI에 즉시 반영
    get().addNoteState(newNote);

    try {
      // 3. DB에 데이터 전송
      const reminderPayloads = tempReminders.map(r => ({
        reminder_text: r.reminder_text,
        reminder_time: r.reminder_time,
        original_text: r.original_text,
      }));

      const { error } = await supabase.rpc('create_note_with_details', {
        owner_id_param: owner_id,
        title_param: title,
        content_param: content,
        tags_param: tagTexts,
        reminders_param: reminderPayloads,
      });

      if (error) throw error;

    } catch (err) {
      console.error("Failed to create note:", err);
      // 4. 실패 시, 낙관적 업데이트 롤백
      get().removeNoteState(tempNoteId);
    }
  },

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
      // 중복 추가 방지
      notes: state.notes.some(n => n.id === newNote.id) ? state.notes : [newNote, ...state.notes],
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
        .select(
          'id, title, owner_id, is_public, parent_id, note_type, tags, created_at, updated_at, content_preview, reminders(*)',
        )
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