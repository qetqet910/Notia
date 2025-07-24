import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  checkTerms?: boolean;
}

export const ProtectedRoute = ({
  children,
  redirectTo = '/login',
  checkTerms = true,
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-medium">사용자 정보 확인 중...</h2>
          <div className="mt-4 animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  // 2순위: 인증되지 않았을 때
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // 3순위: 프로필 정보가 없을 때 (로딩은 끝났지만 데이터가 null)
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

  // 4순위: 약관 동의 여부 확인 (checkTerms 플래그가 true일 때만)
  if (checkTerms && !userProfile.terms_agreed) {
    return <Navigate to="/terms-agreement" state={{ from: location }} replace />;
  }

  // 모든 검사 통과
  return <>{children}</>;
};