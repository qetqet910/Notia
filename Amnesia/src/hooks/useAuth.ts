import { useState, useEffect, useCallback } from 'react';
import { authService, AuthState, SocialProvider } from '../services/auth';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(authService.getAuthState());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 초기 로드 시 저장된 인증 상태 확인
  useEffect(() => {
    const storedState = authService.getAuthState();
    setAuthState(storedState);
  }, []);

  /**
   * 새로운 키 생성 후 저장
   */
  const generateAndStoreKey = useCallback(() => {
    try {
      const newKey = authService.generateKey();
      authService.storeKey(newKey);
      setAuthState(authService.getAuthState());
      setError(null);
      return newKey;
    } catch (err) {
      setError('키 생성 중 오류가 발생했습니다.');
      return null;
    }
  }, []);

  /**
   * 소셜 로그인 처리 
   */
  const loginWithSocial = useCallback(async (provider: SocialProvider) => {
    setIsLoading(true);
    setError(null);

    try {
      let result;
      if (provider === 'github') {
        result = await authService.loginWithGithub();
      } else {
        result = await authService.loginWithGoogle();
      }

      if (result.success) {
        // 소셜 로그인 성공 시 키가 없으면 자동 생성
        if (!authState.key) {
          generateAndStoreKey();
        }
        setAuthState(authService.getAuthState());
      } else {
        setError(`${provider} 로그인에 실패했습니다.`);
      }
      return result.success;
    } catch (err) {
      setError(`${provider} 로그인 중 오류가 발생했습니다.`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [authState.key, generateAndStoreKey]);

  /**
   * 키와 소셜 계정 연결
   */
  const bindKeyWithSocial = useCallback(async (provider: SocialProvider) => {
    if (!authState.key) {
      setError('연결할 키가 없습니다. 먼저 키를 생성해주세요.');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await authService.bindKeyWithSocial(provider, authState.key);
      if (success) {
        setAuthState(authService.getAuthState());
      } else {
        setError(`키와 ${provider} 계정 연결에 실패했습니다.`);
      }
      return success;
    } catch (err) {
      setError(`계정 연결 중 오류가 발생했습니다.`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [authState.key]);

  /**
   * 이메일로 키 백업
   */
  const backupKeyToEmail = useCallback(async (email: string) => {
    if (!authState.key) {
      setError('백업할 키가 없습니다.');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await authService.backupKeyToEmail(email);
      if (!success) {
        setError('키 백업에 실패했습니다.');
      }
      return success;
    } catch (err) {
      setError('키 백업 중 오류가 발생했습니다.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [authState.key]);

  /**
   * 로그아웃
   */
  const logout = useCallback(() => {
    authService.logout();
    setAuthState(authService.getAuthState());
  }, []);

  return {
    authState,
    isAuthenticated: authState.isAuthenticated,
    userKey: authState.key,
    socialConnections: authState.socialConnections,
    isLoading,
    error,
    generateAndStoreKey,
    loginWithSocial,
    bindKeyWithSocial,
    backupKeyToEmail,
    logout,
  };
}