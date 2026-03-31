import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { isTauri } from '@/utils/isTauri';

export interface UpdateStatus {
  shouldUpdate: boolean;
  manifest?: {
    version: string;
    date: string;
    body: string;
  };
}

export const checkForUpdates = async (): Promise<UpdateStatus> => {
  if (!isTauri()) {
    return { shouldUpdate: false };
  }

  try {
    const update = await check();
    if (update) {
      return {
        shouldUpdate: true,
        manifest: {
          version: update.version,
          date: update.date || '',
          body: update.body || '',
        },
      };
    } else {
      return { shouldUpdate: false };
    }
  } catch (error) {
    console.error('Failed to check for updates:', error);
    throw error;
  }
};

export const installUpdate = async () => {
  if (!isTauri()) return;

  try {
    const update = await check();
    if (update) {
      await update.downloadAndInstall();
      await relaunch();
    }
  } catch (error) {
    console.error('Failed to install update:', error);
    throw error;
  }
};
