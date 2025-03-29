import { supabase } from "./supabase"
import { generateRandomKey, formatKey } from "@/utils/keys"
import { useAuthStore } from "@/stores/authStore"

type SocialProvider = "google" | "github"

interface LoginAttempt {
  timestamp: string
  success: boolean
  ip: string
}

class AuthService {
  // 현재 사용자 가져오기
  async getCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  }

  // 현재 세션 가져오기
  async getSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session
  }

  // 이메일로 OTP 로그인
  async loginWithOtp(email: string) {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) throw error
    return data
  }

  // 로그인 시도 제한 확인 (IP 기반)
  async checkLoginRateLimit(): Promise<boolean> {
    // 실제 구현에서는 클라이언트 IP를 가져와야 함
    const clientIp = "client-ip"

    // 현재 시간에서 15분 전
    const fifteenMinutesAgo = new Date()
    fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15)

    // 로그인 시도 횟수 확인 (메모리 또는 로컬 스토리지 사용)
    // 실제 구현에서는 데이터베이스나 Redis 등을 사용해야 함
    const loginAttempts = this.getLoginAttempts()

    // 15분 이내의 실패한 로그인 시도 필터링
    const recentFailedAttempts = loginAttempts.filter(
      (attempt) => !attempt.success && new Date(attempt.timestamp) > fifteenMinutesAgo,
    )

    // 5회 이상 실패 시 제한
    return recentFailedAttempts.length >= 5
  }

  // 로그인 시도 기록 (메모리 사용)
  async recordLoginAttempt(success: boolean) {
    // 실제 구현에서는 데이터베이스나 Redis 등을 사용해야 함
    const loginAttempts = this.getLoginAttempts()

    loginAttempts.push({
      timestamp: new Date().toISOString(),
      success: success,
      ip: "client-ip", // 실제 구현에서는 클라이언트 IP 가져오기
    })

    // 최대 100개만 저장
    if (loginAttempts.length > 100) {
      loginAttempts.shift()
    }

    // 로컬 스토리지에 저장
    localStorage.setItem("loginAttempts", JSON.stringify(loginAttempts))
  }

  // 로그인 시도 가져오기
  getLoginAttempts() {
    const storedAttempts = localStorage.getItem("loginAttempts")
    return storedAttempts ? JSON.parse(storedAttempts) : []
  }

  async hashKeyWithSalt(key: string, salt: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(key + salt)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  }

  async loginWithKey(key: string) {
    try {
      // 키 형식 정리 (하이픈 제거)
      const cleanKey = key.replace(/-/g, "")

      console.log("로그인 시도 키:", cleanKey)

      // 로그인 시도 제한 확인 (IP 기반)
      const isRateLimited = await this.checkLoginRateLimit()
      if (isRateLimited) {
        throw new Error("너무 많은 로그인 시도. 잠시 후 다시 시도해주세요.")
      }

      // 키로 사용자 찾기 - 쿼리 방식 변경
      // 1. RPC 함수 사용 (권장)
      try {
        const { data, error } = await supabase.rpc("find_user_by_key", {
          key_value: cleanKey,
        })

        if (error) throw error
        if (!data || data.length === 0) {
          await this.recordLoginAttempt(false)
          throw new Error("유효하지 않은 키입니다.")
        }

        const userId = data[0].user_id

        // 익명 로그인 (임시 세션 생성)
        const { data: authData, error: authError } = await supabase.auth.signInAnonymously()

        if (authError) {
          await this.recordLoginAttempt(false)
          throw authError
        }

        // 사용자 메타데이터 업데이트 (실제 사용자 ID 연결)
        await supabase.auth.updateUser({
          data: {
            original_user_id: userId,
            key_login: true,
            login_method: "key",
          },
        })

        // 로그인 성공 기록
        await this.recordLoginAttempt(true)

        // Zustand 스토어 업데이트
        useAuthStore.setState({
          userKey: cleanKey,
          formattedKey: formatKey(cleanKey),
          isAuthenticated: true,
        })

        return {
          success: true,
          message: "로그인 성공",
          key: cleanKey,
        }
      } catch (rpcError) {
        console.error("RPC 호출 오류:", rpcError)

        // 2. 대체 방법: 직접 SQL 쿼리 (RPC가 없는 경우)
        try {
          // 백틱으로 컬럼 이름 감싸기
          const { data: keyData, error: keyError } = await supabase
            .from("user_keys")
            .select("user_id")
            .filter("key", "eq", cleanKey) // filter 메소드 사용
            .eq("is_active", true)
            .single()

          if (keyError || !keyData) {
            // 3. 마지막 방법: 모든 키를 가져와서 JavaScript에서 필터링
            const { data: allKeys, error: allKeysError } = await supabase
              .from("user_keys")
              .select("user_id, key, is_active")

            if (allKeysError) {
              await this.recordLoginAttempt(false)
              throw new Error("키 확인 중 오류가 발생했습니다.")
            }

            const matchingKey = allKeys?.find((k) => k.key === cleanKey && k.is_active)
            if (!matchingKey) {
              await this.recordLoginAttempt(false)
              throw new Error("유효하지 않은 키입니다.")
            }

            // 익명 로그인 (임시 세션 생성)
            const { data: authData, error: authError } = await supabase.auth.signInAnonymously()

            if (authError) {
              await this.recordLoginAttempt(false)
              throw authError
            }

            // 사용자 메타데이터 업데이트
            await supabase.auth.updateUser({
              data: {
                original_user_id: matchingKey.user_id,
                key_login: true,
                login_method: "key",
              },
            })

            // 로그인 성공 기록
            await this.recordLoginAttempt(true)

            // Zustand 스토어 업데이트
            useAuthStore.setState({
              userKey: cleanKey,
              formattedKey: formatKey(cleanKey),
              isAuthenticated: true,
            })

            return {
              success: true,
              message: "로그인 성공",
              key: cleanKey,
            }
          }

          // 키를 찾은 경우 (두 번째 방법 성공)
          // 익명 로그인 (임시 세션 생성)
          const { data: authData, error: authError } = await supabase.auth.signInAnonymously()

          if (authError) {
            await this.recordLoginAttempt(false)
            throw authError
          }

          // 사용자 메타데이터 업데이트
          await supabase.auth.updateUser({
            data: {
              original_user_id: keyData.user_id,
              key_login: true,
              login_method: "key",
            },
          })

          // 로그인 성공 기록
          await this.recordLoginAttempt(true)

          // Zustand 스토어 업데이트
          useAuthStore.setState({
            userKey: cleanKey,
            formattedKey: formatKey(cleanKey),
            isAuthenticated: true,
          })

          return {
            success: true,
            message: "로그인 성공",
            key: cleanKey,
          }
        } catch (directQueryError) {
          console.error("직접 쿼리 오류:", directQueryError)
          throw directQueryError
        }
      }
    } catch (err) {
      console.error("키 로그인 실패:", err)
      throw err
    }
  }

  // auth.ts의 generateAndStoreKey 함수 수정
  async generateAndStoreKey(email?: string) {
    try {
      // 이메일 유효성 검사
      if (!email || email.trim() === "") {
        throw new Error("이메일을 입력해주세요.")
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        throw new Error("유효한 이메일 주소를 입력해주세요.")
      }

      // 1. 랜덤 키 생성 (사용자에게 보여줄 원본 키)
      const originalKey = generateRandomKey(16)

      // 2. 솔트 생성
      const salt = generateRandomKey(16)

      // 3. 키 해싱
      const hashedKey = await this.hashKeyWithSalt(originalKey, salt)

      // 4. 이메일/비밀번호로 회원가입
      const password = generateRandomKey(12)

      const { data: userData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            key_prefix: originalKey.substring(0, 4), // 키 접두사만 저장
            salt: salt, // 솔트도 메타데이터에 저장
          },
        },
      })

      if (signUpError) {
        console.error("회원가입 오류:", signUpError)
        throw signUpError
      }

      if (!userData.user) {
        throw new Error("사용자 생성에 실패했습니다.")
      }

      // 5. 키 저장 (기존 스키마 사용)
      const expiresAt = new Date()
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)

      const { error: keyError } = await supabase.from("user_keys").insert({
        user_id: userData.user.id,
        key: originalKey,
        created_at: new Date().toISOString(),
        is_active: true,
        expires_at: expiresAt.toISOString(), // 만료 시간 설정
      })

      if (keyError) {
        console.error("키 저장 오류:", keyError)
        throw keyError
      }

      // 6. 사용자 프로필 생성
      const displayName = email.split("@")[0]
      const { error: profileError } = await supabase.from("user_profiles").insert({
        user_id: userData.user.id,
        display_name: displayName,
        updated_at: new Date().toISOString(),
      })

      if (profileError) {
        console.error("프로필 생성 오류:", profileError)
        // 프로필 생성 실패해도 계속 진행
      }

      // 7. Zustand 스토어 업데이트
      useAuthStore.setState({
        userKey: originalKey,
        formattedKey: formatKey(originalKey),
      })

      // 8. 원본 키 반환 (사용자에게 보여줄 용도)
      return originalKey
    } catch (err) {
      console.error("키 생성 실패:", err)
      throw err
    }
  }

  // 소셜 로그인 (개선된 버전)
  async loginWithSocial(provider: SocialProvider) {
    try {
      console.log(`${provider} 로그인 시도`)

      // 1. 이미 진행 중인 세션이 있는지 확인
      const { data: sessionData } = await supabase.auth.getSession()

      // 2. 이미 로그인된 경우 로그아웃 처리
      if (sessionData.session) {
        console.log("기존 세션 발견, 로그아웃 처리")
        await supabase.auth.signOut({ scope: "global" })

        // 세션 정리를 위한 짧은 지연
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      // 3. 소셜 로그인 시작
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: false, // 브라우저 리디렉션 사용
        },
      })

      if (error) throw error
      return data
    } catch (err) {
      console.error(`${provider} 로그인 예외:`, err)
      throw err
    }
  }

  async createGroup(name: string) {
    try {
      // 1. 그룹 생성
      const { data: groupData, error: groupError } = await supabase.from("groups").insert({ name }).select().single()

      if (groupError) {
        console.error("그룹 생성 오류:", groupError)
        throw groupError
      }

      // 2. 그룹 멤버십 생성
      const { error: membershipError } = await supabase.from("group_members").insert({
        group_id: groupData.id,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        role: "admin",
      })

      if (membershipError) {
        console.error("그룹 멤버십 생성 오류:", membershipError)
        throw membershipError
      }

      // 3. 그룹 키 생성
      const groupKey = generateRandomKey(16)
      const { error: keyError } = await supabase.from("group_keys").insert({
        group_id: groupData.id,
        key: groupKey,
        created_at: new Date().toISOString(),
        is_active: true,
      })

      if (keyError) {
        console.error("그룹 키 생성 오류:", keyError)
        throw keyError
      }

      return {
        groupId: groupData.id,
        groupKey: formatKey(groupKey),
      }
    } catch (err) {
      console.error("그룹 생성 실패:", err)
      throw err
    }
  }

  // 그룹 참여 - 수정된 버전
  async joinGroup(key: string) {
    try {
      // 키 형식 정리 (하이픈 제거)
      const cleanKey = key.replace(/-/g, "")

      // 키로 그룹 찾기
      const { data: keyData, error: keyError } = await supabase
        .from("group_keys")
        .select("group_id")
        .eq("key", cleanKey)
        .eq("is_active", true)
        .single()

      if (keyError || !keyData) {
        console.error("그룹 키 조회 오류:", keyError)
        throw new Error("유효하지 않은 그룹 키입니다.")
      }

      // 그룹 멤버십 생성
      const { error: membershipError } = await supabase.from("group_members").insert({
        group_id: keyData.group_id,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        role: "member",
      })

      if (membershipError) {
        console.error("그룹 멤버십 생성 오류:", membershipError)
        throw membershipError
      }

      return {
        success: true,
        groupId: keyData.group_id,
      }
    } catch (err) {
      console.error("그룹 참여 실패:", err)
      throw err
    }
  }

  // 로그아웃 (개선된 버전)
  async logout() {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error("로그아웃 오류:", error)
        throw error
      }

      // Zustand 스토어 업데이트
      useAuthStore.setState({
        user: null,
        session: null,
        isAuthenticated: false,
        userKey: null,
        formattedKey: null,
      })

      return { success: true }
    } catch (err) {
      console.error("로그아웃 실패:", err)
      throw err
    }
  }
}

export const auth = new AuthService()