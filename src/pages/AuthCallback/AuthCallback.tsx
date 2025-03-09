import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabase';

export const AuthCallback = () => {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 현재 URL의 해시 또는 쿼리 파라미터에서 토큰 처리
        const { data, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (data.session) {
          // 세션이 있으면 대시보드로 리디렉션
          console.log('Session found, redirecting to dashboard');
          navigate('/dashboard', { replace: true });
        } else {
          // 세션이 없으면 로그인 페이지로
          console.log('No session found, redirecting to login');
          navigate('/login', { replace: true });
        }
      } catch (err) {
        console.error('인증 콜백 오류:', err);
        setError('인증 처리 중 오류가 발생했습니다.');
        // 3초 후 로그인 페이지로 리디렉션
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      }
    };
  
    // 현재 경로가 /auth/callback인 경우에만 처리
    if (location.pathname === '/auth/callback') {
      handleCallback();
    }
  }, [navigate, location]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-white to-[#e6f7f2]">
      <div className="text-center">
        {error ? (
          <div className="text-red-500 mb-4">{error}</div>
        ) : (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#61C9A8] mx-auto mb-4"></div>
            <h2 className="text-xl font-medium text-gray-700 mb-2">인증 처리 중...</h2>
            <p className="text-gray-500">잠시만 기다려 주세요.</p>
          </>
        )}
      </div>
    </div>
  );
};