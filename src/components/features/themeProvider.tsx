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
    const isThemedPage =
      location.pathname.startsWith('/dashboard') ||
      location.pathname === '/changelog' ||
      location.pathname === '/download' ||
      location.pathname === '/login' ||
      location.pathname === '/terms-agreement';

    // 클래스 변경 함수
    const applyThemeClasses = () => {
      if (isThemedPage) {
        // 테마 경로일 때만 다크모드 클래스 적용
        if (isDarkMode && !isDeepDarkMode) {
          root.classList.add('dark');
          root.classList.remove('deepdark');
          root.style.backgroundColor = '#0f172a';
        } else if (isDeepDarkMode) {
          root.classList.add('deepdark');
          root.classList.remove('dark');
          root.style.backgroundColor = '#050505';
        } else {
          root.classList.remove('dark');
          root.classList.remove('deepdark');
          root.style.backgroundColor = '#ffffff';
        }
      } else {
        // 테마 경로가 아닌 경우 (메인 랜딩 등) 강제로 라이트모드
        root.classList.remove('dark');
        root.classList.remove('deepdark');
        root.style.backgroundColor = '#ffffff';
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
