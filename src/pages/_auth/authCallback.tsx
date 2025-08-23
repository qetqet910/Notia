import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabaseClient';
import { useAuthStore } from '@/stores/authStore';

export const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
          console.error('인증 오류:', error?.message || '세션 없음');
          navigate('/login');
          return;
        }

        const user = data.session.user;

        useAuthStore.setState({
          user: user,
          session: data.session,
          isAuthenticated: true,
          isLoginLoading: false,
          isRegisterLoading: false,
        });

        const redirectTo =
          localStorage.getItem('auth_redirect') || '/dashboard';
        localStorage.removeItem('auth_redirect'); 

        navigate(redirectTo, { replace: true });
      } catch (err) {
        console.error('Auth callback 처리 오류:', err);
        useAuthStore.setState({
          isLoginLoading: false,
          isRegisterLoading: false,
        });
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold">인증 처리 중...</h2>
        <div className="mt-4 animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#61C9A8] mx-auto"></div>
      </div>
    </div>
  );
};