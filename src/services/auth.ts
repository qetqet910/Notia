import { supabase } from "./supabase"
import { generateRandomKey } from "@/utils/keys"

type SocialProvider = "github" | "google"

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

  // 키로 로그인 (개선된 버전)
  async loginWithKey(key: string) {
    try {
      console.log("키 로그인 시도:", key)

      // 1. 키 유효성 검사
      if (!key || key.length !== 16) {
        throw new Error("유효하지 않은 키입니다. 16자리 키를 입력해주세요.")
      }

      // 2. 키로 사용자 찾기
      const { data: keyData, error: keyError } = await supabase
        .from("user_keys")
        .select("user_id, key, is_active")
        .eq("key", key)
        .eq("is_active", true)
        .single()

      if (keyError || !keyData) {
        console.error("키 조회 오류:", keyError)
        throw new Error("유효하지 않은 키이거나 만료된 키입니다.")
      }

      console.log("키 조회 성공:", keyData.user_id)

      // 3. 해당 사용자의 이메일 찾기
      const { data: userData, error: userError } = await supabase
        .from("user_profiles")
        .select("email, user_id")
        .eq("user_id", keyData.user_id)
        .single()

      if (userError) {
        console.error("사용자 정보 조회 오류:", userError)
        throw new Error("사용자 정보를 찾을 수 없습니다.")
      }

      // 4. 키 사용 기록 업데이트
      await supabase
        .from("user_keys")
        .update({
          last_used: new Date().toISOString(),
          usage_count: supabase.rpc("increment_counter", { row_id: keyData.key }),
        })
        .eq("key", key)

      // 5. 로그인 처리
      const email = userData.email || `${keyData.user_id}@amnesia.app`

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: key, // 키를 비밀번호로 사용
      })

      if (authError) {
        console.error("인증 오류:", authError)
        throw new Error("인증에 실패했습니다.")
      }

      console.log("키 로그인 성공")
      return {
        user: authData.user,
        key,
      }
    } catch (error) {
      console.error("키 로그인 오류:", error)
      throw error
    }
  }

  // 키 생성 (회원가입) - 개선된 버전
  async generateAndStoreKey(email?: string) {
    try {
      console.log("키 생성 시작:", email)

      // 1. 사용자 생성 또는 확인
      let user

      if (email) {
        // 이메일이 있으면 이메일로 가입
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password: generateRandomKey(12), // 임의의 비밀번호 생성
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })

        if (authError) {
          console.error("이메일 가입 오류:", authError)
          throw authError
        }

        user = authData.user
      } else {
        // 이메일이 없으면 익명 로그인
        const anonymousEmail = `anon-${Date.now()}@amnesia.app`
        const anonymousPassword = generateRandomKey(12)

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: anonymousEmail,
          password: anonymousPassword,
        })

        if (authError) {
          console.error("익명 가입 오류:", authError)
          throw authError
        }

        user = authData.user
      }

      if (!user) {
        throw new Error("사용자 생성에 실패했습니다.")
      }

      console.log("사용자 생성 성공:", user.id)

      // 2. 사용자당 키 생성 제한 확인
      const { data: existingKeys, error: countError } = await supabase
        .from("user_keys")
        .select("id", { count: "exact" })
        .eq("user_id", user.id)

      if (countError) {
        console.error("키 개수 조회 오류:", countError)
        throw countError
      }

      // 키 생성 제한 (예: 최대 5개)
      const MAX_KEYS_PER_USER = 5
      if (existingKeys && existingKeys.length >= MAX_KEYS_PER_USER) {
        throw new Error(`최대 ${MAX_KEYS_PER_USER}개의 키만 생성할 수 있습니다.`)
      }

      // 3. 고유한 키 생성
      const key = generateRandomKey(16)
      console.log("키 생성됨:", key)

      // 4. 키 저장
      const { error: keyError } = await supabase.from("user_keys").insert({
        user_id: user.id,
        key,
        created_at: new Date().toISOString(),
        is_active: true,
      })

      if (keyError) {
        console.error("키 저장 오류:", keyError)
        throw keyError
      }

      // 5. 사용자 프로필 생성 또는 업데이트
      const anonymousEmail = `anon-${Date.now()}@amnesia.app`
      const { error: profileError } = await supabase.from("user_profiles").upsert({
        user_id: user.id,
        email: email || anonymousEmail,
        display_name: email ? email.split("@")[0] : "익명 사용자",
        updated_at: new Date().toISOString(),
      })

      if (profileError) {
        console.error("프로필 생성 오류:", profileError)
        // 프로필 생성 오류는 치명적이지 않으므로 계속 진행
      }

      console.log("키 생성 완료")
      return key
    } catch (error) {
      console.error("키 생성 오류:", error)
      throw error
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

      if (error) {
        console.error(`${provider} 로그인 오류:`, error)
        throw error
      }

      console.log(`${provider} 로그인 리디렉션 시작`)
      return data
    } catch (err) {
      console.error(`${provider} 로그인 예외:`, err)
      throw err
    }
  }

  // 그룹 생성
  async createGroup(name: string) {
    const user = await this.getCurrentUser()
    if (!user) throw new Error("로그인이 필요합니다.")

    const key = generateRandomKey(16)

    const { data, error } = await supabase
      .from("user_groups")
      .insert({
        name,
        key,
        owner_id: user.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // 그룹 멤버로 자신 추가
    await supabase.from("group_members").insert({
      group_id: data.id,
      user_id: user.id,
      joined_at: new Date().toISOString(),
    })

    return data
  }

  // 그룹 참여
  async joinGroup(groupKey: string) {
    const user = await this.getCurrentUser()
    if (!user) throw new Error("로그인이 필요합니다.")

    // 그룹 찾기
    const { data: group, error: groupError } = await supabase
      .from("user_groups")
      .select("id, name, owner_id")
      .eq("key", groupKey)
      .single()

    if (groupError || !group) {
      throw new Error("유효하지 않은 그룹 키입니다.")
    }

    // 이미 멤버인지 확인
    const { data: existingMember } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", group.id)
      .eq("user_id", user.id)
      .single()

    if (existingMember) {
      return { message: "이미 그룹의 멤버입니다." }
    }

    // 그룹에 멤버 추가
    const { error: memberError } = await supabase.from("group_members").insert({
      group_id: group.id,
      user_id: user.id,
      joined_at: new Date().toISOString(),
    })

    if (memberError) throw memberError

    return {
      message: `${group.name} 그룹에 참여했습니다.`,
      group,
    }
  }

  // 로그아웃 (개선된 버전)
  async logout() {
    console.log("로그아웃 시작")

    try {
      // 모든 탭에서 로그아웃
      const { error } = await supabase.auth.signOut({ scope: "global" })

      if (error) {
        console.error("로그아웃 오류:", error)
        throw error
      }

      // 브라우저 스토리지 정리
      localStorage.removeItem("supabase.auth.token")
      localStorage.removeItem("supabase-auth-token")
      sessionStorage.clear()

      // 쿠키 정리 (필요한 경우)
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
      })

      console.log("로그아웃 성공")
      return { success: true }
    } catch (err) {
      console.error("로그아웃 예외:", err)
      throw err
    }
  }
}

export const auth = new AuthService()

