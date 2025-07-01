import { create } from 'zustand';
import { supabase } from '@/services/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Note } from '@/types';

interface DataState {
  notes: Note[];
  isInitialized: boolean;
  initialize: (userId: string) => Promise<void>;
  unsubscribeAll: () => void;
}

export const useDataStore = create<DataState>((set, get) => ({
  notes: [],
  isInitialized: false,
  channels: [], // 내부용 채널 관리

  /**
   * 사용자와 관련된 모든 데이터를 가져오고 실시간 구독을 시작합니다.
   * 이 함수는 앱에서 단 한 번만 호출되어야 합니다.
   */
  initialize: async (userId: string) => {
    // 중복 실행 방지
    if (get().isInitialized) return;
    set({ isInitialized: true });

    const fetchDataAndSubscribe = async () => {
      // --- 1. 데이터 가져오기 ---
      // 사용자의 개인 노트와 팀 노트를 모두 가져옵니다.
      try {
        const { data, error } = await supabase.rpc('get_all_user_notes', {
          p_user_id: userId,
        });

        if (error) throw new Error('데이터 로드 실패: ' + error.message);

        // 데이터 포맷팅 (날짜 객체 변환 등)
        const formattedNotes = data.map((note: any) => ({
          ...note,
          createdAt: new Date(note.created_at),
          updatedAt: new Date(note.updated_at),
          reminders:
            note.reminders?.map((r: any) => ({
              ...r,
              date: new Date(r.reminder_time),
            })) || [],
        }));
        set({ notes: formattedNotes });
      } catch (err) {
        console.error('Initialize Error:', err);
        set({ isInitialized: false }); // 실패 시 다시 시도할 수 있도록 초기화
        return;
      }

      // --- 2. 실시간 구독 설정 ---
      get().unsubscribeAll(); // 기존 구독 해지

      const handleChange = (payload: any) => {
        console.log(
          'Realtime change detected, refetching all data...',
          payload,
        );
        // 어떤 변경이든 데이터를 전부 다시 가져오는 것이 가장 안정적입니다.
        fetchDataAndSubscribe();
      };

      // 사용자가 접근할 수 있는 모든 테이블의 변경을 감지합니다.
      const notesChannel = supabase
        .channel('realtime-notes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'notes' },
          handleChange,
        )
        .subscribe();
      const remindersChannel = supabase
        .channel('realtime-reminders')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'reminders' },
          handleChange,
        )
        .subscribe();
      const groupNotesChannel = supabase
        .channel('realtime-group-notes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'group_notes' },
          handleChange,
        )
        .subscribe();
      const groupMembersChannel = supabase
        .channel('realtime-group-members')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'group_members',
            filter: `user_id=eq.${userId}`,
          },
          handleChange,
        )
        .subscribe();

      (get() as any).channels = [
        notesChannel,
        remindersChannel,
        groupNotesChannel,
        groupMembersChannel,
      ];
    };

    await fetchDataAndSubscribe();
  },

  /**
   * 모든 실시간 구독을 해지합니다.
   */
  unsubscribeAll: async () => {
    const channels = (get() as any).channels;
    if (channels && channels.length > 0) {
      await supabase.removeAllChannels();
      (get() as any).channels = [];
      set({ isInitialized: false }); // 구독 해지 시 초기화 상태도 되돌림
    }
  },
}));
