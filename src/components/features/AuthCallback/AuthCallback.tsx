import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getCurrentSession,
  getOrCreateUserProfile,
} from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';

export const AuthCallback = () => {
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Auth callback 처리 중...');
        setProcessing(true);

        // 세션 확인
        const {
          session,
          user,
          error: sessionError,
        } = await getCurrentSession();

        if (sessionError) {
          throw new Error(sessionError.message);
        }

        if (!session || !user) {
          throw new Error('로그인 세션을 찾을 수 없습니다.');
        }

        console.log('사용자 로그인 성공:', user.id);

        // 프로필 처리
        const profile = await getOrCreateUserProfile(user);

        // 상태 업데이트
        useAuthStore.setState({
          user,
          session,
          isAuthenticated: true,
          userProfile: profile || undefined,
        });

        // 세션 정보 로컬스토리지 확인 로깅
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const authKey = `sb-${supabaseUrl
          .replace('https://', '')
          .replace('.supabase.co', '')}-auth-token`;
        console.log(
          `세션 저장 확인 (${authKey}):`,
          !!localStorage.getItem(authKey),
        );

        // 대시보드로 리다이렉트
        console.log('대시보드로 리다이렉트');
        window.location.href = '/dashboard';
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : '인증 처리 중 오류가 발생했습니다.';
        console.error('Auth callback 처리 오류:', err);
        setError(errorMessage);
        setTimeout(() => navigate('/login'), 3000);
      } finally {
        setProcessing(false);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500">인증 오류</h2>
          <p className="mt-2">{error}</p>
          <p className="mt-4">3초 후 로그인 페이지로 이동합니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold">인증 처리 중...</h2>
        <p className="mt-2">잠시만 기다려주세요.</p>
        {processing && (
          <div className="mt-4 animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#61C9A8] mx-auto"></div>
        )}
      </div>
    </div>
  );
};
