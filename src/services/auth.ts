import { supabase } from "./supabase";
import { generateRandomKey, formatKey } from "@/utils/keys";

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
    try {
      // 키 형식 정리 (하이픈 제거)
      const cleanKey = key.replace(/-/g, "");

      // 키로 사용자 찾기
      const { data: keyData, error: keyError } = await supabase
        .from("user_keys")
        .select("user_id")
        .eq("key", cleanKey)
        .eq("is_active", true)
        .single();

      if (keyError || !keyData) {
        console.error("키 조회 오류:", keyError);
        throw new Error("유효하지 않은 키입니다.");
      }

      // 관리자 액세스 토큰 생성 (이 부분은 서버 측에서 수행해야 함)
      // 클라이언트에서는 이 방법을 사용할 수 없으므로 대안 필요

      // 대안: 키를 알고 있는 사용자에게 임시 로그인 링크 발송
      const { data: userData, error: userError } = await supabase
        .from("user_profiles")
        .select("email")
        .eq("user_id", keyData.user_id)
        .single();

      if (userError) {
        console.error("사용자 조회 오류:", userError);
        throw new Error("사용자 정보를 찾을 수 없습니다.");
      }

      // 임시 로그인 링크 발송
      const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email: userData.email,
      });

      if (magicLinkError) {
        console.error("매직 링크 발송 오류:", magicLinkError);
        throw magicLinkError;
      }

      return {
        success: true,
        message: "로그인 링크가 이메일로 발송되었습니다.",
      };
    } catch (err) {
      console.error("키 로그인 실패:", err);
      throw err;
    }
  }

  // 키 생성 (회원가입) - 개선된 버전
  async generateAndStoreKey(email?: string) {
    try {
      // 1. 랜덤 키 생성
      const key = generateRandomKey(16);

      // 2. 이메일/비밀번호로 회원가입
      const password = generateRandomKey(12);
      const userEmail = email || `user-${key}@amnesia.app`;

      const { data: userData, error: signUpError } = await supabase.auth.signUp(
        {
          email: userEmail,
          password: password,
          options: {
            data: {
              key: key, // 사용자 메타데이터에 키 저장
            },
          },
        }
      );

      if (signUpError) {
        console.error("회원가입 오류:", signUpError);
        throw signUpError;
      }

      // 3. 사용자가 생성되었으면 키 저장 (이메일 확인 여부와 무관하게)
      if (userData.user) {
        // 키 저장
        const { error: keyError } = await supabase.from("user_keys").insert({
          user_id: userData.user.id,
          key: key,
          created_at: new Date().toISOString(),
          is_active: true,
        });

        if (keyError) {
          console.error("키 저장 오류:", keyError);
          // 키 저장 실패해도 계속 진행 (키는 이미 생성됨)
        }

        // 사용자 프로필 생성
        const displayName = email ? email.split("@")[0] : "익명 사용자";
        const { error: profileError } = await supabase
          .from("user_profiles")
          .insert({
            user_id: userData.user.id,
            display_name: displayName,
            updated_at: new Date().toISOString(),
          });

        if (profileError) {
          console.error("프로필 생성 오류:", profileError);
          // 프로필 생성 실패해도 계속 진행
        }
      }

      // 4. 키 반환 (로그인 여부와 무관하게)
      return key;
    } catch (err) {
      console.error("키 생성 실패:", err);
      throw err;
    }
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

  async createGroup(name: string) {
    try {
      // 1. 그룹 생성
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .insert({ name })
        .select()
        .single();

      if (groupError) {
        console.error("그룹 생성 오류:", groupError);
        throw groupError;
      }

      // 2. 그룹 멤버십 생성
      const { error: membershipError } = await supabase
        .from("group_members")
        .insert({
          group_id: groupData.id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          role: "admin",
        });

      if (membershipError) {
        console.error("그룹 멤버십 생성 오류:", membershipError);
        throw membershipError;
      }

      // 3. 그룹 키 생성
      const groupKey = generateRandomKey(16);
      const { error: keyError } = await supabase.from("group_keys").insert({
        group_id: groupData.id,
        key: groupKey,
        created_at: new Date().toISOString(),
        is_active: true,
      });

      if (keyError) {
        console.error("그룹 키 생성 오류:", keyError);
        throw keyError;
      }

      return {
        groupId: groupData.id,
        groupKey: formatKey(groupKey),
      };
    } catch (err) {
      console.error("그룹 생성 실패:", err);
      throw err;
    }
  }

  // 그룹 참여 - 수정된 버전
  async joinGroup(key: string) {
    try {
      // 키 형식 정리 (하이픈 제거)
      const cleanKey = key.replace(/-/g, "");

      // 키로 그룹 찾기
      const { data: keyData, error: keyError } = await supabase
        .from("group_keys")
        .select("group_id")
        .eq("key", cleanKey)
        .eq("is_active", true)
        .single();

      if (keyError || !keyData) {
        console.error("그룹 키 조회 오류:", keyError);
        throw new Error("유효하지 않은 그룹 키입니다.");
      }

      // 그룹 멤버십 생성
      const { error: membershipError } = await supabase
        .from("group_members")
        .insert({
          group_id: keyData.group_id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          role: "member",
        });

      if (membershipError) {
        console.error("그룹 멤버십 생성 오류:", membershipError);
        throw membershipError;
      }

      return {
        success: true,
        groupId: keyData.group_id,
      };
    } catch (err) {
      console.error("그룹 참여 실패:", err);
      throw err;
    }
  }

  // 로그아웃 (개선된 버전)
  async logout() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("로그아웃 오류:", error);
        throw error;
      }

      return { success: true };
    } catch (err) {
      console.error("로그아웃 실패:", err);
      throw err;
    }
  }
}

export const auth = new AuthService();
