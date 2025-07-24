import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { resetSupabaseClient } from '@/services/supabaseClient';

export const useAuth = () => {
  const store = useAuthStore();

  // authStore의 상태가 변경될 때마다 이 훅을 사용하는 컴포넌트가 리렌더링됩니다.
  const {
    user,
    session,
    isAuthenticated,
    userProfile,
    error,
    isLoginLoading,
    isLogoutLoading,
    isSessionCheckLoading,
    isProfileLoading,
    checkSession,
    loginWithKey,
    loginWithSocial,
    signOut,
    fetchUserProfile,
    restoreSession,
  } = store;

  // 앱이 처음 로드될 때 세션 복원을 시도합니다.
  // 이 로직은 authStore의 onRehydrateStorage에서도 처리되지만,
  // 앱의 진입점에서 명시적으로 호출하여 초기화 흐름을 보장합니다.
  useEffect(() => {
    // isSessionCheckLoading이 true일 때만 실행하여 중복 호출을 방지합니다.
    if (isSessionCheckLoading) {
      restoreSession();
    }
  }, [isSessionCheckLoading, restoreSession]);

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
    isProfileLoading,
    isInitializing: isSessionCheckLoading || isProfileLoading, // 초기화 상태를 통합

    // 메서드
    checkSession,
    loginWithKey,
    loginWithSocial,
signOut,
    fetchUserProfile,
    restoreSession,
    resetSupabaseClient,
  };
};

export default useAuth;