import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light' | 'deepdark' | 'system';

type ThemeState = {
  theme: Theme;
  isDarkMode: boolean;
  isDeepDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  updateThemeFromSystem: () => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      isDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      isDeepDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,

      toggleTheme: () => {
        const currentState = get();
        if (currentState.theme === 'dark') {
          set({ theme: 'light', isDarkMode: false });
        } else if (currentState.theme === 'deepdark') {
          set({ theme: 'deepdark', isDeepDarkMode: true });
        } else {
          set({ theme: 'dark', isDarkMode: true });
        }
      },

      setTheme: (theme: Theme) => {
        const isDark =
          theme === 'system'
            ? window.matchMedia('(prefers-color-scheme: dark)').matches
            : theme === 'dark';
        const isDeepDark = theme === 'dark' ? false : theme === 'deepdark';

        set({ theme, isDarkMode: isDark, isDeepDarkMode: isDeepDark });
      },

      updateThemeFromSystem: () => {
        const currentState = get();
        if (currentState.theme === 'system') {
          const isDark = window.matchMedia(
            '(prefers-color-scheme: dark)',
          ).matches;
          set({ isDarkMode: isDark, isDeepDarkMode: isDark });
        }
      },
    }),
    {
      name: 'theme-storage',
    },
  ),
);

// 시스템 테마 변경 감지
if (typeof window !== 'undefined') {
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => {
      const { theme, updateThemeFromSystem } = useThemeStore.getState();
      if (theme === 'system') {
        updateThemeFromSystem();
      }
    });
}
