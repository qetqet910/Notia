import { useEffect } from 'react';
import { useThemeStore } from '@/stores/themeStore';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: 'dark' | 'light' | 'deepdark' | 'system';
};

export function ThemeProvider({
  children,
  defaultTheme = 'system',
}: ThemeProviderProps) {
  const { isDarkMode, isDeepDarkMode, setTheme, updateThemeFromSystem } =
    useThemeStore();

  // 초기화 시 기본 테마 설정
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-storage');
    if (!savedTheme) {
      setTheme(defaultTheme);
    } else {
      // 앱이 처음 로드될 때 시스템 테마 업데이트 수행
      updateThemeFromSystem();
    }
  }, [defaultTheme, setTheme, updateThemeFromSystem]);

  // 다크모드 클래스 토글
  useEffect(() => {
    const root = window.document.documentElement;

    if (isDarkMode) {
      root.classList.add('dark');
      root.classList.remove('deepdark');
    } else if (isDeepDarkMode) {
      root.classList.add('deepdark');
      root.classList.remove('dark');
    } else {
      root.classList.remove('dark');
      root.classList.remove('deepdark');
    }
  }, [isDarkMode, isDeepDarkMode]);

  return <>{children}</>;
}
