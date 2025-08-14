import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { DashboardPageLoader } from '@/components/loader/dashboard/DashboardPageLoader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute = ({
  children,
  redirectTo = '/login',
}: ProtectedRouteProps) => {
  const {
    isAuthenticated,
    isSessionCheckLoading,
    userProfile,
    isProfileLoading,
    signOut,
  } = useAuthStore();
  const location = useLocation();

  // 1순위: 세션 또는 프로필 로딩 중일 때
  if (isSessionCheckLoading || isProfileLoading) {
    return <DashboardPageLoader />;
  }

  // 2순위: 인증되지 않았을 때
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // 3순위: 프로필 정보가 없을 때 (로딩은 끝났지만 데이터가 null)
  // 이 경우는 비정상적인 상태이므로, 에러 메시지를 보여주고 로그아웃 시킵니다.
  if (!userProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-medium text-destructive">오류</h2>
          <p className="mt-2 text-muted-foreground">
            사용자 프로필을 불러오지 못했습니다.
          </p>
          <Button onClick={() => signOut()} className="mt-4">
            로그인 페이지로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  // 4순위: 약관 동의 여부 확인
  // 현재 페이지가 약관 동의 페이지인 경우는 이 검사를 건너뜁니다. (무한 리디렉션 방지)
  if (location.pathname !== '/terms-agreement' && !userProfile.terms_agreed) {
    return <Navigate to="/terms-agreement" state={{ from: location }} replace />;
  }

  // 모든 검사 통과
  return <>{children}</>;
};