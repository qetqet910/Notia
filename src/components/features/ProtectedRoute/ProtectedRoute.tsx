// ProtectedRoute.tsx
'use client';

import type React from 'react';

import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, checkSession } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();
  const sessionChecked = useRef(false);

  useEffect(() => {
    const verifyAuth = async () => {
      setIsChecking(true);
      await checkSession();
      const currentAuth = useAuthStore.getState().isAuthenticated;
      if (!currentAuth) {
        navigate('/login', { replace: true });
      }
      setIsChecking(false);
    };
    verifyAuth();
  }, [navigate, checkSession]);

  // 로딩 중이거나 세션 확인 중이면 로딩 표시
  if (isLoading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#61C9A8]"></div>
      </div>
    );
  }

  // 인증되지 않았으면 null 반환 (리다이렉트 처리 중)
  if (!isAuthenticated) {
    return null;
  }

  // 인증된 경우 자식 컴포넌트 렌더링
  return <>{children}</>;
};
