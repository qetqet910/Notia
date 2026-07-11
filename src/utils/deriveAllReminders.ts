import type { Note, Reminder } from '@/types';

export type EnrichedReminder = Reminder & {
  noteId: string;
  noteTitle: string;
  noteContent: string;
};

/**
 * 노트 목록에서 모든 리마인더를 평탄화하고 소속 노트 정보를 붙입니다.
 * 동일 id의 리마인더가 여러 노트에 걸쳐 나타나면 처음 만난 것만 유지합니다.
 */
export function deriveAllReminders(notes: Note[]): EnrichedReminder[] {
  if (!notes || !Array.isArray(notes)) return [];

  const remindersMap = new Map<string, EnrichedReminder>();
  notes.forEach((note) => {
    (note.reminders || []).forEach((reminder) => {
      if (!remindersMap.has(reminder.id)) {
        remindersMap.set(reminder.id, {
          ...reminder,
          noteId: note.id,
          noteTitle: note.title || '제목 없음',
          noteContent: note.content_preview?.substring(0, 100) || '',
        });
      }
    });
  });

  return Array.from(remindersMap.values());
}
