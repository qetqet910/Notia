import { useMemo } from 'react';
import { useDataStore } from '@/stores/dataStore';
import { useAuthStore } from '@/stores/authStore';
import type { Reminder } from '@/types';

const getStartOfWeek = (): Date => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const startOfWeek = new Date(now.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
};

export const useGoalStats = () => {
  const { user } = useAuthStore();
  const allNotes = useDataStore((state) => state.notes);

  const notes = useMemo(
    () =>
      Object.values(allNotes || {}).filter(
        (note) => note && note.owner_id === user?.id && !note.deleted_at,
      ),
    [allNotes, user?.id],
  );

  return useMemo(() => {
    const empty = {
      weeklyNote: { current: 0, goal: 10, percentage: 0 },
      weeklyReminder: { current: 0, goal: 5, percentage: 0 },
    };

    if (!user) return empty;

    const noteGoal: number = user.user_metadata?.noteGoal ?? 10;
    const reminderGoal: number = user.user_metadata?.reminderGoal ?? 5;
    const startOfWeek = getStartOfWeek();

    const notesThisWeek = notes.filter(
      (note) => new Date(note.created_at) >= startOfWeek,
    ).length;

    const remindersCompletedThisWeek = notes.reduce((count, note) => {
      return (
        count +
        (note.reminders || []).filter(
          (r: Reminder) =>
            r.completed && r.updated_at && new Date(r.updated_at) >= startOfWeek,
        ).length
      );
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
  }, [notes, user, user?.user_metadata]);
};
