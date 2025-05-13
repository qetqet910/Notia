import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabaseClient';
import { useAuthStore } from '@/stores/authStore';

export const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // 중복 콘솔 로그 제거
        console.log('Auth callback 처리 중...');

        // 세션 한 번에 가져오기
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
          console.error('인증 오류:', error?.message || '세션 없음');
          navigate('/login');
          return;
        }

        const user = data.session.user;

        // 프로필 가져오기와 생성을 하나의 트랜잭션으로
        const handleUserProfile = async () => {
          try {
            // 프로필 조회 + 없으면 생성 (단일 쿼리로)
            const { data: profile, error: profileError } = await supabase.rpc(
              'get_or_create_user_profile',
              {
                p_user_id: user.id,
                p_display_name:
                  user.user_metadata?.full_name ||
                  user.user_metadata?.name ||
                  user.email?.split('@')[0] ||
                  '사용자',
              },
            );

            if (profileError) {
              console.error('프로필 처리 오류:', profileError);
              return null;
            }

            return profile;
          } catch (err) {
            console.error('프로필 처리 오류:', err);
            return null;
          }
        };

        // 비동기 작업을 한 번에 처리
        const userProfile = await handleUserProfile();

        // 상태 한 번에 업데이트
        useAuthStore.setState({
          user: user,
          session: data.session,
          isAuthenticated: true,
          userProfile: userProfile,
          isLoginLoading: false,
          isRegisterLoading: false
        });

        // 리다이렉트 대상 결정 (저장된 경로 또는 대시보드)
        const redirectTo =
          localStorage.getItem('auth_redirect') || '/dashboard';
        localStorage.removeItem('auth_redirect'); // 사용 후 제거

        // navigate 사용 (window.location 대신)
        navigate(redirectTo, { replace: true });
      } catch (err) {
        console.error('Auth callback 처리 오류:', err);
        useAuthStore.setState({ isLoginLoading: false, isRegisterLoading: false });
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  // 단순한 로딩 표시로 변경
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold">인증 처리 중...</h2>
        <div className="mt-4 animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#61C9A8] mx-auto"></div>
      </div>
    </div>
  );
};
