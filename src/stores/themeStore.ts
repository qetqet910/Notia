import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/services/supabaseClient';

type Theme = 'dark' | 'light' | 'deepdark' | 'system';

type ThemeState = {
  theme: Theme;
  fontFamily: string;
  notificationOffsets: number[]; // 알림 오프셋 상태 추가
  isDarkMode: boolean;
  isDeepDarkMode: boolean;
  isDashboardActive: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setFontFamily: (font: string) => Promise<void>;
  setNotificationOffsets: (offsets: number[]) => Promise<void>; // 오프셋 설정 함수
  loadFontSettings: (userId: string) => Promise<void>;
  updateThemeFromSystem: () => void;
  setDashboardActive: (active: boolean) => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      fontFamily: 'Noto Sans KR',
      notificationOffsets: [1, 5, 10, 15, 30], // 기본값
      isDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      isDeepDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      isDashboardActive: false,

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

      setTheme: async (theme: Theme) => {
        const isDark =
          theme === 'system'
            ? window.matchMedia('(prefers-color-scheme: dark)').matches
            : theme === 'dark' || theme === 'deepdark';
        const isDeepDark = theme === 'deepdark';

        set({ theme, isDarkMode: isDark, isDeepDarkMode: isDeepDark });

        // DB 업데이트
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('profiles')
            .upsert({ id: user.id, theme: theme });
        }
      },

      setFontFamily: async (font: string) => {
        set({ fontFamily: font });
        // DB 업데이트
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('profiles')
            .upsert({ id: user.id, font_family: font });
        }
      },

      setNotificationOffsets: async (offsets: number[]) => {
        set({ notificationOffsets: offsets });
        // DB 업데이트
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('profiles')
            .upsert({ id: user.id, notification_offsets: offsets });
        }
      },

      loadFontSettings: async (userId: string) => {
        const { data, error } = await supabase
          .from('profiles')
          .select('font_family, theme, notification_offsets')
          .eq('id', userId)
          .single();
        
        if (data && !error) {
           const newTheme = (data.theme as Theme) || 'system';
           const isDark =
             newTheme === 'system'
               ? window.matchMedia('(prefers-color-scheme: dark)').matches
               : newTheme === 'dark' || newTheme === 'deepdark';
           const isDeepDark = newTheme === 'deepdark';

           set({ 
             fontFamily: data.font_family || 'Noto Sans KR',
             theme: newTheme,
             notificationOffsets: data.notification_offsets || [1, 5, 10, 15, 30],
             isDarkMode: isDark,
             isDeepDarkMode: isDeepDark
           });
        }
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