import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useReminderScheduler } from './useReminderScheduler';
import { useDataStore } from '@/stores/dataStore';
import * as notificationUtils from '@/utils/notification';
import { addSeconds, subSeconds } from 'date-fns';

// Mock dependencies
vi.mock('@/stores/dataStore');
vi.mock('@/utils/notification');
vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => ({ isFocused: vi.fn().mockResolvedValue(true) }),
}));
vi.mock('@/utils/isTauri', () => ({
  isTauri: () => false,
}));
vi.mock('@/hooks/useToast', () => ({
  toast: vi.fn(),
}));

describe('useReminderScheduler', () => {
  const mockSendNotification = vi.spyOn(notificationUtils, 'sendNotification');
  const now = new Date();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    mockSendNotification.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should trigger system notification for due reminders', async () => {
    // Setup Mock Data
    const dueReminder = {
      id: 'rem-1',
      reminder_text: 'Test Reminder',
      reminder_time: subSeconds(now, 10).toISOString(), // 10 seconds ago (within 60s window)
      completed: false,
    };
    const note = {
      id: 'note-1',
      title: 'Test Note',
      reminders: [dueReminder],
    };

    // Mock Store State
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useDataStore.getState as any) = vi.fn().mockReturnValue({
      notes: { 'note-1': note },
    });

    // Run Hook
    renderHook(() => useReminderScheduler());

    // Advance Timer (scheduler runs every 2s)
    await vi.advanceTimersByTimeAsync(2500);

    // Expectation: System Notification MUST be called
    expect(mockSendNotification).toHaveBeenCalledWith(
      `리마인더: ${note.title}`,
      dueReminder.reminder_text,
      `/dashboard?noteId=${note.id}`,
      dueReminder.id
    );
  });

  it('should NOT trigger notification for future reminders', async () => {
    const futureReminder = {
      id: 'rem-2',
      reminder_text: 'Future',
      reminder_time: addSeconds(now, 100).toISOString(),
      completed: false,
    };
    const note = { id: 'note-2', title: 'Future Note', reminders: [futureReminder] };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useDataStore.getState as any) = vi.fn().mockReturnValue({
      notes: { 'note-2': note },
    });

    renderHook(() => useReminderScheduler());
    await vi.advanceTimersByTimeAsync(2500);

    expect(mockSendNotification).not.toHaveBeenCalled();
  });

  it('should NOT trigger notification for completed reminders', async () => {
    const completedReminder = {
      id: 'rem-3',
      reminder_text: 'Done',
      reminder_time: subSeconds(now, 10).toISOString(),
      completed: true, // Completed!
    };
    const note = { id: 'note-3', title: 'Done Note', reminders: [completedReminder] };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useDataStore.getState as any) = vi.fn().mockReturnValue({
      notes: { 'note-3': note },
    });

    renderHook(() => useReminderScheduler());
    await vi.advanceTimersByTimeAsync(2500);

    expect(mockSendNotification).not.toHaveBeenCalled();
  });
  
  it('should NOT trigger Toast notification (UX consistency update)', async () => {
    const { toast } = await import('@/hooks/useToast');
    const dueReminder = {
      id: 'rem-4',
      reminder_text: 'Toast Check',
      reminder_time: subSeconds(now, 5).toISOString(),
      completed: false,
    };
    const note = { id: 'note-4', title: 'Toast Note', reminders: [dueReminder] };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useDataStore.getState as any) = vi.fn().mockReturnValue({
      notes: { 'note-4': note },
    });

    renderHook(() => useReminderScheduler());
    await vi.advanceTimersByTimeAsync(2500);

    // Toast should NOT be called even if reminder fired
    expect(toast).not.toHaveBeenCalled();
    // But system notification SHOULD be called
    expect(mockSendNotification).toHaveBeenCalled();
  });
});
