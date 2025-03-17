import { supabase } from "./supabase";
import { generateRandomKey } from "@/utils/keys";

type SocialProvider = "github" | "google";

class AuthService {
  // 현재 사용자 가져오기
  async getCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  }

  // 현재 세션 가져오기
  async getSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  }

  // 이메일로 OTP 로그인
  async loginWithOtp(email: string) {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
    return data;
  }

  // 키로 로그인 (개선된 버전)
  async loginWithKey(key: string) {
    // 1. 키로 사용자 찾기
    const { data: keyData, error: keyError } = await supabase
      .from("user_keys")
      .select("user_id, key")
      .eq("key", key)
      .eq("is_active", true)
      .single();

    if (keyError || !keyData) {
      throw new Error("유효하지 않은 키입니다.");
    }

    // 2. 해당 사용자의 이메일 찾기
    const { data: userData, error: userError } = await supabase
      .from("user_profiles")
      .select("id, user_id")
      .eq("user_id", keyData.user_id)
      .single();

    if (userError) {
      throw new Error("사용자 정보를 찾을 수 없습니다.");
    }

    // 3. 익명 로그인 (키 기반 인증)
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: `${keyData.user_id}@amnesia.app`, // 가상 이메일
        password: key, // 키를 비밀번호로 사용
      });

    if (authError) {
      throw new Error("인증에 실패했습니다.");
    }

    return {
      user: authData.user,
      key,
    };
  }

  // 키 생성 (회원가입) - 개선된 버전
  async generateAndStoreKey(email?: string) {
    // 1. 익명 사용자 생성 또는 이메일 사용자 생성
    let authResponse;

    if (email) {
      // 이메일이 있으면 이메일로 가입
      authResponse = await supabase.auth.signUp({
        email,
        password: generateRandomKey(12), // 임의의 비밀번호 생성
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    } else {
      // 이메일이 없으면 익명 로그인
      const anonymousEmail = `anon-${Date.now()}@amnesia.app`;
      const anonymousPassword = generateRandomKey(12);

      authResponse = await supabase.auth.signUp({
        email: anonymousEmail,
        password: anonymousPassword,
      });
    }

    if (authResponse.error) {
      throw authResponse.error;
    }

    const user = authResponse.data.user;
    if (!user) throw new Error("사용자 생성에 실패했습니다.");

    // 2. 사용자 키 생성
    const key = generateRandomKey(16);

    // 3. 키 저장
    const { error: keyError } = await supabase.from("user_keys").insert({
      user_id: user.id,
      key,
      created_at: new Date().toISOString(),
      is_active: true,
    });

    if (keyError) {
      throw keyError;
    }

    // 4. 사용자 프로필 생성
    const { error: profileError } = await supabase
      .from("user_profiles")
      .insert({
        user_id: user.id,
        display_name: email ? email.split("@")[0] : "익명 사용자",
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error("프로필 생성 오류:", profileError);
    }

    return key;
  }

  // 소셜 로그인 (개선된 버전)
  async loginWithSocial(provider: SocialProvider) {
    try {
      console.log(`${provider} 로그인 시도`);

      // 1. 이미 진행 중인 세션이 있는지 확인
      const { data: sessionData } = await supabase.auth.getSession();

      // 2. 이미 로그인된 경우 로그아웃 처리
      if (sessionData.session) {
        console.log("기존 세션 발견, 로그아웃 처리");
        await supabase.auth.signOut({ scope: "global" });

        // 세션 정리를 위한 짧은 지연
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // 3. 소셜 로그인 시작
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
      console.error(`${provider} 로그인 예외:`, err);
      throw err;
    }
  }

  // 그룹 생성 - 수정된 버전
  async createGroup(name: string) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("로그인이 필요합니다.");

    const key = generateRandomKey(16);

    try {
      // RPC 함수 호출
      const { data, error } = await supabase.rpc("create_group_with_member", {
        group_name: name,
        group_key: key,
        user_id: user.id,
      });

      if (error) {
        console.error("그룹 생성 오류:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("그룹 생성 예외:", error);
      throw error;
    }
  }

  // 그룹 참여 - 수정된 버전
  async joinGroup(groupKey: string) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("로그인이 필요합니다.");

    try {
      // RPC 함수 호출
      const { data, error } = await supabase.rpc("join_group_by_key", {
        group_key: groupKey,
        user_id: user.id,
      });

      if (error) {
        console.error("그룹 참여 오류:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("그룹 참여 예외:", error);
      throw error;
    }
  }

  // 로그아웃 (개선된 버전)
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

export const auth = new AuthService();
