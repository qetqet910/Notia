import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabaseClient';
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

        // 세션 가져오기
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth 세션 오류:', error);
          setError(error.message);
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (!data.session) {
          console.error('세션이 없음');
          setError('로그인 세션을 찾을 수 없습니다.');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        const user = data.session.user;
        console.log('사용자 로그인 성공:', user.id);

        // 프로필 생성 시도
        try {
          const { data: existingProfile } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!existingProfile) {
            console.log('프로필 없음, 생성 시도');

            const { error: insertError } = await supabase.from('users').insert({
              user_id: user.id,
              display_name:
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                user.email?.split('@')[0] ||
                '사용자',
              updated_at: new Date().toISOString(),
            });

            if (insertError) {
              console.error('프로필 생성 오류:', insertError);
            } else {
              console.log('프로필 생성 성공');
            }
          } else {
            console.log('기존 프로필 발견');
          }
        } catch (profileErr) {
          console.error('프로필 처리 오류:', profileErr);
          // 프로필 오류가 있어도 계속 진행
        }

        // 상태 업데이트
        useAuthStore.setState({
          user: user,
          session: data.session,
          isAuthenticated: true,
        });

        // 프로필 가져오기
        const profile = await useAuthStore.getState().fetchUserProfile(user.id);
        useAuthStore.setState({ userProfile: profile });

        // 세션 정보 로컬스토리지에 저장 확인
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const authKey = `sb-${supabaseUrl
          .replace('https://', '')
          .replace('.supabase.co', '')}-auth-token`;
        console.log(
          `세션 저장 확인 (${authKey}):`,
          !!localStorage.getItem(authKey),
        );

        // 대시보드로 리다이렉트 (window.location 사용)
        console.log('대시보드로 리다이렉트');
        window.location.href = '/dashboard';
      } catch (err) {
        console.error('Auth callback 처리 오류:', err);
        setError('인증 처리 중 오류가 발생했습니다.');
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
