import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { isTauri } from './isTauri';

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
    console.log('Not in Tauri environment, skipping update check.');
    return { shouldUpdate: false };
  }

  try {
    const update = await check();
    if (update) {
      console.log(`Update available: ${update.version} ${update.date} ${update.body}`);
      return {
        shouldUpdate: true,
        manifest: {
          version: update.version,
          date: update.date || '',
          body: update.body || '',
        },
      };
    } else {
      console.log('You are on the latest version.');
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
      console.log('Downloading and installing update...');
      await update.downloadAndInstall();
      console.log('Update installed, restarting...');
      await relaunch();
    }
  } catch (error) {
    console.error('Failed to install update:', error);
    throw error;
  }
};
