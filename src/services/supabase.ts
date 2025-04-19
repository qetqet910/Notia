import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL과 Anon Key가 환경 변수에 설정되어 있지 않습니다.")
}

// 인증 상태 변경 추적을 위한 변수
let authChangeCount = 0
let lastAuthEvent = ""
let lastAuthTime = 0

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: "implicit",
    debug: false, // 필요한 경우 디버그 모드 활성화
    storage: {
      getItem: (key) => {
        try {
          return localStorage.getItem(key)
        } catch (error) {
          console.error("로컬 스토리지 접근 오류:", error)
          return null
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value)
        } catch (error) {
          console.error("로컬 스토리지 저장 오류:", error)
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key)
        } catch (error) {
          console.error("로컬 스토리지 삭제 오류:", error)
        }
      },
    },
  },
  global: {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  },
})

// 인증 상태 변경 이벤트 모니터링 및 디바운싱
supabase.auth.onAuthStateChange((event, session) => {
  const now = Date.now()
  authChangeCount++

  // 같은 이벤트가 짧은 시간 내에 여러 번 발생하는 경우 로그
  if (event === lastAuthEvent && now - lastAuthTime < 1000) {
    console.log(`중복 인증 이벤트 감지: ${event} (${authChangeCount}번째)`)

    // 무한 루프 감지 (5번 이상 같은 이벤트가 1초 내에 발생)
    if (authChangeCount > 5) {
      console.warn("인증 이벤트 무한 루프 감지됨. 이벤트 처리 중단.")
      return // 이벤트 처리 중단
    }
  } else {
    // 새로운 이벤트 또는 충분한 시간이 지난 경우 카운터 초기화
    authChangeCount = 1
  }

  lastAuthEvent = event
  lastAuthTime = now
})

export const resetSupabaseClient = () => {
  try {
    console.log("Supabase 클라이언트 재설정 시도")

    // 기존 세션 데이터 백업
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    // 새 클라이언트 생성
    const newClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storage: localStorage,
      },
    })

    // 기존 클라이언트 교체
    Object.assign(supabase, newClient)

    console.log("Supabase 클라이언트 재설정 완료")
    return true
  } catch (error) {
    console.error("Supabase 클라이언트 재설정 실패:", error)
    return false
  }
}
