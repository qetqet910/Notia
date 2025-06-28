// src/stores/dataStore.ts

import { create } from 'zustand';
import { supabase } from '@/services/supabaseClient';
import type { PostgrestError, RealtimeChannel } from '@supabase/supabase-js';
import type { Note, Reminder, EditorReminder } from '@/types';

// Supabase에서 받은 데이터를 UI에서 사용하기 좋은 형태로 변환합니다.
const formatEditorReminder = (reminderData: Reminder): EditorReminder => ({
  id: reminderData.id,
  text: reminderData.reminder_text,
  date: new Date(reminderData.reminder_time),
  completed: reminderData.completed,
  original_text: `@${reminderData.reminder_text}.`, // 원본 텍스트 형식은 필요에 따라 조정
});

const formatNote = (noteData: any, allReminders: Reminder[]): Note => {
  // 해당 노트에 속한 리마인더만 필터링합니다.
  const relatedReminders = allReminders
    .filter((r) => r.note_id === noteData.id)
    .map(formatEditorReminder);

  return {
    id: noteData.id,
    title: noteData.title,
    content: noteData.content,
    owner_id: noteData.owner_id,
    created_at: noteData.created_at,
    updated_at: noteData.updated_at,
    is_public: noteData.is_public || false,
    parent_id: noteData.parent_id,
    note_type: noteData.note_type,
    tags: noteData.tags || [],
    createdAt: new Date(noteData.created_at),
    updatedAt: new Date(noteData.updated_at),
    reminders: relatedReminders,
  };
};

// --- Zustand Store Definition ---
interface DataState {
  notes: Note[];
  isLoading: boolean;
  error: string | null;
  channels: RealtimeChannel[];
}

interface DataActions {
  fetchInitialData: (userId: string) => Promise<void>;
  subscribeToChanges: (userId: string) => void;
  unsubscribeAll: () => void;
  // 기존 훅에 있던 CRUD 함수들
  addNote: (newNoteData: Omit<Note, 'id' | 'created_at' | 'updated_at' | 'createdAt' | 'updatedAt' | 'reminders'>) => Promise<void>;
  updateNote: (noteId: string, updatedData: Partial<Note>) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  addReminder: (newReminderData: Omit<Reminder, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateReminder: (reminderId: string, updatedData: Partial<Reminder>) => Promise<void>;
  deleteReminder: (reminderId: string) => Promise<void>;
}

export const useDataStore = create<DataState & DataActions>((set, get) => ({
  notes: [],
  isLoading: false,
  error: null,
  channels: [],

  /**
   * 사용자의 모든 노트와 리마인더를 가져옵니다.
   */
  fetchInitialData: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      // 1. 노트와 리마인더를 병렬로 가져옵니다 (효율성)
      const [notesResponse, remindersResponse] = await Promise.all([
        supabase.from('notes').select('*').eq('owner_id', userId),
        supabase.from('reminders').select('*').eq('owner_id', userId),
      ]);

      if (notesResponse.error) throw notesResponse.error;
      if (remindersResponse.error) throw remindersResponse.error;

      const allReminders = remindersResponse.data || [];
      const formattedNotes = (notesResponse.data || []).map(note => formatNote(note, allReminders));
      
      // 최신순으로 정렬
      formattedNotes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      set({ notes: formattedNotes, isLoading: false });
    } catch (err: any) {
      console.error('초기 데이터 로드 오류:', err);
      set({ error: err.message || '데이터 로드에 실패했습니다.', isLoading: false });
    }
  },

  /**
   * notes와 reminders 테이블의 변경사항을 실시간으로 구독합니다.
   * `fetchInitialData`가 완료된 후 호출해야 데이터 정합성이 보장됩니다.
   */
  subscribeToChanges: (userId: string) => {
    get().unsubscribeAll(); // 기존 구독이 있다면 모두 해지

    const handleNoteChange = (payload: any) => {
      // 실시간 이벤트 발생 시, 그냥 전체 데이터를 다시 불러오는 것이
      // 복잡한 병합 로직을 짜는 것보다 간단하고 안정적일 수 있습니다.
      console.log('Note change detected, refetching data...', payload);
      get().fetchInitialData(userId);
    };

    const handleReminderChange = (payload: any) => {
      console.log('Reminder change detected, refetching data...', payload);
      get().fetchInitialData(userId);
    };

    const notesChannel = supabase
      .channel('realtime-notes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes', filter: `owner_id=eq.${userId}` }, handleNoteChange)
      .subscribe();

    const remindersChannel = supabase
      .channel('realtime-reminders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reminders', filter: `owner_id=eq.${userId}` }, handleReminderChange)
      .subscribe();

    set({ channels: [notesChannel, remindersChannel] });
  },

  /**
   * 모든 실시간 구독을 해지합니다.
   */
  unsubscribeAll: async () => {
    const { channels } = get();
    if (channels.length > 0) {
      await supabase.removeChannels(channels);
      set({ channels: [] });
    }
  },

  // --- CRUD Actions ---
  // 이 함수들은 DB에만 요청을 보냅니다.
  // UI 업데이트는 실시간 구독이 감지하여 fetchInitialData를 호출함으로써 자동으로 처리됩니다.

  addNote: async (newNoteData) => {
    const { error } = await supabase.from('notes').insert(newNoteData);
    if (error) set({ error: '노트 추가에 실패했습니다.' });
  },

  updateNote: async (noteId, updatedData) => {
    const { error } = await supabase.from('notes').update(updatedData).eq('id', noteId);
    if (error) set({ error: '노트 수정에 실패했습니다.' });
  },

  deleteNote: async (noteId) => {
    const { error } = await supabase.from('notes').delete().eq('id', noteId);
    if (error) set({ error: '노트 삭제에 실패했습니다.' });
  },
  
  addReminder: async (newReminderData) => {
    const { error } = await supabase.from('reminders').insert(newReminderData);
    if (error) set({ error: '리마인더 추가에 실패했습니다.' });
  },

  updateReminder: async (reminderId, updatedData) => {
    const { error } = await supabase.from('reminders').update(updatedData).eq('id', reminderId);
    if (error) set({ error: '리마인더 수정에 실패했습니다.' });
  },

  deleteReminder: async (reminderId) => {
    const { error } = await supabase.from('reminders').delete().eq('id', reminderId);
    if (error) set({ error: '리마인더 삭제에 실패했습니다.' });
  },
}));