"use client"

import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { auth } from "../services/auth"
import { supabase } from "../services/supabase"
import { formatKey, cleanKey } from "../utils/keys"

export function useAuth() {
  const [userKey, setUserKey] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  // 초기 인증 상태 확인
  useEffect(() => {
    async function checkAuth() {
      try {
        const session = await auth.getSession();
        
        if (session) {
          // 세션이 있으면 사용자 키 가져오기
          const { data: keyData } = await supabase
            .from('user_keys')
            .select('key')
            .eq('user_id', session.user.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          if (keyData) {
            setUserKey(keyData.key);
          }
          
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('인증 확인 오류:', err);
      } finally {
        setIsLoading(false); // 여기서 isLoading을 false로 설정
      }
    }

    checkAuth();
    
    // Supabase 인증 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setIsAuthenticated(!!session);
        
        if (session) {
          // 세션이 있으면 사용자 키 가져오기
          try {
            const { data: keyData } = await supabase
              .from('user_keys')
              .select('key')
              .eq('user_id', session.user.id)
              .eq('is_active', true)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();
            
            if (keyData) {
              setUserKey(keyData.key);
            }
          } catch (err) {
            console.error('키 가져오기 오류:', err);
          } finally {
            setIsLoading(false); // 여기서도 isLoading을 false로 설정
          }
        } else {
          setUserKey(null);
          setIsLoading(false); // 세션이 없는 경우에도 isLoading을 false로 설정
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 키 생성 및 저장 (회원가입)
  const generateAndStoreKey = useCallback(
    async (email?: string) => {
      setIsLoading(true)
      setError(null)

      try {
        const key = await auth.generateAndStoreKey(email)
        setUserKey(key)
        setIsAuthenticated(true)
        navigate("/dashboard")
        return key
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "키 생성에 실패했습니다."
        setError(errorMessage)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [navigate],
  )

  // 키로 로그인
  const loginWithKey = useCallback(
    async (key: string) => {
      if (!key || key.length !== 16) {
        setError("유효하지 않은 키입니다. 16자리 키를 입력해주세요.")
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const result = await auth.loginWithKey(key)
        setUserKey(result.key)
        setIsAuthenticated(true)
        navigate("/dashboard")
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "로그인에 실패했습니다."
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    },
    [navigate],
  )

  // 이메일 OTP 로그인
  const loginWithEmail = useCallback(async (email: string) => {
    setIsLoading(true)
    setError(null)

    try {
      await auth.loginWithOtp(email)
      // 이메일 전송 성공 메시지
      return { success: true, message: "로그인 링크가 이메일로 전송되었습니다." }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "이메일 전송에 실패했습니다."
      setError(errorMessage)
      return { success: false, message: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 소셜 로그인
  const loginWithSocial = useCallback(async (provider: "github" | "google") => {
    setIsLoading(true)
    setError(null)

    try {
      await auth.loginWithSocial(provider)
      // 리디렉션이 발생하므로 여기서는 아무것도 반환하지 않음
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `${provider} 로그인에 실패했습니다.`
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 그룹 생성
  const createGroup = useCallback(
    async (name: string) => {
      setIsLoading(true)
      setError(null)

      try {
        const group = await auth.createGroup(name)
        navigate("/dashboard")
        return group
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "그룹 생성에 실패했습니다."
        setError(errorMessage)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [navigate],
  )

  // 그룹 참여
  const joinGroup = useCallback(
    async (groupKey: string) => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await auth.joinGroup(groupKey)
        navigate("/dashboard")
        return result
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "그룹 참여에 실패했습니다."
        setError(errorMessage)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [navigate],
  )

  // 로그아웃
  const logout = useCallback(async () => {
    setIsLoading(true)

    try {
      await auth.logout()
      setUserKey(null)
      setIsAuthenticated(false)
      navigate("/login")
    } catch (err) {
      console.error("로그아웃 오류:", err)
    } finally {
      setIsLoading(false)
    }
  }, [navigate])

  // 포맷팅된 키 계산
  const formattedKey = userKey ? formatKey(userKey) : ""

  return {
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
    cleanKey,
  }
}

