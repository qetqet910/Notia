import { useState, useEffect, useMemo, useCallback } from 'react';
import { Note, EditorReminder, Reminder } from '@/types';
import { supabase } from '@/services/supabaseClient';
import { useAuthStore } from '@/stores/authStore';
import { useDataStore } from '@/stores/dataStore';
import { fromZonedTime } from 'date-fns-tz';

// 한국 시간대 상수
const KOREA_TIMEZONE = 'Asia/Seoul';

// 한국 시간대 기준으로 현재 시간을 UTC로 변환하는 헬퍼 함수
const getKoreaTimeAsUTC = (): string => {
  const now = new Date();
  return fromZonedTime(now, KOREA_TIMEZONE).toISOString();
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
  const { initialize, unsubscribeAll, addNoteState, removeNoteState } =
    useDataStore.getState();

  const notes = useMemo(
    () =>
      (allNotes || []).filter(
        (note) =>
          note && typeof note === 'object' && note.owner_id === user?.id,
      ),
    [allNotes, user],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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

        const newNoteWithDate: Note = {
          ...data,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
          reminders: [],
        };

        // ✅ DB로부터 받은 완전한 노트로 로컬 상태를 즉시 업데이트
        addNoteState(newNoteWithDate);

        return newNoteWithDate; // 완전한 노트를 반환
      } catch (err) {
        console.error('노트 추가 중 오류 발생:', err);
        setError(
          err instanceof Error ? err : new Error('노트 추가 중 오류 발생'),
        );
        return null;
      }
    },
    [user, addNoteState],
  );

  useEffect(() => {
    if (user) {
      setLoading(true);
      initialize(user.id).finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
      unsubscribeAll();
    }

    return () => {
      unsubscribeAll();
    };
  }, [user, initialize, unsubscribeAll]);

  const fetchNoteContent = useCallback(async (noteId: string) => {
    const localNote = useDataStore
      .getState()
      .notes.find((n) => n.id === noteId);
    if (localNote && localNote.content) {
      return localNote.content;
    }

    const { data, error } = await supabase
      .from('notes')
      .select('content')
      .eq('id', noteId)
      .single();

    if (error) {
      console.error('노트 내용 로딩 실패:', error);
      return null;
    }

    // 불러온 content로 dataStore 상태 업데이트
    useDataStore
      .getState()
      .updateNoteState({ ...localNote, content: data.content });

    return data.content;
  }, []);

  const goalStats = useMemo(() => {
    if (!user || !notes) {
      return {
        weeklyNote: { current: 0, goal: 10, percentage: 0 },
        weeklyReminder: { current: 0, goal: 5, percentage: 0 },
      };
    }

    const noteGoal = user?.user_metadata?.noteGoal ?? 10;
    const reminderGoal = user?.user_metadata?.reminderGoal ?? 5;
    const startOfWeek = getStartOfWeek();

    // 1. 주간 노트 작성 수
    const notesThisWeek = notes.filter(
      (note) => new Date(note.created_at) >= startOfWeek,
    ).length;

    // 2. 주간 리마인더 완료 수
    const remindersCompletedThisWeek = notes.reduce((count, note) => {
      const completedInNote = (note.reminders || []).filter(
        (reminder: EditorReminder) =>
          reminder.completed &&
          reminder.updated_at && // completed_at 대신 updated_at 사용 가정
          new Date(reminder.updated_at) >= startOfWeek,
      ).length;
      return count + completedInNote;
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
  }, [notes, user?.user_metadata]);

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

        let upsertedData: Reminder[] = [];
        if (finalReminders.length > 0) {
          const reminderData = finalReminders
            .filter(reminder => reminder.date instanceof Date && !isNaN(reminder.date.getTime()))
            .map((reminder) => ({
              note_id: noteId,
              owner_id: user.id,
              reminder_text: reminder.text,
              reminder_time: new Date(reminder.date).toISOString(),
              completed: reminder.completed || false,
              enabled: reminder.enabled ?? true,
              original_text: reminder.original_text,
            }));

          if (reminderData.length > 0) {
            const { data, error: upsertError } = await supabase
              .from('reminders')
              .upsert(reminderData, { onConflict: 'note_id, original_text' })
              .select();

            if (upsertError) throw upsertError;
            upsertedData = data as Reminder[];
          }
        }

        return upsertedData;
      } catch (err) {
        console.error(
          '[세이브리마인더-에러] 리마인더 동기화 중 오류 발생:',
          err,
        );
        return [];
      }
    },
    [user],
  );

  const updateNoteOnly = useCallback(
    async (updatedNote: Note) => {
      if (!user) return false;

      try {
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
    async (noteId: string, updates: Partial<Pick<Note, 'title' | 'content' | 'tags' | 'reminders'>>) => {
      if (!user) return false;

      const { updateNoteState, notes } = useDataStore.getState();
      const originalNote = notes.find(n => n.id === noteId);

      if (!originalNote) {
        console.error("업데이트할 노트를 찾을 수 없습니다.");
        return false;
      }

      // 1. 전체 낙관적 업데이트: UI 상태를 즉시 변경
      const updatedNote: Note = {
        ...originalNote,
        ...updates,
        updated_at: new Date().toISOString(),
      };
      updateNoteState(updatedNote);

      try {
        // 2. DB에 노트 내용 업데이트
        const { error: noteError } = await supabase
          .from('notes')
          .update({
            title: updates.title,
            content: updates.content,
            tags: updates.tags,
            updated_at: getKoreaTimeAsUTC(),
          })
          .eq('id', noteId)
          .eq('owner_id', user.id);
        if (noteError) throw noteError;

        // 3. DB에 리마인더 동기화
        const syncedReminders = await saveReminders(
          noteId,
          updates.reminders || [],
        );

        // 4. 동기화된 리마인더(실제 ID 포함)로 최종 상태 업데이트
        const finalNote: Note = {
          ...updatedNote,
          reminders: syncedReminders.map(
            (r: Reminder): EditorReminder => ({
              id: r.id,
              text: r.reminder_text,
              date: new Date(r.reminder_time),
              completed: r.completed,
              enabled: r.enabled,
              original_text: r.original_text,
              updated_at: r.updated_at,
            }),
          ),
        };
        updateNoteState(finalNote);

        return true;

      } catch (err) {
        console.error('노트 업데이트 중 오류 발생:', err);
        setError(
          err instanceof Error ? err : new Error('노트 업데이트 중 오류 발생'),
        );
        
        // 5. 롤백: 오류 발생 시 원래 노트 상태로 복원
        if (originalNote) {
          updateNoteState(originalNote);
        }
        
        return false;
      }
    },
    [user, saveReminders],
  );

  // 노트 삭제 (리마인더도 함께 삭제)
  const deleteNote = useCallback(
    async (noteId: string) => {
      if (!user) return false;

      removeNoteState(noteId);

      try {
        await supabase.from('reminders').delete().eq('note_id', noteId);
        await supabase.from('notes').delete().eq('id', noteId);

        return true;
      } catch (err) {
        console.error('노트 삭제 중 오류 발생:', err);
        // 에러 발생 시, 데이터 저장소의 상태를 원래대로 되돌리는 로직 추가 가능
        return false;
      }
    },
    [user, removeNoteState],
  );

  const deleteReminder = useCallback(
    async (reminderId: string) => {
      if (!user) return false;

      try {
        const { error } = await supabase
          .from('reminders')
          .delete()
          .eq('id', reminderId)
          .eq('owner_id', user.id);

        if (error) {
          console.error('리마인더 삭제 처리 실패:', error);
          return false;
        }
        return true;
      } catch (err) {
        console.error('리마인더 삭제 중 오류 발생:', err);
        return false;
      }
    },
    [user],
  );

  const updateReminderCompletion = useCallback(
    async (reminderId: string, completed: boolean) => {
      if (!user) return false;

      useDataStore.getState().updateReminderState(reminderId, { completed });

      const { error } = await supabase
        .from('reminders')
        .update({ completed })
        .eq('id', reminderId)
        .eq('owner_id', user.id);

      if (error) {
        console.error('리마인더 완료 처리 실패:', error);
        return false;
      }
      return true;
    },
    [user],
  );

  const updateReminderEnabled = useCallback(
    async (reminderId: string, enabled: boolean) => {
      if (!user) return false;

      useDataStore.getState().updateReminderState(reminderId, { enabled });

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
              ...note,
              createdAt: new Date(note.created_at),
              updatedAt: new Date(note.updated_at),
              accessLevel:
                groupNotesData.find((gn) => gn.note_id === note.id)
                  ?.access_level || 'read',
              reminders:
                note.reminders?.map(
                  (reminder: Reminder): EditorReminder => ({
                    id: reminder.id,
                    text: reminder.reminder_text,
                    date: new Date(reminder.reminder_time),
                    completed: reminder.completed,
                    enabled: reminder.enabled,
                    original_text: `@${reminder.reminder_text}.`,
                    updated_at: reminder.updated_at,
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
    [user],
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
    fetchNoteContent,
    goalStats,
    updateUserGoals,
    addNote,
    updateNoteOnly,
    updateNote,
    deleteNote,
    deleteReminder,
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
