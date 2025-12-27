import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as notificationUtils from '../utils/notification';
import * as isTauriModule from '../utils/isTauri';

// Mock Tauri plugin
const mockRequestPermission = vi.fn();
const mockIsPermissionGranted = vi.fn();
const mockSendNotification = vi.fn();

vi.mock('@tauri-apps/plugin-notification', () => ({
  requestPermission: (...args: any[]) => mockRequestPermission(...args),
  isPermissionGranted: (...args: any[]) => mockIsPermissionGranted(...args),
  sendNotification: (...args: any[]) => mockSendNotification(...args),
}));

describe('Notification Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('in Tauri environment', () => {
    beforeEach(() => {
      vi.spyOn(isTauriModule, 'isTauri').mockReturnValue(true);
    });

    it('checkPermission should use Tauri plugin', async () => {
      mockIsPermissionGranted.mockResolvedValue(true);
      const permission = await notificationUtils.checkPermission();
      expect(permission).toBe('granted');
      expect(mockIsPermissionGranted).toHaveBeenCalled();
    });

    it('requestPermission should use Tauri plugin', async () => {
      mockRequestPermission.mockResolvedValue('granted');
      const permission = await notificationUtils.requestPermission();
      expect(permission).toBe('granted');
      expect(mockRequestPermission).toHaveBeenCalled();
    });

    it('sendNotification should use Tauri plugin', async () => {
      mockIsPermissionGranted.mockResolvedValue(true);
      await notificationUtils.sendNotification('Test', 'Body');
      expect(mockSendNotification).toHaveBeenCalledWith({ title: 'Test', body: 'Body' });
    });
  });

  describe('in Web environment', () => {
    beforeEach(() => {
      vi.spyOn(isTauriModule, 'isTauri').mockReturnValue(false);
    });

    it('checkPermission should use Notification API', async () => {
      // Mocked in setup.ts
      (global.Notification as any).permission = 'granted';
      const permission = await notificationUtils.checkPermission();
      expect(permission).toBe('granted');
    });

    it('sendNotification should use Notification API', async () => {
      (global.Notification as any).permission = 'granted';
      const notificationSpy = vi.spyOn(global, 'Notification');
      await notificationUtils.sendNotification('Web Test', 'Web Body');
      expect(notificationSpy).toHaveBeenCalledWith('Web Test', expect.objectContaining({ body: 'Web Body' }));
    });
  });
});
