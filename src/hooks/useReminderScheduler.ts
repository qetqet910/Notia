import { useEffect, useRef } from 'react';
import { useDataStore } from '@/stores/dataStore';
import { sendNotification } from '@/utils/notification';
import { parseISO, differenceInSeconds } from 'date-fns';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { isTauri } from '@/utils/isTauri';
import { toast } from '@/hooks/useToast';

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
      let isFocused = true;

      if (isTauri()) {
        try {
          isFocused = await getCurrentWindow().isFocused();
        } catch (e) {
          console.error('Failed to check window focus:', e);
        }
      } else {
        isFocused = document.hasFocus();
      }
      
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
                if (isFocused) {
                  // App is focused: Show beautiful in-app toast
                  toast({
                    title: `⏰ 리마인더: ${note.title}`,
                    description: reminder.reminder_text,
                    duration: 5000,
                  });
                } else {
                  // App is hidden: Show system notification
                  sendNotification(`리마인더: ${note.title}`, reminder.reminder_text);
                }
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
