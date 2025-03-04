"use client"

import { useState, useEffect, useCallback } from "react"
import { auth } from "../services/auth"
import { useNavigate } from "react-router-dom"

export function useAuth() {
  const [userKey, setUserKey] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  // 초기 인증 상태 확인
  useEffect(() => {
    const storedKey = auth.getCurrentKey()
    if (storedKey) {
      setUserKey(storedKey)
      setIsAuthenticated(true)
    }
  }, [])

  // 키 생성 및 저장 (회원가입)
  const generateAndStoreKey = useCallback(
    async (email?: string) => {
      setIsLoading(true)
      setError(null)

      try {
        const key = await auth.generateKey(email)
        setUserKey(key)
        localStorage.setItem("userKey", key)
        setIsAuthenticated(true)
        navigate("/dashboard")
      } catch (err) {
        setError(err instanceof Error ? err.message : "키 생성에 실패했습니다.")
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
        const isValid = await auth.validateKey(key)
        if (isValid) {
          setUserKey(key)
          localStorage.setItem("userKey", key)
          setIsAuthenticated(true)
          navigate("/dashboard")
        } else {
          setError("유효하지 않은 키입니다. 다시 확인해주세요.")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "로그인에 실패했습니다.")
      } finally {
        setIsLoading(false)
      }
    },
    [navigate],
  )

  // 소셜 로그인
  const loginWithSocial = useCallback(
    async (provider: "github" | "google") => {
      setIsLoading(true)
      setError(null)

      try {
        const { key } = await auth.socialLogin(provider)
        setUserKey(key)
        localStorage.setItem("userKey", key)
        setIsAuthenticated(true)
        navigate("/dashboard")
      } catch (err) {
        setError(err instanceof Error ? err.message : `${provider} 로그인에 실패했습니다.`)
      } finally {
        setIsLoading(false)
      }
    },
    [navigate],
  )

  // 로그아웃
  const logout = useCallback(() => {
    auth.logout()
    setUserKey(null)
    setIsAuthenticated(false)
    navigate("/login")
  }, [navigate])

  return {
    userKey,
    isAuthenticated,
    isLoading,
    error,
    generateAndStoreKey,
    loginWithKey,
    loginWithSocial,
    logout,
  }
}

