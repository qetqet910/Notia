import { sendNotification } from './notification';

export const sendReminderNotification = (title: string, body: string) => {
  sendNotification(title, body);
};
