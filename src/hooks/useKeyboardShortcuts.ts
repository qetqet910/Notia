import { useCallback, useEffect } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import type { Theme } from '@/stores/themeStore';

export interface UseKeyboardShortcutsOptions {
  isDeleteDialogOpen: boolean;
  setIsDeleteDialogOpen: (open: boolean) => void;
  isEditing: boolean;
  hasUnsavedChanges: boolean;
  editorRef: React.RefObject<{ save: () => void } | null>;
  handleCancelEdit: () => void;
  handleCreateNote: () => void;
  navigate: NavigateFunction;
  setTheme: (theme: Theme) => void;
  isDarkMode: boolean;
  isDeepDarkMode: boolean;
  activeTabs: string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  setIsSidebarVisible: (updater: (prev: boolean) => boolean) => void;
  selectedNoteId: string | null;
}

/**
 * 대시보드 전역 키보드 단축키를 문서 레벨 keydown 리스너로 등록합니다.
 * Index.tsx에서 상태/핸들러를 그대로 넘겨받아 부수효과만 캡슐화합니다.
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions) {
  const {
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isEditing,
    hasUnsavedChanges,
    editorRef,
    handleCancelEdit,
    handleCreateNote,
    navigate,
    setTheme,
    isDarkMode,
    isDeepDarkMode,
    activeTabs,
    activeTab,
    setActiveTab,
    setIsSidebarVisible,
    selectedNoteId,
  } = options;

  const handleKeyboardShortcuts = useCallback(
    (e: KeyboardEvent) => {
      const isCtrlCmd = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      const target = e.target as HTMLElement;

      if (isDeleteDialogOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setIsDeleteDialogOpen(false);
        }
        return;
      }

      // When in editing mode
      if (isEditing) {
        if (isCtrlCmd && key === 's') {
          e.preventDefault();
          if (hasUnsavedChanges && editorRef.current) {
            editorRef.current.save();
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          handleCancelEdit();
        }
        // Allow other keys to function normally for typing
        return;
      }

      // When not in editing mode
      const isInputElement =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isInputElement && e.key !== 'Tab') {
        return;
      }

      const shortcuts: { [key: string]: () => void } = {
        n: handleCreateNote,
        '/': () => navigate('/dashboard/help?tab=overview'),
        '?': () => navigate('/dashboard/help?tab=overview'),
        t: () => setTheme(isDarkMode || isDeepDarkMode ? 'light' : 'dark'),
        Tab: () => {
          const currentTabIndex = activeTabs.indexOf(activeTab);
          const nextIndex = (currentTabIndex + 1) % activeTabs.length;
          setActiveTab(activeTabs[nextIndex]);
        },
        b: () => setIsSidebarVisible((prev) => !prev),
        d: () => selectedNoteId && setIsDeleteDialogOpen(true),
        delete: () => selectedNoteId && setIsDeleteDialogOpen(true),
        m: () => navigate('/dashboard/myPage?tab=profile'),
        ',': () => navigate('/dashboard/myPage?tab=activity'),
        '.': () => navigate('/dashboard/myPage?tab=settings'),
      };

      const handler = shortcuts[e.key === 'Tab' ? 'Tab' : key];
      if (handler) {
        e.preventDefault();
        handler();
      }
    },
    [
      isEditing,
      hasUnsavedChanges,
      editorRef,
      handleCancelEdit,
      handleCreateNote,
      navigate,
      setTheme,
      isDarkMode,
      isDeepDarkMode,
      activeTabs,
      activeTab,
      setActiveTab,
      setIsSidebarVisible,
      selectedNoteId,
      isDeleteDialogOpen,
      setIsDeleteDialogOpen,
    ],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () => document.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [handleKeyboardShortcuts]);
}
