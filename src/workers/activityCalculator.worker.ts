// src/workers/activityCalculator.worker.ts
import type { Note, Reminder } from '@/types';

interface Stats {
  totalNotes: number;
  totalReminders: number;
  completedReminders: number;
  completionRate: number;
  tagsUsed: number;
}

interface ActivityData {
  date: string;
  count: number;
  level: number;
}

// self는 웹 워커의 전역 스코프를 참조합니다.
self.onmessage = (event: MessageEvent<Note[]>) => {
  const notes = event.data;

  const data = new Map<string, number>();
  let totalNotes = 0;
  let totalReminders = 0;
  let completedReminders = 0;
  const tags = new Set<string>();

  notes.forEach((note: Note) => {
    totalNotes++;
    note.tags.forEach((tag) => tags.add(tag));
    (note.reminders || []).forEach((r: Reminder) => {
      totalReminders++;
      if (r.completed) {
        completedReminders++;
        if (r.updated_at) {
          const date = new Date(r.updated_at).toISOString().split('T')[0];
          data.set(date, (data.get(date) || 0) + 1);
        }
      }
    });
  });

  const completionRate =
    totalReminders > 0 ? (completedReminders / totalReminders) * 100 : 0;

  const sortedData = Array.from(data.entries()).sort(
    ([dateA], [dateB]) =>
      new Date(dateA).getTime() - new Date(dateB).getTime(),
  );

  const finalActivityData: ActivityData[] = sortedData.map(([date, count]) => ({
    date,
    count,
    level: Math.min(4, Math.ceil(count / 2)),
  }));

  const finalStats: Stats = {
    totalNotes,
    totalReminders,
    completedReminders,
    completionRate,
    tagsUsed: tags.size,
  };

  // 계산된 결과를 메인 스레드로 다시 보냅니다.
  self.postMessage({ stats: finalStats, activityData: finalActivityData });
};
