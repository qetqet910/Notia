import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light' | 'deepdark' | 'system';

type ThemeState = {
  theme: Theme;
  isDarkMode: boolean;
  isDeepDarkMode: boolean;
  isDashboardActive: boolean; // 대시보드 활성화 상태 추가
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  updateThemeFromSystem: () => void;
  setDashboardActive: (active: boolean) => void; // 대시보드 활성화 설정 함수
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      isDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      isDeepDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      isDashboardActive: false, // 초기값은 false

      toggleTheme: () => {
        const currentState = get();
        if (currentState.theme === 'dark') {
          set({ theme: 'light', isDarkMode: false, isDeepDarkMode: false });
        } else if (currentState.theme === 'light') {
          set({ theme: 'dark', isDarkMode: true, isDeepDarkMode: false });
        } else {
          set({ theme: 'deepdark', isDarkMode: true, isDeepDarkMode: true });
        }
      },

      setTheme: (theme: Theme) => {
        const isDark =
          theme === 'system'
            ? window.matchMedia('(prefers-color-scheme: dark)').matches
            : theme === 'dark' || theme === 'deepdark';
        const isDeepDark = theme === 'deepdark';

        set({ theme, isDarkMode: isDark, isDeepDarkMode: isDeepDark });
      },

      updateThemeFromSystem: () => {
        const currentState = get();
        if (currentState.theme === 'system') {
          const isDark = window.matchMedia(
            '(prefers-color-scheme: dark)',
          ).matches;
          set({ isDarkMode: isDark, isDeepDarkMode: false });
        }
      },

      setDashboardActive: (active: boolean) => {
        set({ isDashboardActive: active });
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