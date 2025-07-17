import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { resetSupabaseClient } from '@/services/supabaseClient';

interface UserProfile {
  user_id: string;
  display_name?: string | null;
  avatar_url?: string | null;
  email?: string | null;
  provider?: string;
}

export const useAuth = () => {
  const store = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  // 모든 인증 상태 및 메서드 가져오기
  const {
    user,
    session,
    isAuthenticated,
    userProfile,
    error,
    isLoginLoading,
    isLogoutLoading,
    isSessionCheckLoading,
    checkSession,
    loginWithKey,
    loginWithSocial,
    signOut,
    generateEmailKey,
    generateAnonymousKey,
    fetchUserProfile,
    restoreSession,
  } = store;

  // 초기 세션 확인
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsInitializing(true);

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const authKey =
          'sb-' +
          supabaseUrl.replace('https://', '').replace('.supabase.co', '') +
          '-auth-token';
        const storedSession = localStorage.getItem(authKey);

        // 세션 확인 시도
        console.log('세션 확인 시도...');
        const sessionCheckPromise = checkSession();

        const timeoutPromise = new Promise<boolean>((resolve) => {
          setTimeout(() => {
            console.log('세션 확인 타임아웃');
            resolve(false);
          }, 10000); // 10초로 타임아웃 시간 늘림
        });

        const hasSession = await Promise.race([
          sessionCheckPromise,
          timeoutPromise,
        ]);

        // 세션 확인 실패 시 복원 시도
        if (!hasSession && storedSession) {
          console.log('세션 확인 실패, 복원 시도');
          await restoreSession();
        }

        // 세션 상태 로그
        console.log('인증 초기화 완료, 인증 상태:', store.isAuthenticated);
      } catch (error) {
        console.error('인증 초기화 오류:', error);

        // 오류 발생 시 로컬스토리지에서 복원 시도
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const authKey = `sb-${supabaseUrl
          .replace('https://', '')
          .replace('.supabase.co', '')}-auth-token`;
        const storedSession = localStorage.getItem(authKey);

        if (storedSession) {
          console.log('오류 발생, 세션 복원 시도');
          await restoreSession();
        }
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, []);

  return {
    // 상태
    user,
    session,
    isAuthenticated,
    userProfile,
    error,
    isLoginLoading,
    isLogoutLoading,
    isSessionCheckLoading,
    isInitializing,

    // 메서드
    checkSession,
    loginWithKey,
    loginWithSocial,
    signOut,
    generateEmailKey,
    generateAnonymousKey,
    fetchUserProfile,
    restoreSession,
    resetSupabaseClient,
  };
};

export default useAuth;
