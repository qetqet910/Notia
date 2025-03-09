import { supabase } from "./supabase"
import { generateRandomKey } from "../utils/keys"

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

  // 키로 로그인
  async loginWithKey(key: string) {
    // 1. 키로 사용자 찾기
    const { data: keyData, error: keyError } = await supabase
      .from("user_keys")
      .select("user_id, key")
      .eq("key", key)
      .eq("is_active", true)
      .single()

    if (keyError || !keyData) {
      throw new Error("유효하지 않은 키입니다.")
    }

    // 2. 해당 사용자의 이메일 찾기
    const { data: userData, error: userError } = await supabase
      .from("user_profiles")
      .select("id, user_id")
      .eq("user_id", keyData.user_id)
      .single()

    if (userError) {
      throw new Error("사용자 정보를 찾을 수 없습니다.")
    }

    // 3. 익명 로그인 (키 기반 인증)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: `${keyData.user_id}@amnesia.app`, // 가상 이메일
      password: key, // 키를 비밀번호로 사용
    })

    if (authError) {
      throw new Error("인증에 실패했습니다.")
    }

    return {
      user: authData.user,
      key,
    }
  }

  // 키 생성 (회원가입)
  async generateAndStoreKey(email?: string) {
    // 1. 익명 사용자 생성 또는 이메일 사용자 생성
    let authResponse

    if (email) {
      // 이메일이 있으면 이메일로 가입
      authResponse = await supabase.auth.signUp({
        email,
        password: generateRandomKey(12), // 임의의 비밀번호 생성
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
    } else {
      // 이메일이 없으면 익명 로그인
      const anonymousEmail = `anon-${Date.now()}@amnesia.app`
      const anonymousPassword = generateRandomKey(12)

      authResponse = await supabase.auth.signUp({
        email: anonymousEmail,
        password: anonymousPassword,
      })
    }

    if (authResponse.error) {
      throw authResponse.error
    }

    const user = authResponse.data.user
    if (!user) throw new Error("사용자 생성에 실패했습니다.")

    // 2. 사용자 키 생성
    const key = generateRandomKey(16)

    // 3. 키 저장
    const { error: keyError } = await supabase.from("user_keys").insert({
      user_id: user.id,
      key,
      created_at: new Date().toISOString(),
      is_active: true,
    })

    if (keyError) {
      throw keyError
    }

    // 4. 사용자 프로필 생성
    const { error: profileError } = await supabase.from("user_profiles").insert({
      user_id: user.id,
      display_name: email ? email.split("@")[0] : "익명 사용자",
      updated_at: new Date().toISOString(),
    })

    if (profileError) {
      console.error("프로필 생성 오류:", profileError)
    }

    return key
  }

  // 소셜 로그인
  async loginWithSocial(provider: SocialProvider) {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: false, // 브라우저 리디렉션 사용
        },
      });
      
      if (error) throw error;
      return data;
    } catch (err) {
      throw err;
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

  // 로그아웃
  async logout() {
    console.log("로그아웃 시작");
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("로그아웃 오류:", error);
        throw error;
      }
      
      console.log("로그아웃 성공");
      return { success: true };
    } catch (err) {
      console.error("로그아웃 예외:", err);
      throw err;
    }
  }
}

export const auth = new AuthService()

