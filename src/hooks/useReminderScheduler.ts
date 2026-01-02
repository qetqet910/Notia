import { useEffect, useRef } from 'react';
import { useDataStore } from '@/stores/dataStore';
import { sendNotification } from '@/utils/notification';
import { parseISO, differenceInSeconds } from 'date-fns';

export const useReminderScheduler = () => {
  // We don't subscribe to notes here to avoid resetting the interval on every change
  // Instead, we access the latest state directly inside the interval
  
  // We use a ref to track which reminders we've already notified for in the current session
  // to prevent double firing if the interval runs multiple times within the same minute.
  const notifiedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const checkReminders = async () => {
      const notes = useDataStore.getState().notes; // Access latest state directly
      const now = new Date();
      
      Object.values(notes).forEach((note) => {
        if (!note.reminders) return;

        note.reminders.forEach((reminder) => {
          if (reminder.completed) return;
          if (!reminder.reminder_time) return;

          // Parse the time. Assuming ISO string.
          const reminderTime = parseISO(reminder.reminder_time);
          
          // Check if the reminder is due (past or now) AND within the last 60 seconds (to avoid old spam)
          const diffSeconds = differenceInSeconds(now, reminderTime);

          if (diffSeconds >= 0 && diffSeconds < 60) {
             console.log('[Scheduler] Match found:', reminder.reminder_text, 'ID:', reminder.id, 'Diff:', diffSeconds);
             if (!notifiedIds.current.has(reminder.id)) {
                console.log('[Scheduler] Sending notification for:', reminder.reminder_text);
                
                // 1. Always send system notification (User allowed simultaneous notifications)
                // This ensures the notification is in the notification center even if the user is looking at the app but misses the toast
                sendNotification(
                  `리마인더: ${note.title}`,
                  reminder.reminder_text,
                  `/dashboard?noteId=${note.id}`,
                  reminder.id
                );

                // Toast notification removed per user request for consistency
                
                notifiedIds.current.add(reminder.id);
             } else {
               // Log suppressed
             }
          }
        });
      });
    };

    // Check every 2 seconds for higher precision
    const intervalId = setInterval(checkReminders, 2000);
    
    // Initial check
    checkReminders();

    return () => clearInterval(intervalId);
  }, []); // Empty dependency array ensures interval is stable
};
