// src/hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';

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
    isLoading,
    isLoginLoading,
    isLogoutLoading,
    isSessionCheckLoading,
    checkSession,
    loginWithKey,
    loginWithSocial,
    signOut,
    generateAndStoreKey,
    generateAnonymousKey,
    fetchUserProfile,
    restoreSession,
    resetSupabaseClient,
  } = store;

  // 초기 세션 확인
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsInitializing(true);
        console.log('앱 시작 - 초기 세션 확인');

        // 로컬스토리지 확인
        console.log('로컬스토리지 모든 키:', Object.keys(localStorage));
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const authKey =
          'sb-' +
          supabaseUrl.replace('https://', '').replace(
            '.supabase.co',
            '',
          ) +
          '-auth-token';
        const storedSession = localStorage.getItem(authKey);
        console.log(`${authKey} 존재:`, !!storedSession);

        // 1. Supabase 클라이언트 재설정 (선택적)
        if (storedSession) {
          await resetSupabaseClient();
        }

        // 2. 세션 확인 시도
        console.log('세션 확인 시도...');
        const sessionCheckPromise = checkSession();
        
        // 타임아웃 설정 (5초)
        const timeoutPromise = new Promise<boolean>(resolve => {
          setTimeout(() => {
            console.log('세션 확인 타임아웃');
            resolve(false);
          }, 5000);
        });
        
        // 둘 중 먼저 완료되는 것으로 처리
        const hasSession = await Promise.race([sessionCheckPromise, timeoutPromise]);

        // 3. 세션 확인 실패 시 복원 시도
        if (!hasSession && storedSession) {
          console.log('세션 확인 실패, 복원 시도');
          await restoreSession();
        }
        
        // 4. 세션 상태 로그
        console.log('인증 초기화 완료, 인증 상태:', store.isAuthenticated);
      } catch (error) {
        console.error('인증 초기화 오류:', error);
        
        // 오류 발생 시 로컬스토리지에서 복원 시도
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const authKey = `sb-${supabaseUrl.replace('https://', '').replace('.supabase.co', '')}-auth-token`;
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
    isLoading,
    isLoginLoading,
    isLogoutLoading,
    isSessionCheckLoading,
    isInitializing,

    // 메서드
    checkSession,
    loginWithKey,
    loginWithSocial,
    signOut,
    generateAndStoreKey,
    generateAnonymousKey,
    fetchUserProfile,
    restoreSession,
    resetSupabaseClient,
  };
};

export default useAuth;