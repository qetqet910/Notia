import { useEffect } from 'react';
import { useThemeStore } from '@/stores/themeStore';
import { useLocation } from 'react-router-dom';

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

  const location = useLocation();

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

  // 경로 기반 테마 적용
  useEffect(() => {
    const root = window.document.documentElement;
    const isDashboard =
      location.pathname === '/dashboard' ||
      location.pathname === '/dashboard/myPage';

    // 클래스 변경 함수
    const applyThemeClasses = () => {
      if (isDashboard) {
        // 대시보드 경로일 때만 다크모드 클래스 적용
        if (isDarkMode && !isDeepDarkMode) {
          root.classList.add('dark');
          root.classList.remove('deepdark');
        } else if (isDeepDarkMode) {
          root.classList.add('deepdark');
          root.classList.remove('dark');
        } else {
          root.classList.remove('dark');
          root.classList.remove('deepdark');
        }
      } else {
        // 대시보드가 아닌 경로에서는 모든 테마 클래스 제거
        root.classList.remove('dark');
        root.classList.remove('deepdark');
      }
    };

    // 테마 적용
    applyThemeClasses();

    // 클린업 함수: 컴포넌트 언마운트 시 모든 테마 클래스 제거
    return () => {
      root.classList.remove('dark');
      root.classList.remove('deepdark');
    };
  }, [isDarkMode, isDeepDarkMode, location.pathname]);

  return <>{children}</>;
}
