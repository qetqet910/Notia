import { useState, useEffect, useMemo, useCallback } from 'react';
import { Note, EditorReminder } from '@/types';
import { supabase } from '@/services/supabaseClient';
import { useAuthStore } from '@/stores/authStore';
import { useDataStore } from '@/stores/dataStore';
import { fromZonedTime } from 'date-fns-tz';
import {
  createReminderNotifications,
  cancelReminderNotifications,
} from '@/utils/supabaseNotifications';

// 한국 시간대 상수
const KOREA_TIMEZONE = 'Asia/Seoul';

// 한국 시간대 기준으로 현재 시간을 UTC로 변환하는 헬퍼 함수
const getKoreaTimeAsUTC = (): string => {
  const now = new Date();
  return fromZonedTime(now, KOREA_TIMEZONE).toISOString();
};

// 특정 날짜를 한국 시간대 기준으로 UTC로 변환하는 헬퍼 함수
const convertKoreaDateToUTC = (date: Date): string => {
  return fromZonedTime(date, KOREA_TIMEZONE).toISOString();
};

export const useNotes = () => {
  const { user } = useAuthStore();
  const allNotes = useDataStore((state) => state.notes);
  const { initialize, unsubscribeAll } = useDataStore.getState();
  const isInitialized = useDataStore((state) => state.isInitialized);

  const notes = useMemo(
    () => allNotes.filter((note) => note.owner_id === user?.id),
    [allNotes, user],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (user && !isInitialized) {
      setLoading(true);
      initialize(user.id).finally(() => setLoading(false));
    } else if (!user) {
      setLoading(false);
    } else {
      // user && isInitialized
      setLoading(false);
    }

    // 컴포넌트가 언마운트되거나 사용자가 바뀔 때 구독을 해지합니다.
    return () => {
      unsubscribeAll();
    };
  }, [user, initialize, unsubscribeAll, isInitialized]);

  ////////////////////////////////////////////////////////////////////////////

  // 노트 추가
  const addNote = useCallback(
    async (newNote: Omit<Note, 'id'>) => {
      if (!user) return;

      try {
        const koreaTime = getKoreaTimeAsUTC();

        const { data, error } = await supabase
          .from('notes')
          .insert([
            {
              owner_id: user.id,
              title: newNote.title,
              content: newNote.content,
              tags: newNote.tags,
              created_at: koreaTime,
              updated_at: koreaTime,
            },
          ])
          .select();

        if (error) throw error;

        return data[0] as Note;
      } catch (err) {
        console.error('노트 추가 중 오류 발생:', err);
        setError(
          err instanceof Error ? err : new Error('노트 추가 중 오류 발생'),
        );
        return null;
      }
    },
    [user],
  );

  const saveReminders = useCallback(
    async (noteId: string, finalReminders: EditorReminder[]) => {
      // ======================== 디버깅 코드 시작 ========================
      console.log('\n--- [ saveReminders 시작 ] ---');

      // [세이브리마인더-1] 클라이언트로부터 어떤 데이터를 받았는지 확인합니다.
      console.log(
        "[세이브리마인더-1] 전달받은 'finalReminders':",
        JSON.stringify(finalReminders, null, 2),
      );

      if (!user) {
        console.error('[세이브리마인더-에러] 사용자 정보가 없습니다.');
        return false;
      }

      try {
        const { data: existingReminders, error: fetchError } = await supabase
          .from('reminders')
          .select('id, original_text')
          .eq('note_id', noteId);
        if (fetchError) throw fetchError;

        // [세이브리마인더-2] DB에서 현재 노트에 연결된 리마인더를 가져온 결과를 확인합니다.
        console.log(
          "[세이브리마인더-2] DB의 'existingReminders':",
          JSON.stringify(existingReminders, null, 2),
        );

        const finalTexts = new Set(finalReminders.map((r) => r.original_text));
        const idsToDelete = existingReminders
          .filter((r) => !finalTexts.has(r.original_text))
          .map((r) => r.id);

        // [세이브리마인더-3] 어떤 리마인더를 삭제할지 확인합니다.
        console.log(
          "[세이브리마인더-3] 삭제 대상 ID 목록 'idsToDelete':",
          idsToDelete,
        );

        if (idsToDelete.length > 0) {
          console.log('  -> 삭제 작업을 실행합니다...');
          const { error: deleteError } = await supabase
            .from('reminders')
            .delete()
            .in('id', idsToDelete);
          if (deleteError) throw deleteError;
        }

        if (finalReminders.length > 0) {
          const reminderData = finalReminders.map((reminder) => ({
            note_id: noteId,
            owner_id: user.id,
            reminder_text: reminder.text,
            reminder_time: convertKoreaDateToUTC(reminder.date),
            completed: reminder.completed,
            enabled: true,
            original_text: reminder.original_text,
          }));

          // [세이브리마인더-4] DB에 삽입/업데이트(upsert)할 데이터를 확인합니다.
          console.log(
            "[세이브리마인더-4] Upsert 대상 데이터 'reminderData':",
            JSON.stringify(reminderData, null, 2),
          );
          console.log('  -> Upsert 작업을 실행합니다...');

          const { error: upsertError } = await supabase
            .from('reminders')
            .upsert(reminderData, { onConflict: 'note_id, original_text' });

          if (upsertError) throw upsertError;
        }

        console.log('--- [ saveReminders 종료: 성공 ] ---');
        return true;
      } catch (err) {
        // [세이브리마인더-에러] 오류 발생 시 내용을 확인합니다.
        console.error(
          '[세이브리마인더-에러] 리마인더 동기화 중 오류 발생:',
          err,
        );
        console.log('--- [ saveReminders 종료: 실패 ] ---');
        return false;
      }
    },
    [user],
  );

  const updateNoteOnly = useCallback(
    async (updatedNote: Note) => {
      if (!user) return false;

      try {
        // 노트만 업데이트 (리마인더 처리 제외)
        const { error: noteError } = await supabase.from('notes').update({
          title: updatedNote.title,
          content: updatedNote.content,
          tags: updatedNote.tags,
          updated_at: getKoreaTimeAsUTC(),
        });

        if (noteError) throw noteError;

        return true;
      } catch (err) {
        console.error('노트 업데이트 중 오류 발생:', err);
        return false;
      }
    },
    [user],
  );

  // 노트 업데이트 (리마인더 포함)
  const updateNote = useCallback(
    async (updatedNote: Note) => {
      if (!user) return;

      try {
        // 노트 업데이트
        const { error: noteError } = await supabase
          .from('notes')
          .update({
            title: updatedNote.title,
            content: updatedNote.content,
            tags: updatedNote.tags,
            updated_at: getKoreaTimeAsUTC(), // 한국 시간대 기준으로 업데이트 시간 설정
          })
          .eq('id', updatedNote.id)
          .eq('owner_id', user.id);

        if (noteError) throw noteError;

        // 리마인더 저장
        if (updatedNote.reminders) {
          const reminderSuccess = await saveReminders(
            updatedNote.id,
            updatedNote.reminders,
          );
          if (!reminderSuccess) {
            console.warn('리마인더 저장에 실패했지만 노트는 저장됨');
          }
        }

        return true;
      } catch (err) {
        console.error('노트 업데이트 중 오류 발생:', err);
        setError(
          err instanceof Error ? err : new Error('노트 업데이트 중 오류 발생'),
        );
        return false;
      }
    },
    [user, saveReminders],
  );

  // 노트 삭제 (리마인더도 함께 삭제)
  const deleteNote = useCallback(
    async (noteId: string) => {
      if (!user) return;

      try {
        // 리마인더 먼저 삭제
        await supabase
          .from('reminders')
          .delete()
          .eq('note_id', noteId)
          .eq('owner_id', user.id);

        // 노트 삭제
        const { error } = await supabase
          .from('notes')
          .delete()
          .eq('id', noteId);

        if (error) throw error;

        return true;
      } catch (err) {
        console.error('노트 삭제 중 오류 발생:', err);
        setError(
          err instanceof Error ? err : new Error('노트 삭제 중 오류 발생'),
        );
        return false;
      }
    },
    [user],
  );

  // 리마인더 완료 상태 토글
  const toggleReminderComplete = useCallback(
    async (reminderId: string, completed: boolean) => {
      if (!user) return false;

      try {
        const { error } = await supabase
          .from('reminders')
          .update({ completed, updated_at: getKoreaTimeAsUTC() });
        if (error) throw error;

        // 완료 상태가 되면 관련된 스케줄된 알림을 취소
        if (completed) {
          await cancelReminderNotifications(reminderId);
        } else {
          // 완료 해제 시 다시 알림 스케줄링 (필요하다면)
          // 이 부분은 리마인더 텍스트, 노트 제목 등 추가 정보가 필요하므로,
          // 현재는 `reminder.tsx`에서만 `handleToggleReminder`를 통해 처리하는 것이 더 안전합니다.
          // 여기서는 상태만 업데이트하고 알림 스케줄링은 ReminderView에 맡깁니다.
        }

        return true;
      } catch (err) {
        console.error('리마인더 상태 업데이트 중 오류 발생:', err);
        return false;
      }
    },
    [user],
  );

  // 리마인더 완료 상태 토글
  const toggleReminderEnabled = useCallback(
    async (reminderId: string, enabled: boolean) => {
      if (!user) return false;

      try {
        const { error } = await supabase
          .from('reminders')
          .update({ enabled })
          .eq('id', reminderId);
        if (error) throw error;

        // 완료 상태가 되면 관련된 스케줄된 알림을 취소
        if (enabled) {
          await cancelReminderNotifications(reminderId);
        } else {
          // 완료 해제 시 다시 알림 스케줄링 (필요하다면)
          // 이 부분은 리마인더 텍스트, 노트 제목 등 추가 정보가 필요하므로,
          // 현재는 `reminder.tsx`에서만 `handleToggleReminder`를 통해 처리하는 것이 더 안전합니다.
          // 여기서는 상태만 업데이트하고 알림 스케줄링은 ReminderView에 맡깁니다.
        }

        return true;
      } catch (err) {
        console.error('리마인더 상태 업데이트 중 오류 발생:', err);
        return false;
      }
    },
    [user],
  );

  // 팀 노트 관련 함수들 TODO: 기능구현하기
  const fetchTeamNotes = useCallback(
    async (teamId: string) => {
      if (!teamId || !user) return [];

      try {
        const { data: groupNotesData, error: groupNotesError } = await supabase
          .from('group_notes')
          .select('note_id, access_level')
          .eq('group_id', teamId);

        if (groupNotesError) throw groupNotesError;

        if (!groupNotesData.length) return [];

        const noteIds = groupNotesData.map((item) => item.note_id);

        const { data: notesData, error: notesError } = await supabase
          .from('notes')
          .select(
            `
          *,
          reminders (
            id,
            reminder_text,
            reminder_time,
            completed,
            enabled,
            created_at,
            updated_at
          )
        `,
          )
          .in('id', noteIds)
          .order('updated_at', { ascending: false });

        if (notesError) throw notesError;

        const formattedNotes: Note[] = notesData.map(
          (note) =>
            ({
              id: note.id,
              title: note.title,
              content: note.content,
              owner_id: note.owner_id,
              created_at: note.created_at,
              updated_at: note.updated_at,
              is_public: note.is_public || false,
              parent_id: note.parent_id,
              note_type: note.note_type,
              tags: note.tags || [],
              createdAt: new Date(note.created_at),
              updatedAt: new Date(note.updated_at),
              accessLevel:
                groupNotesData.find((gn) => gn.note_id === note.id)
                  ?.access_level || 'read',
              reminders:
                note.reminders?.map(
                  (reminder: any): EditorReminder => ({
                    id: reminder.id,
                    text: reminder.reminder_text,
                    date: new Date(reminder.reminder_time),
                    completed: reminder.completed,
                    original_text: `@${reminder.reminder_text}.`,
                  }),
                ) || [],
            } as Note & { accessLevel: string }),
        );

        return formattedNotes;
      } catch (err) {
        console.error('팀 노트 로드 중 오류 발생:', err);
        return [];
      }
    },
    [allNotes, user],
  );

  const shareNoteWithTeam = useCallback(
    async (
      noteId: string,
      teamId: string,
      accessLevel: 'read' | 'write' | 'admin' = 'read',
    ) => {
      try {
        const { data: existingShare } = await supabase
          .from('group_notes')
          .select('*')
          .eq('note_id', noteId)
          .eq('group_id', teamId)
          .single();

        if (existingShare) {
          const { error } = await supabase
            .from('group_notes')
            .update({ access_level: accessLevel })
            .eq('note_id', noteId)
            .eq('group_id', teamId);

          if (error) throw error;
        } else {
          const { error } = await supabase.from('group_notes').insert([
            {
              note_id: noteId,
              group_id: teamId,
              access_level: accessLevel,
              created_at: getKoreaTimeAsUTC(), // 한국 시간대 기준으로 생성 시간 설정
            },
          ]);

          if (error) throw error;
        }

        return true;
      } catch (err) {
        console.error('노트 공유 중 오류 발생:', err);
        return false;
      }
    },
    [user],
  );

  const unshareNoteWithTeam = useCallback(
    async (noteId: string, teamId: string) => {
      try {
        const { error } = await supabase
          .from('group_notes')
          .delete()
          .eq('note_id', noteId)
          .eq('group_id', teamId);

        if (error) throw error;

        return true;
      } catch (err) {
        console.error('노트 공유 취소 중 오류 발생:', err);
        return false;
      }
    },
    [],
  );

  const getTeamsWithAccess = useCallback(async (noteId: string) => {
    try {
      const { data, error } = await supabase
        .from('group_notes')
        .select(
          `
          group_id,
          access_level,
          user_groups:group_id(id, name)
        `,
        )
        .eq('note_id', noteId);

      if (error) throw error;

      return data.map((item) => ({
        teamId: item.group_id,
        teamName: item.user_groups,
        accessLevel: item.access_level,
      }));
    } catch (err) {
      console.error('노트 공유 정보 로드 중 오류 발생:', err);
      return [];
    }
  }, []);

  // 기존 유틸리티 함수들
  const getNotesByTag = useCallback(
    (tag: string) => {
      return notes.filter((note) => note.tags.includes(tag));
    },
    [notes],
  );

  const getNotesByDate = useCallback(
    (date: Date) => {
      return notes.filter((note) => {
        const noteDate = new Date(note.createdAt);
        return (
          noteDate.getFullYear() === date.getFullYear() &&
          noteDate.getMonth() === date.getMonth() &&
          noteDate.getDate() === date.getDate()
        );
      });
    },
    [notes],
  );

  const getAllTags = useCallback(() => {
    const tagSet = new Set<string>();
    notes.forEach((note) => {
      note.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }, [notes]);

  return {
    notes,
    loading,
    error,
    addNote,
    updateNoteOnly,
    updateNote,
    deleteNote,
    toggleReminderComplete,
    toggleReminderEnabled,
    getNotesByTag,
    getNotesByDate,
    getAllTags,
    fetchTeamNotes,
    shareNoteWithTeam,
    unshareNoteWithTeam,
    getTeamsWithAccess,
  };
};
