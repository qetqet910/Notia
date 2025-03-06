import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import { auth } from '@/services/auth';
import { formatKey, cleanKey } from '@/utils/keys';

type AuthContextType = {
  userKey: string | null;
  formattedKey: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  generateAndStoreKey: (email?: string) => Promise<string>;
  loginWithKey: (key: string) => Promise<void>;
  loginWithEmail: (email: string) => Promise<{ success: boolean; message: string }>;
  loginWithSocial: (provider: 'github' | 'google') => Promise<void>;
  createGroup: (name: string) => Promise<any>;
  joinGroup: (groupKey: string) => Promise<any>;
  logout: () => Promise<void>;
  formatKey: (key: string) => string;
  cleanKey: (formattedKey: string) => string;
};

// Context 생성
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider 컴포넌트
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 기존 useAuth.ts의 상태 변수들
  const [userKey, setUserKey] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // 초기 인증 상태 확인 (기존 useAuth.ts의 useEffect)
  useEffect(() => {
    let isMounted = true; // 컴포넌트 마운트 상태 추적
    
    async function checkAuth() {
      try {
        console.log('인증 상태 확인 시작');
        const { data } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (data.session) {
          console.log('세션 발견:', data.session.user.id);
          setIsAuthenticated(true);
          
          // 세션이 있으면 사용자 키 가져오기
          try {
            const { data: keyData } = await supabase
              .from('user_keys')
              .select('key')
              .eq('user_id', data.session.user.id)
              .eq('is_active', true)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            
            if (!isMounted) return;
            
            if (keyData) {
              console.log('사용자 키 발견:', keyData.key);
              setUserKey(keyData.key);
            }
          } catch (keyError) {
            console.error('키 가져오기 오류:', keyError);
          }
        } else {
          console.log('세션 없음');
          setIsAuthenticated(false);
          setUserKey(null);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('인증 확인 오류:', err);
      } finally {
        if (isMounted) {
          console.log('로딩 상태 업데이트: false');
          setIsLoading(false);
        }
      }
    }
  
    // 인증 상태 확인 실행
    checkAuth();
    
    // 인증 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
            if (!isMounted) return;
            
            console.log('Auth state changed:', event, !!session);
            setIsAuthenticated(!!session);
            
            // 불필요한 리다이렉션 제거
            // 로그인 이벤트에만 리다이렉션 적용
            if (event === 'SIGNED_IN') {
            // 현재 경로가 로그인 또는 콜백 페이지인 경우에만 리다이렉션
            const currentPath = window.location.pathname;
            if (currentPath === '/login' || currentPath === '/auth/callback') {
                navigate('/dashboard');
            }
            }
            // 로그아웃 이벤트에는 리다이렉션 제거 (수동으로 처리)
            
            setIsLoading(false);
        }
    );
  
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  // 기존 useAuth.ts의 함수들을 그대로 가져옵니다
  const generateAndStoreKey = useCallback(async (email?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const key = await auth.generateAndStoreKey(email);
      setUserKey(key);
      setIsAuthenticated(true);
      navigate('/dashboard');
      return key;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '키 생성에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const loginWithKey = useCallback(async (key: string) => {
    if (!key || key.length !== 16) {
      setError('유효하지 않은 키입니다. 16자리 키를 입력해주세요.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await auth.loginWithKey(key);
      setUserKey(result.key);
      setIsAuthenticated(true);
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '로그인에 실패했습니다.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const loginWithEmail = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await auth.loginWithOtp(email);
      // 이메일 전송 성공 메시지
      return { success: true, message: '로그인 링크가 이메일로 전송되었습니다.' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '이메일 전송에 실패했습니다.';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithSocial = useCallback(async (provider: 'github' | 'google') => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`${provider} 로그인 시도`);
      await auth.loginWithSocial(provider);
      // 리디렉션이 발생하므로 여기서는 아무것도 반환하지 않음
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `${provider} 로그인에 실패했습니다.`;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createGroup = useCallback(async (name: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const group = await auth.createGroup(name);
      navigate('/dashboard');
      return group;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '그룹 생성에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const joinGroup = useCallback(async (groupKey: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await auth.joinGroup(groupKey);
      navigate('/dashboard');
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '그룹 참여에 실패했습니다.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    
    try {
      await auth.logout();
      setUserKey(null);
      setIsAuthenticated(false);
      navigate('/login');
    } catch (err) {
      console.error('로그아웃 오류:', err);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // 포맷팅된 키 계산
  const formattedKey = userKey ? formatKey(userKey) : null;

  // Context 값 정의
  const value = {
    userKey,
    formattedKey,
    isAuthenticated,
    isLoading,
    error,
    generateAndStoreKey,
    loginWithKey,
    loginWithEmail,
    loginWithSocial,
    createGroup,
    joinGroup,
    logout,
    formatKey,
    cleanKey
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// useAuth 훅 - 기존 useAuth.ts를 대체
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};