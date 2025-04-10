import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { useEffect } from 'react';

import { Home } from '@/pages/Home';
import { Login } from '@/pages/Login';
import { DownloadPage } from '@/pages/Download';
import { Dashboard } from '@/pages/Dashboard';
import { AuthCallback } from '@/components/features/AuthCallback';
import { ProtectedRoute } from '@/components/features/ProtectedRoute';
import { NotFound } from '@/pages/404';

import { supabase } from '@/services/supabase';
import { useAuthStore } from '@/stores/authStore';

function App() {
  // App.tsx의 useEffect 수정
  useEffect(() => {
    // 초기 세션 확인
    const checkInitialSession = async () => {
      console.log('앱 시작 - 초기 세션 확인');

      // 로컬스토리지 확인
      console.log('로컬스토리지 모든 키:', Object.keys(localStorage));
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const authKey =
      'sb-' +
      import.meta.env.VITE_SUPABASE_URL.replace('https://', '').replace(
        '.supabase.co',
        '',
      ) +
      '-auth-token';
      const storedSession = localStorage.getItem(authKey);
      console.log(`${authKey} 존재:`, !!storedSession); // 이건 머야 시발

      // 세션 가져오기 시도
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('초기 세션 확인 타임아웃')), 3000),
        );

        const {
          data: { session },
        } = (await Promise.race([sessionPromise, timeoutPromise])) as {
          data: { session: any };
        };

        if (session) {
          console.log('기존 세션 발견:', session.user.id);

          // 세션 만료 정보 확인
          const expiresAt = new Date(session.expires_at * 1000);
          const now = new Date();
          const timeUntilExpiry =
            (expiresAt.getTime() - now.getTime()) / 1000 / 60;

          console.log('세션 만료 정보:', {
            expiresAt: expiresAt.toLocaleString(),
            timeUntilExpiry: `${timeUntilExpiry.toFixed(2)}분 후`,
            isExpired: expiresAt < now,
          });

          // 세션이 있으면 상태 업데이트
          useAuthStore.setState({
            user: session.user,
            session: session,
            isAuthenticated: true,
          });

          // 사용자 프로필 가져오기
          const profile = await useAuthStore
            .getState()
            .fetchUserProfile(session.user.id);
          useAuthStore.setState({ userProfile: profile });
        } else {
          console.log('기존 세션 없음');

          // 로컬스토리지에 세션 데이터가 있으면 복원 시도
          if (storedSession) {
            console.log('로컬스토리지에 세션 데이터 있음, 복원 시도');
            await useAuthStore.getState().restoreSession();
          }
        }
      } catch (error) {
        console.error('초기 세션 확인 오류:', error);

        // 오류 발생 시 세션 복원 시도
        if (storedSession) {
          console.log('오류 발생, 세션 복원 시도');
          await useAuthStore.getState().restoreSession();
        }
      }
    };

    checkInitialSession();

    // 세션 변경 리스너 설정 (기존 코드 유지)
    // ...
  }, []);

  return (
    <Router>
      <Routes>
        {/* 공개 라우트 */}
        <Route path="/" element={<Home />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/login" element={<Login />} />
        <Route path="/download" element={<DownloadPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        {/* 보호된 라우트 */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        {/* 기타 보호될 라우트들
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        /> */}
        {/* 기본 리다이렉트 */}
        <Route path="/" element={<Navigate to="/Home" replace />} />
        <Route path="*" element={<Navigate to="/NotFound" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
