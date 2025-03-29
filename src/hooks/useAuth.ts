"use client"

// src/hooks/useAuth.ts
import { useAuthStore } from "@/stores/authStore"

// 타입 정의 없이 단순히 스토어의 값들을 반환하는 방식으로 변경
export function useAuth() {
  return useAuthStore()
}

export default useAuth

