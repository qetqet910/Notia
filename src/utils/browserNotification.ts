import { sendNotification } from '@/utils/notification';

export const sendReminderNotification = (title: string, body: string) => {
  sendNotification(title, body);
};
