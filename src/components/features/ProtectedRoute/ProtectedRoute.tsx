"use client"

import type React from "react"
import { useEffect } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthProvider"
import { supabase } from "@/services/supabase"

type ProtectedRouteProps = {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  // 컴포넌트 마운트 시 세션 상태 직접 확인
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession()

        console.log("ProtectedRoute - 세션 확인:", data.session ? "있음" : "없음")

        // 세션이 없지만 isAuthenticated가 true인 경우 로그인 페이지로 리디렉션
        if (!data.session && isAuthenticated) {
          console.log("세션은 없지만 인증 상태가 true, 로그인으로 리디렉션")
          navigate("/login")
        }
      } catch (err) {
        console.error("세션 확인 오류:", err)
      }
    }

    // 로딩 중이 아닐 때만 세션 확인
    if (!isLoading) {
      checkSession()
    }
  }, [isAuthenticated, isLoading, navigate])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#61C9A8]"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

