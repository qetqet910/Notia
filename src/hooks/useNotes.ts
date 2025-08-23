import { useState, useEffect, useMemo, useCallback } from 'react';
import { Note, EditorReminder, Reminder } from '@/types';
import { supabase } from '@/services/supabaseClient';
import { useAuthStore } from '@/stores/authStore';
import { useDataStore } from '@/stores/dataStore';
import { fromZonedTime } from 'date-fns-tz';
import { v4 as uuidv4 } from 'uuid';

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
  const { initialize, unsubscribeAll, removeNoteState } =
    useDataStore.getState();

  const notes = useMemo(
    () =>
      Object.values(allNotes || {})
        .filter(
          (note) =>
            note && typeof note === 'object' && note.owner_id === user?.id,
        )
        .sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
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
        const note = await useDataStore.getState().createNote({
          title: newNoteData.title,
          content: newNoteData.content || '', // content가 undefined일 경우 빈 문자열을 전달
          tags: newNoteData.tags,
          owner_id: user.id,
        });
        return note;
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
    const localNote = useDataStore.getState().notes[noteId];
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
        (reminder: Reminder) =>
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

  const generatePreNotificationReminders = (
    baseReminder: Omit<Reminder, 'id' | 'created_at' | 'updated_at'>,
  ): Omit<Reminder, 'id' | 'created_at' | 'updated_at'>[] => {
    const notificationsToSchedule: Omit<Reminder, 'id' | 'created_at' | 'updated_at'>[] = [];
    const originalTime = new Date(baseReminder.reminder_time);
    const now = new Date();
    const clientReminderId = uuidv4();

    const intervals = [
      { minutes: 30, type: 'before_30m' },
      { minutes: 20, type: 'before_20m' },
      { minutes: 15, type: 'before_15m' },
      { minutes: 10, type: 'before_10m' },
      { minutes: 5, type: 'before_5m' },
      { minutes: 3, type: 'before_3m' },
      { minutes: 1, type: 'before_1m' },
    ];

    for (const interval of intervals) {
      const beforeTime = new Date(originalTime.getTime() - interval.minutes * 60 * 1000);
      if (beforeTime > now) {
        notificationsToSchedule.push({
          ...baseReminder,
          reminder_time: fromZonedTime(beforeTime, KOREA_TIMEZONE).toISOString(),
          notification_type: interval.type,
          client_reminder_id: clientReminderId,
        });
      }
    }

    notificationsToSchedule.push({
      ...baseReminder,
      notification_type: 'at_time',
      client_reminder_id: clientReminderId,
    });

    return notificationsToSchedule;
  };

  const saveReminders = useCallback(
    async (noteId: string, finalReminders: EditorReminder[]) => {
      if (!user) {
        console.error('[세이브리마인더-에러] 사용자 정보가 없습니다.');
        return [];
      }

      try {
        // 1. Handle deletions: Find reminders in DB that are not in the editor anymore
        const finalOriginalTexts = new Set(finalReminders.map(r => r.original_text));
        const { data: existingReminders, error: fetchError } = await supabase
          .from('reminders')
          .select('id, original_text')
          .eq('note_id', noteId);
        if (fetchError) throw fetchError;

        const idsToDelete = existingReminders
          .filter(r => !finalOriginalTexts.has(r.original_text))
          .map(r => r.id);

        if (idsToDelete.length > 0) {
          await supabase.from('reminders').delete().in('id', idsToDelete);
        }

        // 2. Prepare and upsert the original reminders from the editor
        const reminderDataToUpsert = finalReminders
          .filter(r => r.date instanceof Date && !isNaN(r.date.getTime()))
          .map(r => {
            const roundedDate = new Date(r.date.getTime());
            if (roundedDate.getSeconds() > 0) {
              roundedDate.setMinutes(roundedDate.getMinutes() + 1);
              roundedDate.setSeconds(0, 0);
            }
            return {
              note_id: noteId,
              owner_id: user.id,
              reminder_text: r.text,
              reminder_time: fromZonedTime(roundedDate, KOREA_TIMEZONE).toISOString(),
              completed: r.completed || false,
              enabled: r.enabled ?? true,
              original_text: r.original_text,
            };
          });
        
        if (reminderDataToUpsert.length === 0) {
          return []; // No valid reminders to process
        }

        const { data: upsertedReminders, error: upsertError } = await supabase
          .from('reminders')
          .upsert(reminderDataToUpsert, { onConflict: 'note_id, original_text' })
          .select();

        if (upsertError) throw upsertError;

        // 3. For each upserted reminder, regenerate its notification schedules
        for (const reminder of upsertedReminders) {
          // A. Delete all old schedules for this reminder to ensure consistency
          await supabase.from('notification_schedules').delete().eq('reminder_id', reminder.id);

          // B. Create new schedules only if the reminder is enabled
          if (reminder.enabled) {
            const schedulesToCreate = [];
            const originalTime = new Date(reminder.reminder_time);
            const now = new Date();

            const intervals = [
              { minutes: 30, type: 'before_30m' },
              { minutes: 20, type: 'before_20m' },
              { minutes: 15, type: 'before_15m' },
              { minutes: 10, type: 'before_10m' },
              { minutes: 5, type: 'before_5m' },
              { minutes: 3, type: 'before_3m' },
              { minutes: 1, type: 'before_1m' },
            ];

            for (const interval of intervals) {
              const beforeTime = new Date(originalTime.getTime() - interval.minutes * 60 * 1000);
              if (beforeTime > now) {
                schedulesToCreate.push({
                  reminder_id: reminder.id,
                  owner_id: user.id,
                  notification_type: interval.type,
                  scheduled_time: fromZonedTime(beforeTime, KOREA_TIMEZONE).toISOString(),
                });
              }
            }

            schedulesToCreate.push({
              reminder_id: reminder.id,
              owner_id: user.id,
              notification_type: 'at_time',
              scheduled_time: reminder.reminder_time,
            });

            if (schedulesToCreate.length > 0) {
              const { error: scheduleError } = await supabase
                .from('notification_schedules')
                .insert(schedulesToCreate);
              if (scheduleError) throw scheduleError;
            }
          }
        }

        return upsertedReminders;
      } catch (err) {
        console.error('[세이브리마인더-에러] 리마인더 동기화 중 오류 발생:', err);
        return [];
      }
    },
    [user],
  );

  // 노트 업데이트 (리마인더 포함)
  const updateNote = useCallback(
    async (
      noteId: string,
      updates: Partial<
        Pick<Note, 'title' | 'content' | 'tags'> & {
          reminders: EditorReminder[];
        }
      >,
    ) => {
      if (!user) return false;

      const { updateNoteState, notes } = useDataStore.getState();
      const originalNote = notes[noteId];

      if (!originalNote) {
        console.error('업데이트할 노트를 찾을 수 없습니다.');
        return false;
      }

      // 1. Create a single, consistent timestamp for this entire update operation.
      const newUpdatedAt = new Date();

      // 2. Optimistic update for immediate UI feedback.
      const optimisticallyUpdatedNote: Note = {
        ...originalNote,
        title: updates.title ?? originalNote.title,
        content: updates.content ?? originalNote.content,
        tags: updates.tags ?? originalNote.tags,
        updated_at: newUpdatedAt.toISOString(),
        // Optimistically update reminders structure, but the real data will come from saveReminders
        reminders: (updates.reminders || []).map(
          (er: EditorReminder): Reminder => ({
            ...er,
            id: er.id || '',
            note_id: originalNote.id,
            owner_id: originalNote.owner_id,
            reminder_time: er.date.toISOString(),
            created_at: new Date().toISOString(),
            updated_at: newUpdatedAt.toISOString(),
          }),
        ),
      };
      updateNoteState(optimisticallyUpdatedNote);

      try {
        // 3. Update reminders and the note itself in the database.
        const syncedReminders = await saveReminders(
          noteId,
          updates.reminders || [],
        );

        const { data: dbNote, error: noteError } = await supabase
          .from('notes')
          .update({
            title: updates.title,
            content: updates.content,
            tags: updates.tags,
            updated_at: newUpdatedAt.toISOString(), // Use the consistent timestamp
          })
          .eq('id', noteId)
          .select()
          .single();

        if (noteError) throw noteError;

        // 4. Final state sync with server-confirmed data.
        const finalNote: Note = {
          ...(dbNote as Note),
          reminders: syncedReminders,
        };
        updateNoteState(finalNote);

        return true;
      } catch (err) {
        console.error('노트 업데이트 중 오류 발생:', err);
        setError(
          err instanceof Error ? err : new Error('노트 업데이트 중 오류 발생'),
        );
        
        // Rollback to the original state on failure.
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
              reminders: note.reminders || [],
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
