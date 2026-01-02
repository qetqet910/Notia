import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeStore } from '@/stores/themeStore';

interface UsePageShortcutsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tabs: string[];
}

export const usePageShortcuts = ({ activeTab, setActiveTab, tabs }: UsePageShortcutsProps) => {
  const navigate = useNavigate();
  const { isDarkMode, isDeepDarkMode, setTheme } = useThemeStore();

  const handleKeyboardShortcuts = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      const pageShortcuts: { [key: string]: () => void } = {
        t: () => setTheme(isDarkMode || isDeepDarkMode ? 'light' : 'dark'),
        m: () => navigate('/dashboard/myPage?tab=profile'),
        ',': () => navigate('/dashboard/myPage?tab=activity'),
        '.': () => navigate('/dashboard/myPage?tab=settings'),
        '/': () => navigate('/dashboard/help?tab=overview'),
        '?': () => navigate('/dashboard/help?tab=overview'),
        escape: () => navigate('/dashboard'),
      };

      if (key === 'tab') {
        e.preventDefault();
        const currentTabIndex = tabs.indexOf(activeTab);
        if (currentTabIndex !== -1) {
             const nextTab = tabs[(currentTabIndex + 1) % tabs.length];
             setActiveTab(nextTab);
        }
        return;
      }

      const handler = pageShortcuts[key];
      if (handler) {
        e.preventDefault();
        handler();
      }
    },
    [navigate, setTheme, isDarkMode, isDeepDarkMode, setActiveTab, activeTab, tabs],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () => {
      document.removeEventListener('keydown', handleKeyboardShortcuts);
    };
  }, [handleKeyboardShortcuts]);
};
