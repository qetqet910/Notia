import { supabase } from '@/services/supabaseClient';
import { format } from 'date-fns';
import { Reminder } from '@/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * 여러 개의 원본 리마인더에 대해 각각 사전 알림을 생성합니다.
 * @param originalReminders DB에 방금 저장된 원본 리마인더 객체 배열
 * @param noteTitle 노트 제목
 */
export const schedulePreNotifications = async (
  originalReminders: Reminder[],
  noteTitle: string,
) => {
  const notificationsToSchedule: Omit<Reminder, 'id' | 'created_at' | 'updated_at'>[] = [];
  const now = new Date();

  for (const reminder of originalReminders) {
    const reminderTime = new Date(reminder.reminder_time);
    const clientReminderId = reminder.client_reminder_id || uuidv4(); // 기존 ID가 없으면 새로 생성

    // 사전 알림 간격 설정
    const intervals = [
      { minutes: 30, label: '30분 전' },
      { minutes: 15, label: '15분 전' },
      { minutes: 5, label: '5분 전' },
      { minutes: 1, label: '1분 전' },
    ];

    for (const interval of intervals) {
      const beforeTime = new Date(
        reminderTime.getTime() - interval.minutes * 60 * 1000,
      );
      if (beforeTime > now) {
        notificationsToSchedule.push({
          note_id: reminder.note_id,
          owner_id: reminder.owner_id,
          reminder_text: `${interval.label}: ${reminder.reminder_text}`,
          original_text: reminder.original_text, // 원본과 동일한 original_text 유지
          reminder_time: beforeTime.toISOString(),
          completed: false,
          enabled: true,
          client_reminder_id: clientReminderId, // 동일한 그룹 ID 공유
        });
      }
    }
    
    // 원본 리마인더에도 client_reminder_id 업데이트
    await supabase
      .from('reminders')
      .update({ client_reminder_id: clientReminderId })
      .eq('id', reminder.id);
  }

  if (notificationsToSchedule.length === 0) {
    return;
  }

  try {
    const { error } = await supabase
      .from('reminders')
      .insert(notificationsToSchedule);

    if (error) throw error;

    console.log(
      `${notificationsToSchedule.length}개의 사전 알림 생성 성공.`,
    );
  } catch (error) {
    console.error('사전 알림 생성 오류:', error);
  }
};

/**
 * original_text를 기반으로 관련된 모든 리마인더(사전 알림 포함)를 삭제합니다.
 * useNotes의 deleteReminder에서 사용됩니다.
 * @param noteId 노트 ID
 * @param originalText 삭제할 리마인더의 원본 텍스트
 */
export const deleteReminderNotificationsByOriginalText = async (
  noteId: string,
  originalText: string,
) => {
  try {
    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('note_id', noteId)
      .eq('original_text', originalText);

    if (error) throw error;

    console.log(`'${originalText}' 관련 리마인더 모두 삭제 성공`);
    return true;
  } catch (error) {
    console.error('리마인더 그룹 삭제 오류:', error);
    return false;
  }
};