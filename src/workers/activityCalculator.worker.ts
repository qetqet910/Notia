// 워커 내의 외부 별칭(@/) 참조는 빌드 시 문제를 일으킬 수 있으므로
// 필요한 타입을 직접 정의하거나 최소화합니다.

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
self.onmessage = (event: MessageEvent<any[]>) => {
  const notes = event.data;

  const data = new Map<string, number>();
  let totalNotes = 0;
  let totalReminders = 0;
  let completedReminders = 0;
  const tags = new Set<string>();

  if (!notes || !Array.isArray(notes)) {
    self.postMessage({ 
      stats: { totalNotes: 0, totalReminders: 0, completedReminders: 0, completionRate: 0, tagsUsed: 0 }, 
      activityData: [] 
    });
    return;
  }

  notes.forEach((note: any) => {
    totalNotes++;
    if (note.tags && Array.isArray(note.tags)) {
      note.tags.forEach((tag: string) => tags.add(tag));
    }
    
    if (note.reminders && Array.isArray(note.reminders)) {
      note.reminders.forEach((r: any) => {
        totalReminders++;
        if (r.completed) {
          completedReminders++;
          // r.updated_at 또는 r.reminder_time 등 완료 시점을 알 수 있는 날짜 사용
          const dateSource = r.updated_at || r.reminder_time;
          if (dateSource) {
            const d = new Date(dateSource);
            if (!isNaN(d.getTime())) {
              const year = d.getUTCFullYear();
              const month = String(d.getUTCMonth() + 1).padStart(2, '0');
              const day = String(d.getUTCDate()).padStart(2, '0');
              const dateStr = `${year}-${month}-${day}`;
              data.set(dateStr, (data.get(dateStr) || 0) + 1);
            }
          }
        }
      });
    }
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