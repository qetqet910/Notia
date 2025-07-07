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

const getStartOfToday = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
};

const getStartOfWeek = () => {
  const now = new Date();
  const day = now.getDay(); // 0 (일요일) - 6 (토요일)
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // 월요일을 시작으로 설정
  const startOfWeek = new Date(now.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
};

export const useNotes = () => {
  const { user } = useAuthStore();
  const allNotes = useDataStore((state) => state.notes);
  const { initialize, unsubscribeAll } = useDataStore.getState();
  const isInitialized = useDataStore((state) => state.isInitialized);
  const { addNoteState } = useDataStore.getState();
  const { removeNoteState } = useDataStore.getState();

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

  const goalStats = useMemo(() => {
    if (!user || !notes) {
      return {
        weeklyNote: { current: 0, goal: 10, percentage: 0 },
        weeklyReminder: { current: 0, goal: 5, percentage: 0 },
      };
    }

    const noteGoal = user.user_metadata?.reminderGoal ?? 10;
    const reminderGoal = user.user_metadata?.noteGoal ?? 5;
    const startOfWeek = getStartOfWeek();

    // 1. 주간 노트 작성 수
    const notesThisWeek = notes.filter(
      (note) => new Date(note.created_at) >= startOfWeek,
    ).length;

    // 2. 주간 리마인더 완료 수 (⭐️ completed_at 기준으로 변경)
    const remindersCompletedThisWeek = notes.reduce((count, note) => {
      return (note.reminders || []).map(
        (reminder: any) =>
          reminder.completed_at &&
          new Date(reminder.completed_at) >= startOfWeek,
      ).length;
    }, 0);

    return {
      weeklyNote: {
        current: notesThisWeek,
        goal: noteGoal,
        percentage:
          noteGoal > 0
            ? Math.min(100, Math.round((notesThisWeek / noteGoal) * 100))
            : 0,
      },
      weeklyReminder: {
        current: remindersCompletedThisWeek,
        goal: reminderGoal,
        percentage:
          reminderGoal > 0
            ? Math.min(
                100,
                Math.round((remindersCompletedThisWeek / reminderGoal) * 100),
              )
            : 0,
      },
    };
  }, [notes, user]);

  const updateUserGoals = useCallback(
    async (goals: { reminderGoal: number; noteGoal: number }) => {
      const { error } = await supabase.auth.updateUser({
        data: {
          reminderGoal: goals.reminderGoal,
          noteGoal: goals.noteGoal,
        },
      });

      if (error) {
        throw new Error(error.message);
      }
    },
    [],
  );

  // 노트 추가
  const addNote = useCallback(
    async (newNoteData: Pick<Note, 'title' | 'content' | 'tags'>) => {
      if (!user) return null;

      try {
        const { data, error } = await supabase
          .from('notes')
          .insert([
            {
              owner_id: user.id,
              title: newNoteData.title,
              content: newNoteData.content,
              tags: newNoteData.tags,
            },
          ])
          .select() // ⭐ 중요: 삽입된 전체 데이터를 반환받음
          .single(); // 단일 객체로 받음

        if (error) throw error;

        const newNoteWithDate = {
          ...data,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        } as Note;

        // ✅ DB로부터 받은 완전한 노트로 로컬 상태를 즉시 업데이트
        addNoteState(newNoteWithDate);

        return newNoteWithDate; // 완전한 노트를 반환
      } catch (err) {
        // ... (에러 처리)
        return null;
      }
    },
    [user, addNoteState],
  );

  const saveReminders = useCallback(
    async (noteId: string, finalReminders: EditorReminder[]) => {
      if (!user) {
        console.error('[세이브리마인더-에러] 사용자 정보가 없습니다.');
        return []; // 빈 배열 반환
      }

      try {
        const { data: existingReminders, error: fetchError } = await supabase
          .from('reminders')
          .select('id, original_text')
          .eq('note_id', noteId);
        if (fetchError) throw fetchError;

        const finalTexts = new Set(finalReminders.map((r) => r.original_text));
        const idsToDelete = existingReminders
          .filter((r) => !finalTexts.has(r.original_text))
          .map((r) => r.id);

        if (idsToDelete.length > 0) {
          const { error: deleteError } = await supabase
            .from('reminders')
            .delete()
            .in('id', idsToDelete);
          if (deleteError) throw deleteError;
        }

        let upsertedData: any[] = [];
        if (finalReminders.length > 0) {
          const reminderData = finalReminders.map((reminder: any) => ({
            note_id: noteId,
            owner_id: user.id,
            reminder_text: reminder.text || reminder.reminder_text,
            // 'date' 또는 'reminder_time'을 Date 객체로 변환 후 ISO 문자열로 저장
            reminder_time: (reminder.date
              ? new Date(reminder.date)
              : new Date(reminder.reminder_time)
            ).toISOString(),
            completed: reminder.completed || false,
            enabled: reminder.enabled ?? true,
            original_text: reminder.original_text,
          }));

          // .select()를 추가하여 upsert된 전체 데이터를 반환받습니다.
          const { data, error: upsertError } = await supabase
            .from('reminders')
            .upsert(reminderData, { onConflict: 'note_id, original_text' })
            .select(); // ⭐ 중요: .select() 추가

          if (upsertError) throw upsertError;
          upsertedData = data;
        }

        // DB에서 가져온 완전한 데이터를 반환합니다.
        return upsertedData;
      } catch (err) {
        console.error(
          '[세이브리마인더-에러] 리마인더 동기화 중 오류 발생:',
          err,
        );
        return []; // 에러 시 빈 배열 반환
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
      if (!user) return false;

      const { updateNoteState } = useDataStore.getState();

      try {
        // 1. 노트 텍스트 정보 먼저 DB에 업데이트
        const { error: noteError } = await supabase
          .from('notes')
          .update({
            title: updatedNote.title,
            content: updatedNote.content,
            tags: updatedNote.tags,
            updated_at: getKoreaTimeAsUTC(),
          })
          .eq('id', updatedNote.id)
          .eq('owner_id', user.id);
        if (noteError) throw noteError;

        // 2. 리마인더를 저장하고, DB에서 생성된 id가 포함된 완전한 데이터를 반환받음
        const syncedReminders = await saveReminders(
          updatedNote.id,
          updatedNote.reminders || [],
        );

        // 3. 반환받은 완전한 리마인더 데이터로 최종 노트 객체를 만듦
        const finalNote = {
          ...updatedNote,
          reminders: syncedReminders.map((r: any) => ({
            ...r,
            text: r.reminder_text,
            date: new Date(r.reminder_time),
          })),
        };

        // 4. 완전한 데이터로 낙관적 업데이트 수행! (이제 '유령'이 아님)
        updateNoteState(finalNote);

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
      if (!user) return false;

      // ✅ 1. 낙관적 업데이트: UI에서 노트를 즉시 제거
      removeNoteState(noteId);

      try {
        // 2. 백그라운드에서 실제 DB 작업 수행
        // ... (리마인더 삭제 로직은 그대로 유지)
        await supabase.from('reminders').delete().eq('note_id', noteId);
        await supabase.from('notes').delete().eq('id', noteId);

        return true;
      } catch (err) {
        // ... (에러 처리)
        // 실패 시, 전체 데이터를 다시 불러와 상태를 복구할 수 있음 (현재는 실시간 동기화가 처리)
        return false;
      }
    },
    [user, removeNoteState],
  );
  const updateReminderCompletion = useCallback(
    async (reminderId: string, completed: boolean) => {
      if (!user) return false;

      // 1. 낙관적 업데이트: UI 즉시 변경
      useDataStore.getState().updateReminderState(reminderId, { completed });

      // 2. 실제 DB 업데이트 (버그 수정: .eq 추가)
      const { error } = await supabase
        .from('reminders')
        .update({ completed })
        .eq('id', reminderId)
        .eq('owner_id', user.id);

      if (error) {
        console.error('리마인더 완료 처리 실패:', error);
        // 실패 시 원래 상태로 롤백 (여기서는 실시간 동기화가 해결해 줌)
        return false;
      }
      return true;
    },
    [user],
  );

  const updateReminderEnabled = useCallback(
    async (reminderId: string, enabled: boolean) => {
      if (!user) return false;

      // 1. 낙관적 업데이트: UI 즉시 변경
      useDataStore.getState().updateReminderState(reminderId, { enabled });

      // 2. 실제 DB 업데이트
      const { error } = await supabase
        .from('reminders')
        .update({ enabled })
        .eq('id', reminderId)
        .eq('owner_id', user.id);

      if (error) {
        console.error('리마인더 알림 설정 실패:', error);
        return false;
      }
      return true;
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
    goalStats,
    updateUserGoals,
    addNote,
    updateNoteOnly,
    updateNote,
    deleteNote,
    updateReminderCompletion,
    updateReminderEnabled,
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
