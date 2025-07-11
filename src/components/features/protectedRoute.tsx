import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute = ({
  children,
  redirectTo = '/login',
}: ProtectedRouteProps) => {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  // 초기화 중에는 로딩 상태 표시
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-medium">로딩 중...</h2>
          <div className="mt-4 animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#61C9A8] mx-auto"></div>
        </div>
      </div>
    );
  }

  // 인증되지 않은 경우 리디렉션
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // 인증된 경우 자식 컴포넌트 렌더링
  return <>{children}</>;
};
