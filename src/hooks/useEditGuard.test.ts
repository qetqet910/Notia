import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// useBlocker는 react-router의 데이터 라우터 컨텍스트가 있어야 동작하므로,
// 단위 테스트에서는 상태를 직접 제어할 수 있도록 목으로 대체한다.
let mockBlockerState: 'unblocked' | 'blocked' = 'unblocked';
const mockProceed = vi.fn();
const mockReset = vi.fn();

vi.mock('react-router-dom', () => ({
  useBlocker: () => ({
    state: mockBlockerState,
    proceed: mockProceed,
    reset: mockReset,
  }),
}));

import { useEditGuard } from './useEditGuard';

describe('useEditGuard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockBlockerState = 'unblocked';
    mockProceed.mockClear();
    mockReset.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts in a non-editing state with no unsaved changes', () => {
    const { result } = renderHook(() => useEditGuard());
    expect(result.current.isEditing).toBe(false);
    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(result.current.isCancelDialogOpen).toBe(false);
  });

  it('handleEnterEditMode flips isEditing to true asynchronously', () => {
    const { result } = renderHook(() => useEditGuard());

    act(() => {
      result.current.handleEnterEditMode();
    });
    expect(result.current.isEditing).toBe(false);

    act(() => {
      vi.runAllTimers();
    });
    expect(result.current.isEditing).toBe(true);
  });

  it('handleCancelEdit resets isEditing and hasUnsavedChanges', () => {
    const { result } = renderHook(() => useEditGuard());

    act(() => result.current.setIsEditing(true));
    act(() => result.current.setHasUnsavedChanges(true));

    act(() => result.current.handleCancelEdit());

    expect(result.current.isEditing).toBe(false);
    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it('auto-proceeds a blocked navigation when there are no unsaved changes', () => {
    const { result, rerender } = renderHook(() => useEditGuard());

    act(() => result.current.setIsEditing(true));
    mockBlockerState = 'blocked';
    rerender();

    expect(mockProceed).toHaveBeenCalled();
    expect(result.current.isCancelDialogOpen).toBe(false);
  });

  it('opens the cancel dialog for a blocked navigation when there are unsaved changes', () => {
    const { result, rerender } = renderHook(() => useEditGuard());

    act(() => result.current.setIsEditing(true));
    act(() => result.current.setHasUnsavedChanges(true));
    mockBlockerState = 'blocked';
    rerender();

    expect(mockProceed).not.toHaveBeenCalled();
    expect(result.current.isCancelDialogOpen).toBe(true);
  });

  it('confirmLeaveEdit cancels editing and proceeds with navigation', () => {
    const { result, rerender } = renderHook(() => useEditGuard());

    act(() => result.current.setIsEditing(true));
    act(() => result.current.setHasUnsavedChanges(true));
    mockBlockerState = 'blocked';
    rerender();

    act(() => result.current.confirmLeaveEdit());

    expect(result.current.isEditing).toBe(false);
    expect(result.current.hasUnsavedChanges).toBe(false);
    expect(mockProceed).toHaveBeenCalled();
  });

  it('cancelLeaveEdit resets the pending navigation without leaving edit mode', () => {
    const { result, rerender } = renderHook(() => useEditGuard());

    act(() => result.current.setIsEditing(true));
    act(() => result.current.setHasUnsavedChanges(true));
    mockBlockerState = 'blocked';
    rerender();

    act(() => result.current.cancelLeaveEdit());

    expect(mockReset).toHaveBeenCalled();
    expect(result.current.isEditing).toBe(true);
  });
});
