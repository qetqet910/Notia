import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/services/supabase";
import { auth } from "@/services/auth";
import { formatKey, cleanKey } from "@/utils/keys";

// 사용자 타입 정의 추후 분리 예정
type UserProfile = {
  id?: string;
  user_id?: string;
  display_name?: string;
  avatar_url?: string;
  email?: string;
  provider?: string;
};

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  userKey: string | null;
  formattedKey: string;
  userProfile: UserProfile | null; // 사용자 프로필 추가
  loginWithKey: (key: string) => Promise<void>;
  loginWithEmail: (
    email: string
  ) => Promise<{ success: boolean; message: string }>;
  loginWithSocial: (provider: "github" | "google") => Promise<void>;
  generateAndStoreKey: (email?: string) => Promise<string>;
  createGroup: (name: string) => Promise<any>;
  joinGroup: (groupKey: string) => Promise<any>;
  logout: () => Promise<void>;
  formatKey: (key: string) => string;
  cleanKey: (formattedKey: string) => string;
};

// Context 생성
const AuthContext = createContext<AuthContextType | null>(null);

// Provider 컴포넌트
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // 기존 useAuth.ts의 상태 변수들
  const [userKey, setUserKey] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null); // 사용자 프로필 상태 추가
  const location = useLocation();
  const [isMounted, setIsMounted] = useState(false);

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      // 1. Supabase 사용자 정보 가져오기
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return null;

      // 2. 사용자 프로필 정보 가져오기
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("프로필 가져오기 오류:", profileError);
      }

      // 3. 기본 프로필 정보 구성
      const profile: UserProfile = {
        user_id: user.id,
        email: user.email,
        provider: user.app_metadata?.provider,
        // user_metadata에서 정보 추출
        display_name:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          profileData?.display_name,
        avatar_url: user.user_metadata?.avatar_url || profileData?.avatar_url,
      };

      console.log("사용자 프로필 로드:", profile);
      setUserProfile(profile);

      return profile;
    } catch (err) {
      console.error("프로필 가져오기 실패:", err);
      return null;
    }
  }, []);

  // 초기 인증 상태 확인 (기존 useAuth.ts의 useEffect)
  useEffect(() => {
    console.log("AuthProvider 마운트");
    setIsMounted(true);

    async function checkAuth() {
      try {
        console.log("초기 인증 상태 확인 시작");
        const session = await auth.getSession();

        if (session) {
          console.log("세션 있음:", session);
          setIsAuthenticated(true);

          try {
            // 세션이 있으면 사용자 키 가져오기
            const { data: keyData, error: keyError } = await supabase
              .from("user_keys")
              .select("key")
              .eq("user_id", session.user.id)
              .eq("is_active", true)
              .order("created_at", { ascending: false })
              .limit(1)
              .single();

            if (keyError) {
              console.log("키 데이터 로드 오류:", keyError);
            } else if (keyData) {
              console.log("키 데이터 로드 성공:", keyData.key);
              setUserKey(keyData.key);
            }

            // 사용자 프로필 가져오기
            await fetchUserProfile(session.user.id);
          } catch (err) {
            console.error("사용자 데이터 로드 중 오류:", err);
          }
        } else {
          console.log("세션 없음");
        }
      } catch (err) {
        console.error("인증 확인 오류:", err);
      } finally {
        if (isMounted) {
          console.log("초기 로딩 상태 false로 설정");
          setIsLoading(false);
        }
      }
    }

    checkAuth();

    // Supabase 인증 상태 변경 리스너
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, !!session);

      // 즉시 인증 상태 업데이트 (비동기 작업 전)
      setIsAuthenticated(!!session);

      // 비동기 작업을 별도 함수로 분리
      const updateUserData = async () => {
        try {
          if (!isMounted) {
            console.log("컴포넌트가 언마운트됨, 상태 업데이트 중단");
            return;
          }

          if (session) {
            console.log("세션 있음, 사용자 데이터 로드 시작");
            try {
              // 세션이 있으면 사용자 키 가져오기
              const { data: keyData, error: keyError } = await supabase
                .from("user_keys")
                .select("key")
                .eq("user_id", session.user.id)
                .eq("is_active", true)
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

              if (keyError) {
                console.log("키 데이터 로드 오류:", keyError);
              } else if (keyData) {
                console.log("키 데이터 로드 성공:", keyData.key);
                setUserKey(keyData.key);
              }

              // 사용자 프로필 가져오기
              await fetchUserProfile(session.user.id);

              // 로그인 이벤트에만 리디렉션 적용
              if (event === "SIGNED_IN") {
                // 현재 경로가 로그인 또는 콜백 페이지인 경우에만 리디렉션
                const currentPath = location.pathname;
                if (
                  currentPath === "/login" ||
                  currentPath === "/auth/callback"
                ) {
                  console.log("로그인 후 대시보드로 리디렉션");
                  navigate("/dashboard");
                }
              }
            } catch (err) {
              console.error("사용자 데이터 로드 중 오류:", err);
            }
          } else {
            console.log("세션 없음, 사용자 데이터 초기화");
            setUserKey(null);
            setUserProfile(null);
          }
        } catch (err) {
          console.error("인증 상태 처리 중 오류:", err);
        } finally {
          // 마운트 상태 확인 후 로딩 상태 업데이트
          if (isMounted) {
            console.log("로딩 상태 false로 설정");
            setIsLoading(false);
          }
        }
      };

      // 비동기 작업 실행
      updateUserData();
    });

    return () => {
      console.log("AuthProvider 언마운트");
      setIsMounted(false);
      subscription.unsubscribe();
    };
  }, [navigate, fetchUserProfile, location]);

  useEffect(() => {
    // 이미 인증되었고 로딩 중이 아니며, 현재 경로가 로그인 페이지인 경우에만 리디렉션
    if (isAuthenticated && !isLoading && location.pathname === "/login") {
      navigate("/dashboard");
    }
  }, [isAuthenticated, isLoading, navigate, location.pathname]);

  // 기존 useAuth.ts의 함수들을 그대로 가져옵니다
  const generateAndStoreKey = useCallback(
    async (email?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const key = await auth.generateAndStoreKey(email);
        setUserKey(key);
        setIsAuthenticated(true);
        navigate("/dashboard");
        return key;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "키 생성에 실패했습니다.";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [navigate]
  );

  const logout = useCallback(async () => {
    setIsLoading(true);

    try {
      console.log("로그아웃 시도");
      await auth.logout();

      // 상태 초기화
      setUserKey(null);
      setUserProfile(null);
      setIsAuthenticated(false);

      console.log("로그아웃 성공, 로그인 페이지로 이동");
      navigate("/login");
    } catch (err) {
      console.error("로그아웃 오류:", err);
      setError("로그아웃 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const loginWithKey = useCallback(
    async (key: string) => {
      if (!key || key.length !== 16) {
        setError("유효하지 않은 키입니다. 16자리 키를 입력해주세요.");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await auth.loginWithKey(key);
        setUserKey(result.key);
        setIsAuthenticated(true);
        navigate("/dashboard");
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "로그인에 실패했습니다.";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [navigate]
  );

  const loginWithEmail = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await auth.loginWithOtp(email);
      // 이메일 전송 성공 메시지
      return {
        success: true,
        message: "로그인 링크가 이메일로 전송되었습니다.",
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "이메일 전송에 실패했습니다.";
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithSocial = useCallback(async (provider: "github" | "google") => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`${provider} 로그인 시도`);
      await auth.loginWithSocial(provider);
      // 리디렉션이 발생하므로 여기서는 아무것도 반환하지 않음
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : `${provider} 로그인에 실패했습니다.`;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createGroup = useCallback(
    async (name: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const group = await auth.createGroup(name);
        navigate("/dashboard");
        return group;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "그룹 생성에 실패했습니다.";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [navigate]
  );

  const joinGroup = useCallback(
    async (groupKey: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await auth.joinGroup(groupKey);
        navigate("/dashboard");
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "그룹 참여에 실패했습니다.";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [navigate]
  );

  // 포맷팅된 키 계산
  const formattedKey = userKey ? formatKey(userKey) : "";

  // Context 값 정의
  const authContextValue: AuthContextType = {
    userKey,
    formattedKey,
    isAuthenticated,
    isLoading,
    error,
    userProfile, // 사용자 프로필 추가
    generateAndStoreKey,
    loginWithKey,
    loginWithEmail,
    loginWithSocial,
    createGroup,
    joinGroup,
    logout,
    formatKey,
    cleanKey,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// useAuth 훅 - 기존 useAuth.ts를 대체
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
