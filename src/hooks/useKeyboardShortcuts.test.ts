import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import {
  useKeyboardShortcuts,
  type UseKeyboardShortcutsOptions,
} from './useKeyboardShortcuts';

function makeOptions(
  overrides: Partial<UseKeyboardShortcutsOptions> = {},
): UseKeyboardShortcutsOptions {
  return {
    isDeleteDialogOpen: false,
    setIsDeleteDialogOpen: vi.fn(),
    isEditing: false,
    hasUnsavedChanges: false,
    editorRef: { current: { save: vi.fn() } },
    handleCancelEdit: vi.fn(),
    handleCreateNote: vi.fn(),
    navigate: vi.fn(),
    setTheme: vi.fn(),
    isDarkMode: false,
    isDeepDarkMode: false,
    activeTabs: ['notes', 'reminders'],
    activeTab: 'notes',
    setActiveTab: vi.fn(),
    setIsSidebarVisible: vi.fn(),
    selectedNoteId: null,
    ...overrides,
  };
}

function pressKey(key: string, extra: Partial<KeyboardEventInit> = {}) {
  fireEvent.keyDown(document, { key, ...extra });
}

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('closes the delete dialog on Escape when it is open, and ignores other shortcuts', () => {
    const options = makeOptions({ isDeleteDialogOpen: true });
    renderHook(() => useKeyboardShortcuts(options));

    pressKey('Escape');
    expect(options.setIsDeleteDialogOpen).toHaveBeenCalledWith(false);

    pressKey('n');
    expect(options.handleCreateNote).not.toHaveBeenCalled();
  });

  it('saves on Ctrl/Cmd+S while editing with unsaved changes', () => {
    const save = vi.fn();
    const options = makeOptions({
      isEditing: true,
      hasUnsavedChanges: true,
      editorRef: { current: { save } },
    });
    renderHook(() => useKeyboardShortcuts(options));

    pressKey('s', { ctrlKey: true });
    expect(save).toHaveBeenCalled();
  });

  it('does not save on Ctrl+S while editing when there are no unsaved changes', () => {
    const save = vi.fn();
    const options = makeOptions({
      isEditing: true,
      hasUnsavedChanges: false,
      editorRef: { current: { save } },
    });
    renderHook(() => useKeyboardShortcuts(options));

    pressKey('s', { ctrlKey: true });
    expect(save).not.toHaveBeenCalled();
  });

  it('cancels editing on Escape while editing', () => {
    const options = makeOptions({ isEditing: true });
    renderHook(() => useKeyboardShortcuts(options));

    pressKey('Escape');
    expect(options.handleCancelEdit).toHaveBeenCalled();
  });

  it('ignores plain letter shortcuts while editing (lets typing through)', () => {
    const options = makeOptions({ isEditing: true });
    renderHook(() => useKeyboardShortcuts(options));

    pressKey('n');
    expect(options.handleCreateNote).not.toHaveBeenCalled();
  });

  it('triggers handleCreateNote for "n" when not editing and not focused on an input', () => {
    const options = makeOptions();
    renderHook(() => useKeyboardShortcuts(options));

    pressKey('n');
    expect(options.handleCreateNote).toHaveBeenCalled();
  });

  it('ignores shortcuts when focus is inside an input element (except Tab)', () => {
    const options = makeOptions();
    renderHook(() => useKeyboardShortcuts(options));

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    fireEvent.keyDown(input, { key: 'n' });
    expect(options.handleCreateNote).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it('cycles to the next tab on Tab key', () => {
    const setActiveTab = vi.fn();
    const options = makeOptions({
      activeTabs: ['notes', 'reminders', 'calendar'],
      activeTab: 'notes',
      setActiveTab,
    });
    renderHook(() => useKeyboardShortcuts(options));

    pressKey('Tab');
    expect(setActiveTab).toHaveBeenCalledWith('reminders');
  });

  it('opens the delete dialog on "d" only when a note is selected', () => {
    const setIsDeleteDialogOpen = vi.fn();
    const options = makeOptions({ selectedNoteId: null, setIsDeleteDialogOpen });
    renderHook(() => useKeyboardShortcuts(options));

    pressKey('d');
    expect(setIsDeleteDialogOpen).not.toHaveBeenCalled();
  });

  it('navigates to help on "/"', () => {
    const navigate = vi.fn();
    const options = makeOptions({ navigate });
    renderHook(() => useKeyboardShortcuts(options));

    pressKey('/');
    expect(navigate).toHaveBeenCalledWith('/dashboard/help?tab=overview');
  });

  it('toggles theme to dark when currently light', () => {
    const setTheme = vi.fn();
    const options = makeOptions({ setTheme, isDarkMode: false, isDeepDarkMode: false });
    renderHook(() => useKeyboardShortcuts(options));

    pressKey('t');
    expect(setTheme).toHaveBeenCalledWith('dark');
  });

  it('removes the keydown listener on unmount', () => {
    const options = makeOptions();
    const { unmount } = renderHook(() => useKeyboardShortcuts(options));
    unmount();

    pressKey('n');
    expect(options.handleCreateNote).not.toHaveBeenCalled();
  });
});
