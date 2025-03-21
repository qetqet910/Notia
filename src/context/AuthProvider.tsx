import type React from "react";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/services/supabase";
import { auth } from "@/services/auth";
import { formatKey, cleanKey } from "@/utils/keys";

type UserProfile = {
  id?: string;
  user_id?: string;
  display_name?: string;
  avatar_url?: string;
  email?: string;
  provider?: string;
};

type AuthContextType = {
  userKey: string | null;
  formattedKey: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  userProfile: UserProfile | null;
  generateAndStoreKey: (email?: string) => Promise<string>;
  loginWithKey: (key: string) => Promise<void>;
  loginWithEmail: (
    email: string
  ) => Promise<{ success: boolean; message: string }>;
  loginWithSocial: (provider: "github" | "google") => Promise<void>;
  createGroup: (name: string) => Promise<any>;
  joinGroup: (groupKey: string) => Promise<any>;
  logout: () => Promise<void>;
  formatKey: (key: string) => string;
  cleanKey: (formattedKey: string) => string;
  setIsAuthenticated: (value: boolean) => void;
};

// Context 생성
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider 컴포넌트
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // 상태 변수들
  const [userKey, setUserKey] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // 마운트 상태 추적을 위한 ref
  const isMounted = useRef(true);

  // 사용자 프로필 가져오기
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      if (!isMounted.current) return null;

      // Supabase 사용자 정보 가져오기
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return null;

      // 사용자 프로필 정보 가져오기
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("프로필 가져오기 오류:", profileError);
      }

      // 기본 프로필 정보 구성
      const profile: UserProfile = {
        user_id: user.id,
        email: user.email,
        provider: user.app_metadata?.provider,
        display_name:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          profileData?.display_name,
        avatar_url: user.user_metadata?.avatar_url || profileData?.avatar_url,
      };

      if (isMounted.current) {
        setUserProfile(profile);
      }

      return profile;
    } catch (err) {
      console.error("프로필 가져오기 실패:", err);
      return null;
    }
  }, []);

  // 사용자 키 가져오기
  const fetchUserKey = useCallback(async (userId: string) => {
    try {
      if (!isMounted.current) return;

      // 오류 처리를 위해 try-catch 사용
      try {
        const { data: keyData, error: keyError } = await supabase
          .from("user_keys")
          .select("key")
          .eq("user_id", userId)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (keyError) {
          console.log("키 데이터 로드 오류:", keyError);
          return;
        }

        if (keyData && isMounted.current) {
          console.log("사용자 키 발견:", keyData.key);
          setUserKey(keyData.key);
        }
      } catch (err) {
        console.error("키 가져오기 예외:", err);
      }
    } catch (err) {
      console.error("키 가져오기 실패:", err);
    }
  }, []);

  // 현재 경로에 따른 리디렉션 처리
  const handleRedirection = useCallback(
    (isAuth: boolean) => {
      const currentPath = location.pathname;

      // 인증된 사용자가 로그인 페이지에 접근하면 대시보드로 리디렉션
      if (
        isAuth &&
        (currentPath === "/login" || currentPath === "/auth/callback")
      ) {
        console.log(
          "인증된 사용자가 로그인 페이지에 접근, 대시보드로 리디렉션"
        );
        navigate("/dashboard");
      }

      // 인증되지 않은 사용자가 보호된 경로에 접근하면 로그인 페이지로 리디렉션
      if (!isAuth && currentPath.startsWith("/dashboard")) {
        console.log(
          "인증되지 않은 사용자가 보호된 경로에 접근, 로그인으로 리디렉션"
        );
        navigate("/login");
      }
    },
    [location.pathname, navigate]
  );

  // 초기 인증 상태 확인
  useEffect(() => {
    console.log("AuthProvider 마운트");

    isMounted.current = true;

    // Supabase 세션 확인 함수
    const checkSession = async () => {
      try {
        console.log("세션 확인 시작");

        // 모든 상태 초기화
        setIsLoading(true);
        setIsAuthenticated(false);
        setUserKey(null);
        setUserProfile(null);

        // Supabase의 내장 세션 관리 사용
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("세션 확인 오류:", error);
          if (isMounted.current) {
            setIsAuthenticated(false);
            setIsLoading(false);
          }
          return;
        }

        if (data.session) {
          console.log("세션 발견:", data.session.user.id);

          if (isMounted.current) {
            setIsAuthenticated(true);
          }

          // 사용자 키와 프로필 가져오기
          await fetchUserKey(data.session.user.id);
          await fetchUserProfile(data.session.user.id);
        } else {
          console.log("세션 없음");
          if (isMounted.current) {
            setIsAuthenticated(false);
            setUserKey(null);
            setUserProfile(null);
          }
        }
      } catch (err) {
        console.error("세션 확인 중 예외 발생:", err);
      } finally {
        if (isMounted.current) {
          console.log("로딩 상태 업데이트: false");
          setIsLoading(false);
        }
      }
    };

    // 세션 확인 실행
    checkSession();

    // 인증 상태 변경 리스너
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, !!session);

      if (!isMounted.current) return;

      if (session) {
        console.log("세션 있음, 사용자 데이터 로드 시작");

        if (isMounted.current) {
          setIsAuthenticated(true);
        }

        try {
          await fetchUserKey(session.user.id);
          await fetchUserProfile(session.user.id);
        } catch (err) {
          console.error("사용자 데이터 로드 중 오류:", err);
        }
      } else {
        console.log("세션 없음, 사용자 데이터 초기화");

        if (isMounted.current) {
          setIsAuthenticated(false);
          setUserKey(null);
          setUserProfile(null);
        }
      }

      if (isMounted.current) {
        setIsLoading(false);
      }
    });

    return () => {
      console.log("AuthProvider 언마운트");
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  // 키 생성 및 저장 (회원가입)
  const generateAndStoreKey = useCallback(
    async (email?: string) => {
      // 이미 로딩 중이면 중복 호출 방지
      if (isLoading) return null;

      try {
        setIsLoading(true);
        setError(null);

        // auth.ts의 함수 호출
        const key = await auth.generateAndStoreKey(email);

        if (isMounted.current) {
          setUserKey(key);
          formatKey(key);
          // 여기서는 인증 상태를 변경하지 않음 (키만 생성)
          // setIsAuthenticated(true);
        }

        return key;
      } catch (err: any) {
        console.error("키 생성 오류:", err);

        // 사용자 친화적인 오류 메시지
        let errorMessage = "키 생성에 실패했습니다.";

        if (err.message === "Email not confirmed") {
          errorMessage = "이메일 확인이 필요합니다. 이메일을 확인해주세요.";
        } else if (err.message?.includes("duplicate key")) {
          errorMessage = "이미 사용 중인 이메일입니다.";
        }

        if (isMounted.current) {
          setError(errorMessage);
        }

        return null;
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    },
    [isLoading]
  );

  // 키로 로그인
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
        if (isMounted.current) {
          setUserKey(result.message);
          setIsAuthenticated(true);
        }
        navigate("/dashboard");
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "로그인에 실패했습니다.";
        if (isMounted.current) {
          setError(errorMessage);
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    },
    [navigate]
  );

  // 이메일 OTP 로그인
  const loginWithEmail = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await auth.loginWithOtp(email);
      return {
        success: true,
        message: "로그인 링크가 이메일로 전송되었습니다.",
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "이메일 전송에 실패했습니다.";
      if (isMounted.current) {
        setError(errorMessage);
      }
      return { success: false, message: errorMessage };
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // 소셜 로그인
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
      if (isMounted.current) {
        setError(errorMessage);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // 그룹 생성
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
        if (isMounted.current) {
          setError(errorMessage);
        }
        throw err;
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    },
    [navigate]
  );

  // 그룹 참여
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
        if (isMounted.current) {
          setError(errorMessage);
        }
        throw err;
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    },
    [navigate]
  );

  // 로그아웃
  const logout = useCallback(async () => {
    setIsLoading(true);

    try {
      console.log("로그아웃 시도");

      // 상태 먼저 초기화
      if (isMounted.current) {
        setUserKey(null);
        setUserProfile(null);
        setIsAuthenticated(false);
      }

      // 로그아웃 처리
      await auth.logout();

      console.log("로그아웃 성공, 로그인 페이지로 이동");

      // 로그아웃 후 약간의 지연을 두고 리디렉션
      setTimeout(() => {
        if (isMounted.current) {
          navigate("/login");
        }
      }, 100);
    } catch (err) {
      console.error("로그아웃 오류:", err);
      if (isMounted.current) {
        setError("로그아웃 중 오류가 발생했습니다.");
        setIsLoading(false); // 오류 시 로딩 상태 해제
      }
    }
  }, [navigate]);

  // 포맷팅된 키 계산
  const formattedKey = userKey ? formatKey(userKey) : null;

  // Context 값 정의
  const value = {
    userKey,
    formattedKey,
    isAuthenticated,
    isLoading,
    error,
    userProfile,
    generateAndStoreKey,
    loginWithKey,
    loginWithEmail,
    loginWithSocial,
    createGroup,
    joinGroup,
    logout,
    formatKey,
    cleanKey,
    setIsAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// useAuth 훅
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
