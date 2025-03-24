import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/services/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userKey: string | null;
  formattedKey: string | null;
  error: string | null;
  loginWithKey: (
    key: string
  ) => Promise<{ success: boolean; message?: string }>;
  generateAndStoreKey: (email?: string) => Promise<boolean>;
  generateAnonymousKey: () => Promise<boolean>;
  loginWithSocial: (provider: "github" | "google") => Promise<void>;
  createGroup: (name: string) => Promise<any>;
  joinGroup: (key: string) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userKey, setUserKey] = useState<string | null>(null);
  const [formattedKey, setFormattedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 현재 세션 가져오기
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    // 인증 상태 변경 리스너
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 키 로그인 함수
  const loginWithKey = async (key: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // 키 형식 정리 (하이픈 제거)
      const cleanKey = key.replace(/-/g, "");

      // 모든 키를 가져와서 JavaScript에서 필터링
      const { data: allKeys, error: allKeysError } = await supabase
        .from("user_keys")
        .select("user_id, key, is_active");

      if (allKeysError) {
        setError("키 확인 중 오류가 발생했습니다.");
        return { success: false };
      }

      console.log("모든 키:", allKeys);

      const matchingKey = allKeys?.find(
        (k) => k.key === cleanKey && k.is_active
      );
      if (!matchingKey) {
        setError("유효하지 않은 키입니다.");
        return { success: false };
      }

      // 익명 로그인 (임시 세션 생성)
      const { data: authData, error: authError } =
        await supabase.auth.signInAnonymously();

      if (authError) {
        setError(authError.message);
        return { success: false };
      }

      // 사용자 메타데이터 업데이트
      await supabase.auth.updateUser({
        data: {
          original_user_id: matchingKey.user_id,
          key_login: true,
          login_method: "key",
        },
      });

      setUserKey(cleanKey);
      setFormattedKey(formatKey(cleanKey));
      setIsAuthenticated(true);

      return {
        success: true,
        message: "로그인 성공",
      };
    } catch (err: any) {
      console.error("키 로그인 실패:", err);
      setError(err.message || "로그인 중 오류가 발생했습니다.");
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  // 이메일 기반 키 생성 함수 (기존 함수)
  const generateAndStoreKey = async (email?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // 이메일 유효성 검사
      if (!email || email.trim() === "") {
        setError("이메일을 입력해주세요.");
        return false;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError("유효한 이메일 주소를 입력해주세요.");
        return false;
      }

      // 1. 랜덤 키 생성
      const key = generateRandomKey(16);

      // 2. 이메일/비밀번호로 회원가입
      const password = generateRandomKey(12);

      const { data: userData, error: signUpError } = await supabase.auth.signUp(
        {
          email: email,
          password: password,
          options: {
            data: {
              key_prefix: key.substring(0, 4),
            },
          },
        }
      );

      if (signUpError) {
        console.error("회원가입 오류:", signUpError);
        setError(signUpError.message);
        return false;
      }

      if (!userData.user) {
        setError("사용자 생성에 실패했습니다.");
        return false;
      }

      // 3. 키 저장
      const { error: keyError } = await supabase.from("user_keys").insert({
        user_id: userData.user.id,
        key: key,
        created_at: new Date().toISOString(),
        is_active: true,
      });

      if (keyError) {
        console.error("키 저장 오류:", keyError);
        setError(keyError.message);
        return false;
      }

      // 4. 사용자 프로필 생성
      const displayName = email.split("@")[0];
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

      // 5. 키 설정 및 반환
      setUserKey(key);
      setFormattedKey(formatKey(key));

      return true;
    } catch (err: any) {
      console.error("키 생성 오류:", err);
      setError(err.message || "키 생성 중 오류가 발생했습니다.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 익명 키 생성 함수 (새로 추가)
  const generateAnonymousKey = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. 익명 로그인
      const { data: authData, error: authError } =
        await supabase.auth.signInAnonymously();

      if (authError) {
        setError(authError.message);
        return false;
      }

      if (!authData.user) {
        setError("익명 로그인 실패");
        return false;
      }

      // 2. 랜덤 키 생성
      const key = generateRandomKey(16);

      // 3. 키 저장
      const { error: keyError } = await supabase.from("user_keys").insert({
        user_id: authData.user.id,
        key: key,
        created_at: new Date().toISOString(),
        is_active: true,
      });

      if (keyError) {
        console.error("키 저장 오류:", keyError);
        setError(keyError.message);
        return false;
      }

      // 4. 사용자 프로필 생성
      const displayName = `User-${authData.user.id.substring(0, 6)}`;
      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert({
          user_id: authData.user.id,
          display_name: displayName,
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error("프로필 생성 오류:", profileError);
        // 프로필 생성 실패해도 계속 진행
      }

      // 5. 사용자 메타데이터 업데이트
      await supabase.auth.updateUser({
        data: {
          key_prefix: key.substring(0, 4),
          key_login: true,
          login_method: "anonymous",
        },
      });

      // 6. 키 설정 및 반환
      setUserKey(key);
      setFormattedKey(formatKey(key));
      setIsAuthenticated(true);

      return true;
    } catch (err: any) {
      console.error("익명 키 생성 오류:", err);
      setError(err.message || "키 생성 중 오류가 발생했습니다.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // 소셜 로그인 함수
  const loginWithSocial = async (provider: "github" | "google") => {
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error(`${provider} 로그인 오류:`, err);
      setError(err.message || `${provider} 로그인 중 오류가 발생했습니다.`);
    } finally {
      setIsLoading(false);
    }
  };

  // 그룹 생성 함수
  const createGroup = async (name: string) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }

      // 그룹 생성
      const { data, error } = await supabase
        .from("groups")
        .insert({
          name,
          created_by: user.id,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (err: any) {
      console.error("그룹 생성 오류:", err);
      setError(err.message || "그룹 생성 중 오류가 발생했습니다.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 그룹 참여 함수
  const joinGroup = async (key: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // 구현 필요

      return { success: true };
    } catch (err: any) {
      console.error("그룹 참여 오류:", err);
      setError(err.message || "그룹 참여 중 오류가 발생했습니다.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 로그아웃 함수
  const signOut = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setUserKey(null);
      setFormattedKey(null);
      setIsAuthenticated(false);
    } catch (err: any) {
      console.error("로그아웃 오류:", err);
      setError(err.message || "로그아웃 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 키 포맷 함수
  const formatKey = (key: string): string => {
    // 4자리마다 하이픈 추가
    return key.replace(/(.{4})/g, "$1-").slice(0, -1);
  };

  // 랜덤 키 생성 함수
  const generateRandomKey = (length: number): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const value = {
    user,
    session,
    isAuthenticated,
    isLoading,
    userKey,
    formattedKey,
    error,
    loginWithKey,
    generateAndStoreKey,
    generateAnonymousKey,
    loginWithSocial,
    createGroup,
    joinGroup,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
