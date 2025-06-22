// src/utils/supabaseNotifications.ts
import { supabase } from '@/services/supabaseClient';
import { sendReminderNotification } from '@/utils/notification';
import { format } from 'date-fns';

interface ReminderSchedule {
  id?: string; // For existing reminders
  user_id: string;
  note_id: string;
  reminder_id: string;
  title: string;
  body: string;
  scheduled_time: string; // ISO string
  type: 'at_time' | 'before_20m' | 'before_10m';
  sent: boolean;
}

/**
 * 리마인더 알림을 스케줄링합니다.
 * Supabase Functions를 호출하여 알림을 DB에 저장합니다.
 * @param userId 사용자 ID
 * @param noteId 노트 ID
 * @param reminderId 리마인더 ID
 * @param reminderText 리마인더 텍스트 (알림 본문)
 * @param noteTitle 노트 제목 (알림 제목)
 * @param reminderTime 리마인더 설정 시간 (Date 객체)
 */
export const createReminderNotifications = async (
  userId: string,
  noteId: string,
  reminderId: string,
  reminderText: string,
  noteTitle: string,
  reminderTime: Date,
) => {
  const notificationsToSchedule: Omit<ReminderSchedule, 'id' | 'sent'>[] = [];

  // 1. 해야 할 시간 알림
  notificationsToSchedule.push({
    user_id: userId,
    note_id: noteId,
    reminder_id: reminderId,
    title: `🔔 리마인더: ${noteTitle}`,
    body: reminderText,
    scheduled_time: reminderTime.toISOString(),
    type: 'at_time',
  });

  // 2. 20분 전 알림
  const twentyMinBefore = new Date(reminderTime.getTime() - 20 * 60 * 1000);
  if (twentyMinBefore > new Date()) {
    // 20분 전이 현재 시간보다 미래인 경우에만 스케줄
    notificationsToSchedule.push({
      user_id: userId,
      note_id: noteId,
      reminder_id: reminderId,
      title: `⏰ 20분 전 리마인더: ${noteTitle}`,
      body: `곧 '${reminderText}' 할 시간이에요! (${format(reminderTime, 'p')})`,
      scheduled_time: twentyMinBefore.toISOString(),
      type: 'before_20m',
    });
  }

  // 3. 10분 전 알림
  const tenMinBefore = new Date(reminderTime.getTime() - 10 * 60 * 1000);
  if (tenMinBefore > new Date()) {
    // 10분 전이 현재 시간보다 미래인 경우에만 스케줄
    notificationsToSchedule.push({
      user_id: userId,
      note_id: noteId,
      reminder_id: reminderId,
      title: `⏰ 10분 전 리마인더: ${noteTitle}`,
      body: `곧 '${reminderText}' 할 시간이에요! (${format(reminderTime, 'p')})`,
      scheduled_time: tenMinBefore.toISOString(),
      type: 'before_10m',
    });
  }

  try {
    const { error } = await supabase.from('scheduled_notifications').insert(notificationsToSchedule);

    if (error) {
      throw error;
    }
    console.log('리마인더 알림 스케줄링 성공:', notificationsToSchedule);
    return true;
  } catch (error) {
    console.error('리마인더 알림 스케줄링 오류:', error);
    return false;
  }
};

/**
 * 특정 리마인더와 관련된 모든 알림을 취소(삭제)합니다.
 * @param reminderId 취소할 리마인더의 ID
 */
export const cancelReminderNotifications = async (reminderId: string) => {
  try {
    const { error } = await supabase
      .from('scheduled_notifications')
      .delete()
      .eq('reminder_id', reminderId);

    if (error) {
      throw error;
    }
    console.log(`리마인더 ID ${reminderId}에 대한 모든 알림 취소 성공`);
    return true;
  } catch (error) {
    console.error(`리마인더 ID ${reminderId} 알림 취소 오류:`, error);
    return false;
  }
};

/**
 * 특정 리마인더와 관련된 알림을 삭제합니다. (cancelReminderNotifications와 동일한 기능이지만 명시적으로 분리)
 * @param reminderId 삭제할 리마인더의 ID
 */
export const deleteReminderNotifications = async (reminderId: string) => {
  return cancelReminderNotifications(reminderId);
};

/**
 * 사용자 ID와 리마인더 ID를 기반으로 해당 알림을 "전송됨"으로 표시합니다.
 * (서비스 워커에서 사용될 예정)
 * @param notificationId 알림 ID (scheduled_notifications 테이블의 id)
 */
export const markNotificationAsSent = async (notificationId: string) => {
  try {
    const { error } = await supabase
      .from('scheduled_notifications')
      .update({ sent: true })
      .eq('id', notificationId);

    if (error) {
      throw error;
    }
    console.log(`알림 ID ${notificationId} 전송됨으로 표시 성공`);
    return true;
  } catch (error) {
    console.error(`알림 ID ${notificationId} 전송됨으로 표시 오류:`, error);
    return false;
  }
};

// 서비스 워커에서 호출될 함수 (supabaseNotifications.ts에 그대로 유지)
export const checkAndSendNotifications = async () => {
  try {
    // 현재 시간보다 과거이고, 아직 전송되지 않은 알림을 가져옴
    const { data: notifications, error } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('sent', false)
      .lte('scheduled_time', new Date().toISOString()); // 현재 시간보다 작거나 같은 알림

    if (error) {
      throw error;
    }

    if (!notifications || notifications.length === 0) {
      // console.log('전송할 알림 없음');
      return;
    }

    console.log('발송할 알림:', notifications);

    for (const notification of notifications) {
      sendReminderNotification(notification.title, notification.body);

      // 알림 상태 업데이트 (sent = true)
      await markNotificationAsSent(notification.id);
    }
  } catch (error) {
    console.error('알림 체크 및 발송 오류:', error);
  }
};

// setInterval은 서비스 워커 내부에서만 유효
// 이 파일은 웹 앱에서도 임포트될 수 있으므로, setInterval 호출은 서비스 워커 파일 내부에만 두는 것이 좋습니다.