import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as updaterModule from '../utils/updater';
import * as isTauriModule from '../utils/isTauri';

// Mock Updater Plugin
const mockCheck = vi.fn();
const mockDownloadAndInstall = vi.fn();
const mockRelaunch = vi.fn();

vi.mock('@tauri-apps/plugin-updater', () => ({
  check: (...args: any[]) => mockCheck(...args),
}));

vi.mock('@tauri-apps/plugin-process', () => ({
  relaunch: (...args: any[]) => mockRelaunch(...args),
}));

describe('Updater Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkForUpdates', () => {
    it('should return shouldUpdate: false if not in Tauri', async () => {
      vi.spyOn(isTauriModule, 'isTauri').mockReturnValue(false);
      const result = await updaterModule.checkForUpdates();
      expect(result.shouldUpdate).toBe(false);
      expect(mockCheck).not.toHaveBeenCalled();
    });

    it('should return update info if update is available (Tauri)', async () => {
      vi.spyOn(isTauriModule, 'isTauri').mockReturnValue(true);
      mockCheck.mockResolvedValue({
        version: '1.1.0',
        date: '2025-12-28',
        body: 'New features',
        downloadAndInstall: mockDownloadAndInstall,
      });

      const result = await updaterModule.checkForUpdates();
      expect(result.shouldUpdate).toBe(true);
      expect(result.manifest?.version).toBe('1.1.0');
    });

    it('should return shouldUpdate: false if no update (Tauri)', async () => {
      vi.spyOn(isTauriModule, 'isTauri').mockReturnValue(true);
      mockCheck.mockResolvedValue(null);

      const result = await updaterModule.checkForUpdates();
      expect(result.shouldUpdate).toBe(false);
    });
  });

  describe('installUpdate', () => {
    it('should download and install if update exists', async () => {
      vi.spyOn(isTauriModule, 'isTauri').mockReturnValue(true);
      mockCheck.mockResolvedValue({
        downloadAndInstall: mockDownloadAndInstall,
      });

      await updaterModule.installUpdate();
      expect(mockDownloadAndInstall).toHaveBeenCalled();
      expect(mockRelaunch).toHaveBeenCalled();
    });

    it('should do nothing if no update', async () => {
        vi.spyOn(isTauriModule, 'isTauri').mockReturnValue(true);
        mockCheck.mockResolvedValue(null);
  
        await updaterModule.installUpdate();
        expect(mockDownloadAndInstall).not.toHaveBeenCalled();
        expect(mockRelaunch).not.toHaveBeenCalled();
      });
  });
});
