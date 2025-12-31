import { isTauri } from '@/utils/isTauri';
import { isPermissionGranted, requestPermission as requestTauriPermission, sendNotification as sendTauriNotification } from '@tauri-apps/plugin-notification';

export const requestPermission = async (): Promise<NotificationPermission> => {
  if (isTauri()) {
    const permission = await requestTauriPermission();
    return permission === 'granted' ? 'granted' : 'denied';
  } else {
    if (!('Notification' in window)) return 'denied';
    return await Notification.requestPermission();
  }
};

export const checkPermission = async (): Promise<NotificationPermission> => {
  if (isTauri()) {
    const granted = await isPermissionGranted();
    return granted ? 'granted' : 'denied';
  } else {
    if (!('Notification' in window)) return 'denied';
    return Notification.permission;
  }
};

export const sendNotification = async (title: string, body?: string, url?: string, tag?: string) => {
  if (await checkPermission() !== 'granted') {
    // Try requesting permission
    const permission = await requestPermission();
    if (permission !== 'granted') return;
  }

  if (isTauri()) {
    sendTauriNotification({ title, body });
  } else {
    const notification = new Notification(title, { body, icon: '/favicon/favicon.ico', tag });
    notification.onclick = (event) => {
      event.preventDefault(); // prevent the browser from focusing the Notification's tab
      window.focus();
      if (url) {
        window.location.href = url;
      }
      notification.close();
    };
  }
};
