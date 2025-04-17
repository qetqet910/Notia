"use client"

import { useState } from "react"
import { supabase } from "@/services/supabase"
import { generateRandomKey, formatKey } from "@/utils/keys"

export function useAnonymousAuth() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [userKey, setUserKey] = useState<string | null>(null)
  const [formattedKey, setFormattedKey] = useState<string | null>(null)

  // Edge Function을 사용한 익명 사용자 생성
  const createAnonymousUser = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // 랜덤 키 생성
      const key = generateRandomKey(16)

      // Edge Function 호출
      const { data, error } = await supabase.functions.invoke("create-anonymous-user", {
        body: { key },
      })

      if (error) throw error

      if (!data.success) {
        throw new Error(data.error || "사용자 생성 실패")
      }

      // 키 저장
      setUserKey(key)
      setFormattedKey(formatKey(key))

      return {
        success: true,
        key,
        formattedKey: formatKey(key),
        userId: data.user_id,
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("알 수 없는 오류"))
      return { success: false, error: err }
    } finally {
      setIsLoading(false)
    }
  }

  // RPC 함수를 사용한 익명 사용자 생성
  const createAnonymousUserWithRPC = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // RPC 함수 호출
      const { data, error } = await supabase.rpc("create_anonymous_user_with_key")

      if (error) throw error

      if (!data.success) {
        throw new Error(data.error || "사용자 생성 실패")
      }

      // 키 저장
      setUserKey(data.key)
      setFormattedKey(formatKey(data.key))

      return {
        success: true,
        key: data.key,
        formattedKey: formatKey(data.key),
        userId: data.user_id,
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("알 수 없는 오류"))
      return { success: false, error: err }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    error,
    userKey,
    formattedKey,
    createAnonymousUser,
    createAnonymousUserWithRPC,
  }
}
