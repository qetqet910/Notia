import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/services/supabaseClient';
import { useAuthStore } from '@/stores/authStore';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const effectRan = useRef(false);

  useEffect(() => {
    if (effectRan.current) return;
    
    const handleAuthCallback = async () => {
      // 즉시 effectRan을 true로 설정하여 중복 실행 방지
      effectRan.current = true;
      
      try {
        const code = searchParams.get('code');
        let sessionData;
        let sessionError;

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          sessionData = data;
          sessionError = error;
        } else {
          // 코드가 없는 경우 기존 세션 확인 (이미 로그인된 상태 등)
          const { data, error } = await supabase.auth.getSession();
          sessionData = data;
          sessionError = error;
        }

        if (sessionError || !sessionData?.session || !sessionData?.user) {
          console.error('인증 오류:', sessionError?.message || '세션/유저 없음');
          navigate('/login');
          return;
        }

        const { user, session } = sessionData;

        // 스토어 상태 우선 업데이트 (세션 확보)
        useAuthStore.setState({
          user,
          session,
          isAuthenticated: true,
        });

        // 프로필 정보 가져오기
        await useAuthStore.getState().fetchUserProfile(user.id);

        // 로딩 상태 해제 및 완료
        useAuthStore.setState({
          isLoginLoading: false,
          isRegisterLoading: false,
          isSessionCheckLoading: false, 
        });

        const redirectTo =
          localStorage.getItem('auth_redirect') || '/dashboard';
        localStorage.removeItem('auth_redirect');

        navigate(redirectTo, { replace: true });
      } catch (err) {
        console.error('Auth callback 처리 오류:', err);
        // 에러 발생 시 상태 초기화
        useAuthStore.setState({
          isLoginLoading: false,
          isRegisterLoading: false,
          isAuthenticated: false,
        });
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
      <div className="text-center">
        <h2 className="text-2xl font-bold">인증 처리 중...</h2>
        <div className="mt-4 animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
      </div>
    </div>
  );
};