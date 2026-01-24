import { useEffect } from 'react';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { useLocation } from 'react-router-dom';
import { loadFont, normalizeFontFamily } from '@/utils/fontLoader';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: 'dark' | 'light' | 'deepdark' | 'system';
};

export function ThemeProvider({
  children,
  defaultTheme = 'system',
}: ThemeProviderProps) {
  const { 
    isDarkMode, 
    isDeepDarkMode, 
    setTheme, 
    updateThemeFromSystem,
    fontFamily,
    loadFontSettings
  } = useThemeStore();
  
  const { user } = useAuthStore();
  const location = useLocation();

  // 초기화 시 기본 테마 설정
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme-storage');
    if (!savedTheme) {
      setTheme(defaultTheme);
    } else {
      updateThemeFromSystem();
    }
  }, [defaultTheme, setTheme, updateThemeFromSystem]);

  // 유저 로그인 시 폰트 설정 로드
  useEffect(() => {
    if (user) {
      loadFontSettings(user.id);
    }
  }, [user, loadFontSettings]);

  // 폰트 적용 (대시보드 진입 시에만 사용자 설정 폰트 적용)
  useEffect(() => {
    const isThemedPage = location.pathname.startsWith('/dashboard');
    
    if (isThemedPage) {
      // 대시보드: 사용자 설정 폰트 적용
      const appliedFont = normalizeFontFamily(fontFamily);
      loadFont(appliedFont).catch((error) => {
        console.warn(error);
      });
      document.body.style.fontFamily = `"${appliedFont}", sans-serif`;
      
      const formElements = document.querySelectorAll('input, button, textarea, select');
      formElements.forEach((el) => {
        (el as HTMLElement).style.fontFamily = `"${appliedFont}", sans-serif`;
      });
    } else {
      document.body.style.fontFamily = '"GmarketSans", sans-serif';
      
      const formElements = document.querySelectorAll('input, button, textarea, select');
      formElements.forEach((el) => {
        (el as HTMLElement).style.fontFamily = '"GmarketSans", sans-serif';
      });
    }
  }, [fontFamily, location.pathname]);

  // 경로 기반 테마 적용
  useEffect(() => {
    const root = window.document.documentElement;
    const isThemedPage = location.pathname.startsWith('/dashboard');

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
