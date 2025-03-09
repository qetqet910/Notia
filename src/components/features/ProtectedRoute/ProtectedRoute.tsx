import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthProvider';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute:', { 
    isAuthenticated, 
    isLoading, 
    path: location.pathname 
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#61C9A8]"></div>
        <p className="ml-3 text-[#61C9A8]">로딩 중...</p>
      </div>
    );
  }

  // 인증되지 않은 경우에만 리다이렉션
  if (!isAuthenticated) {
    // 현재 경로를 state로 전달하여 로그인 후 돌아올 수 있도록 함
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};