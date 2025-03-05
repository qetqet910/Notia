"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../services/supabase"
import { Loader2 } from "lucide-react"

export const AuthCallback = () => {
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    // URL 파라미터에서 인증 정보 처리
    const handleAuthCallback = async () => {
      try {
        // 현재 URL에서 해시 또는 쿼리 파라미터 처리
        const { data, error } = await supabase.auth.getSession()

        if (error) throw error

        if (data.session) {
          // 인증 성공, 대시보드로 리디렉션
          navigate("/dashboard")
        } else {
          // 세션이 없으면 로그인 페이지로
          navigate("/login")
        }
      } catch (err) {
        console.error("인증 콜백 오류:", err)
        setError("인증 처리 중 오류가 발생했습니다.")
        // 3초 후 로그인 페이지로 리디렉션
        setTimeout(() => navigate("/login"), 3000)
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-white to-[#e6f7f2]">
      <div className="text-center">
        {error ? (
          <div className="text-red-500 mb-4">{error}</div>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-[#61C9A8] mx-auto mb-4" />
            <h2 className="text-xl font-medium text-gray-700 mb-2">인증 처리 중...</h2>
            <p className="text-gray-500">잠시만 기다려 주세요.</p>
          </>
        )}
      </div>
    </div>
  )
}

export default AuthCallback

