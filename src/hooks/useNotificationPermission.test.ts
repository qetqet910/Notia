import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useNotificationPermission } from './useNotificationPermission';
import { supabase } from '@/services/supabaseClient';
import * as notificationUtils from '@/utils/notification';

// Mock dependencies
vi.mock('@/services/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: 'test-user-id' } } },
      }),
    },
    from: vi.fn(() => ({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

vi.mock('@/utils/notification', () => ({
  checkPermission: vi.fn(),
  requestPermission: vi.fn(),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({
    session: { user: { id: 'test-user-id' } },
  }),
}));

// Mock Service Worker
const mockSubscribe = vi.fn();
const mockGetSubscription = vi.fn();

Object.defineProperty(global, 'navigator', {
  value: {
    serviceWorker: {
      ready: Promise.resolve({
        pushManager: {
          subscribe: mockSubscribe,
          getSubscription: mockGetSubscription,
        },
      }),
    },
  },
  writable: true,
});

// Mock Window atob for VAPID key conversion
global.window.atob = (str) => Buffer.from(str, 'base64').toString('binary');

describe('useNotificationPermission (Self-healing Logic)', () => {
  const mockCheckPermission = vi.spyOn(notificationUtils, 'checkPermission');

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: Permission granted
    mockCheckPermission.mockResolvedValue('granted');
    // Default: VAPID Key exists
    import.meta.env.VITE_VAPID_PUBLIC_KEY = 'test-vapid-key';
  });

  it('should automatically resubscribe if permission is already granted on mount', async () => {
    // Setup: User has no existing subscription in browser, but permission is granted
    mockGetSubscription.mockResolvedValue(null);
    mockSubscribe.mockResolvedValue({
      toJSON: () => ({ endpoint: 'test-endpoint' }),
      endpoint: 'test-endpoint',
    });

    const { result } = renderHook(() => useNotificationPermission());

    await waitFor(() => {
      expect(result.current.permission).toBe('granted');
    });

    // It should have called subscribe because permission was 'granted' on mount
    expect(mockSubscribe).toHaveBeenCalled();
    
    // And it should verify Supabase upsert call
    expect(supabase.from).toHaveBeenCalledWith('push_subscriptions');
  });

  it('should NOT automatically subscribe if permission is default or denied', async () => {
    mockCheckPermission.mockResolvedValue('default');
    
    const { result } = renderHook(() => useNotificationPermission());

    await waitFor(() => {
      expect(result.current.permission).toBe('default');
    });

    // Should NOT subscribe automatically
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('should sync existing subscription to DB if one exists in browser', async () => {
    // Scenario: User cleared DB, but Browser Service Worker still has subscription
    const existingSub = {
      toJSON: () => ({ endpoint: 'existing-endpoint' }),
      endpoint: 'existing-endpoint',
    };
    mockGetSubscription.mockResolvedValue(existingSub);

    renderHook(() => useNotificationPermission());

    await waitFor(() => {
       // Should retrieve existing subscription and send to DB
       expect(mockGetSubscription).toHaveBeenCalled();
       expect(supabase.from).toHaveBeenCalledWith('push_subscriptions');
    });
    
    // Should NOT create a NEW subscription
    expect(mockSubscribe).not.toHaveBeenCalled();
  });
});
