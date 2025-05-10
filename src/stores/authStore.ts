import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/services/supabaseClient';
import type { User } from '@supabase/supabase-js';
import { generateRandomKey, formatKey } from '@/utils/keys';
import { checkCreationLimit } from '@/utils/check';

interface AuthState {
  // 사용자 상태
  user: User | null;
  session: any | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;

  // 키 관련 상태
  userKey: string | null;
  formattedKey: string | null;

  // 로딩 상태
  isRegisterLoading: boolean;
  isLoginLoading: boolean;
  isLogoutLoading: boolean;
  isSessionCheckLoading: boolean;

  // 오류 상태
  error: Error | null;
}

interface UserProfile {
  id: string;
  raw_user_meta_data?: {
    avatar_url?: string;
    name?: string;
    email_verified?: boolean;
    provider_id?: string;
    [key: string]: any; // 확장 가능
  };
}

interface AuthStore extends AuthState {
  // 기본 상태 관리 메서드
  setUserKey: (key: string | null) => void;
  setFormattedKey: (key: string | null) => void;
  setUser: (user: User | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setError: (error: Error | null) => void;
  clearState: () => void;
  clearUserKey: () => void;

  // 인증 메서드
  loginWithKey: (key: string) => Promise<{
    success: boolean;
    message?: string;
    user?: User | null;
    error?: Error | null;
  }>;
  generateEmailKey: (email?: string) => Promise<boolean>;
  generateAnonymousKey: () => Promise<{
    success: boolean;
    key: string;
    formattedKey: string;
    warning?: string;
  }>;
  loginWithSocial: (provider: 'github' | 'google') => Promise<void>;
  signOut: () => Promise<{ success: boolean; error?: any }>;

  // 세션 관리
  checkSession: () => Promise<boolean>;
  fetchUserProfile: (userId: string) => Promise<UserProfile | null>;
  restoreSession: () => Promise<boolean>;
  checkCreationLimit: (clientIP: string) => Promise<{
    allowed: boolean;
    error?: string;
  }>;
  createAnonymousUserWithEdgeFunction: (
    key: string,
    clientIP: string,
  ) => Promise<{
    success: boolean;
    userId?: User;
    error?: string;
    code?: string;
  }>;
  createEmailUserWithEdgeFunction: (
    email: string,
    key: string,
    clientIP: string,
  ) => Promise<{
    success: boolean;
    userId?: User;
    error?: string;
    code?: string;
  }>;
}

export const useAuthStore = create<AuthStore>()(
  persist((set, get) => ({
    user: null,
    session: null,
    userProfile: null,
    isAuthenticated: false,
    isRegisterLoading: false,
    isLoginLoading: false,
    isLogoutLoading: false,
    isSessionCheckLoading: false,
    userKey: null,
    formattedKey: null,
    error: null,
    isGeneratingKey: false,

    // 첫 번째 코드의 기본 메서드
    setUserKey: (key) => set({ userKey: key }),
    setFormattedKey: (key) => set({ formattedKey: key }),
    setUser: (user) => set({ user }),
    setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
    setError: (error) => set({ error }),
    clearState: () =>
      set({
        userKey: null,
        formattedKey: null,
        user: null,
        isAuthenticated: false,
        error: null,
      }),
    clearUserKey: () => set({ userKey: null }),

    checkSession: async () => {
      try {
        set({ isSessionCheckLoading: true });

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;

        if (session) {
          set({
            user: session.user,
            session,
            isAuthenticated: true,
          });
          return true;
        } else {
          set({
            user: null,
            session: null,
            isAuthenticated: false,
          });
          return false;
        }
      } catch (error) {
        console.error('세션 확인 오류:', error);
        set({ error: error as Error });
        return false;
      } finally {
        set({ isSessionCheckLoading: false });
      }
    },

    fetchUserProfile: async (userId: string) => {
      try {
        // 1. 현재 로그인한 사용자 정보 가져오기
        const {
          data: { user: authUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error('인증 사용자 조회 오류:', userError);
        } else if (authUser) {
          console.log('인증된 사용자:', authUser);
          // 메타데이터가 있다면 여기서 사용할 수 있음
          const userData = {
            ...authUser,
            raw_user_meta_data: authUser.user_metadata, // 이름 일치시키기
          };
          set({ userProfile: userData });
          return userData;
        }

        // 2. 커스텀 사용자 테이블 조회
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', userId) // user_id 필드 사용
          .single();

        if (error) {
          console.error('프로필 조회 오류:', error);
          return null;
        }

        console.log('조회된 프로필 데이터:', profile);

        if (profile) {
          set({ userProfile: profile });
          return profile;
        }

        return null;
      } catch (error) {
        console.error('프로필 조회 오류:', error);
        return null;
      }
    },

    // 세션 복원
    restoreSession: async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;

        if (session) {
          set({
            user: session.user,
            session,
            isAuthenticated: true,
          });

          // 사용자 프로필 조회
          if (session.user) {
            await get().fetchUserProfile(session.user.id);
          }

          return true;
        }

        return false;
      } catch (error) {
        console.error('세션 복원 오류:', error);
        return false;
      }
    },

    loginWithKey: async (key: string) => {
      try {
        set({ isLoginLoading: true, error: null });
        const cleanKey = key.replace(/-/g, '').toUpperCase();

        // 서버 응답 자세히 로깅
        console.log('서버 요청 시작 - 키:', cleanKey);
        const { data: keyCheckData, error: keyCheckError } =
          await supabase.functions.invoke('login_with_key', {
            body: { key: cleanKey },
          });

        console.log('서버 응답 데이터:', JSON.stringify(keyCheckData, null, 2));

        // 키 검증 실패 시 즉시 오류 반환
        if (keyCheckError || !keyCheckData || !keyCheckData.success) {
          const errorMessage =
            keyCheckError?.message ||
            keyCheckData?.error ||
            '유효하지 않은 키입니다.';
          throw new Error(errorMessage);
        }

        // 기존 세션 정리
        await supabase.auth.signOut();
        console.log('기존 세션 정리 완료');

        if (keyCheckData.email) {
          // 이메일이 있는 경우 일반 로그인
          console.log('이메일 계정 로그인 시도 시작');
          const { data, error } = await supabase.auth.signInWithPassword({
            email: keyCheckData.email,
            password: cleanKey,
          });

          console.log('로그인 결과:', data);

          if (error) {
            console.log('로그인 실패:', error.message);
            console.error('CLIENT: SignIn Error:', error);
            throw error;
          }

          // 상태 업데이트
          set({
            userKey: cleanKey,
            formattedKey: cleanKey,
            isAuthenticated: true,
            isLoginLoading: false,
            userProfile: keyCheckData.user?.user_metadata, // UserProfile에 대한 상태 업데이트 최적화 꼭 하기 **
          });
        } else {
          // 이메일이 없는 익명 계정 로그인
          console.log('익명 사용자 로그인 시도');
          console.log('세션 데이터 확인:', keyCheckData.session);

          // 세션 데이터가 문자열이면 파싱 시도
          let sessionData = keyCheckData.session;
          if (typeof sessionData === 'string') {
            try {
              sessionData = JSON.parse(sessionData);
              console.log('문자열에서 파싱된 세션 데이터:', sessionData);
            } catch (e) {
              console.error('세션 문자열 파싱 실패:', e);
            }
          }

          if (!sessionData) {
            console.error('세션 데이터 누락. 전체 응답:', keyCheckData);
            throw new Error('서버에서 세션 정보를 받지 못했습니다.');
          }

          // 서버에서 받은 세션으로 로그인
          console.log('세션 설정 시도:', sessionData);
          const { data: authData, error: sessionError } =
            await supabase.auth.setSession(sessionData);

          if (sessionError) {
            console.error('CLIENT: 익명 로그인 세션 설정 실패:', sessionError);
            throw sessionError;
          }

          console.log('익명 사용자 세션 설정 완료:', authData);

          // 상태 업데이트
          set({
            userKey: cleanKey,
            formattedKey: cleanKey,
            isAuthenticated: true,
            isLoginLoading: false,
          });
        }

        return {
          success: true,
          message: '로그인 성공',
        };
      } catch (error) {
        console.error('키 로그인 실패:', error);
        set({ error: error as Error, isLoginLoading: false });
        return {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : '로그인 중 오류가 발생했습니다.',
          error: error as Error,
        };
      } finally {
        console.log('로그인 처리 완료');
      }
    },

    generateEmailKey: async (email?: string) => {
      try {
        set({ isRegisterLoading: true, error: null });

        // 1. 이메일 유효성 검사 (선택 사항)
        if (email) {
          const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
          if (!isValid) {
            throw new Error('유효하지 않은 이메일 형식입니다.');
          }
        }

        // 2. 랜덤 키 생성
        const key = generateRandomKey(16);
        const formattedKeyValue = formatKey(key);

        // 3. 사용자 생성 (이메일이 있으면 이메일로, 없으면 익명)
        let userData;

        if (email) {
          // 이메일로 가입된 사용자가 있는지 확인
          const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

          if (existingUser) {
            // 기존 사용자에게 키 연결
            userData = { user: existingUser };
          } else {
            // 새 사용자 생성 (이메일 초대)
            const { data, error } = await supabase.auth.signInWithOtp({
              email,
              options: {
                shouldCreateUser: true,
              },
            });

            if (error) throw error;
            userData = data;
          }
        } else {
          // 익명 사용자 생성
          const { data, error } = await supabase.auth.signInAnonymously();
          if (error) throw error;
          userData = data;
        }

        // 4. 키 저장 (통합 keys 테이블에)
        const { error: insertError } = await supabase.from('keys').insert({
          key: key,
          type: email ? 'user' : 'anonymous',
          user_id: userData.user?.id,
          is_active: true,
        });

        if (insertError) {
          console.error('키 저장 오류:', insertError);
          throw insertError;
        }

        // 5. 상태 업데이트
        set({
          userKey: key,
          formattedKey: formattedKeyValue,
          user: userData.user,
          isAuthenticated: true,
          isRegisterLoading: false,
        });

        return true;
      } catch (error) {
        console.error('키 생성 및 저장 오류:', error);
        set({
          error: error as Error,
          isRegisterLoading: false,
        });
        return false;
      }
    },

    generateAnonymousKey: async () => {
      try {
        set({ isRegisterLoading: true, error: null });

        // 1. 랜덤 키 생성
        const key = generateRandomKey(16);
        const formattedKeyValue = formatKey(key);

        // 2. 사용자 생성 (익명 로그인)
        const { data: authData, error: authError } =
          await supabase.auth.signInAnonymously();

        if (authError) {
          throw authError;
        }

        // 3. 키 저장 (새로운 keys 테이블에)
        const { error: insertError } = await supabase.from('keys').insert({
          key: key,
          type: 'anonymous',
          user_id: authData.user?.id,
          is_active: true,
        });

        if (insertError) {
          console.error('키 저장 오류:', insertError);
          throw insertError;
        }

        // 4. 상태 업데이트
        set({
          userKey: key,
          formattedKey: formattedKeyValue,
          user: authData.user,
          isAuthenticated: true,
          isRegisterLoading: false,
        });

        // 5. 성공 반환
        return {
          success: true,
          key,
          formattedKey: formattedKeyValue,
        };
      } catch (error) {
        console.error('익명 키 생성 오류:', error);

        // 오류 발생 시에도 키는 생성해서 클라이언트에 반환
        const key = generateRandomKey(16);
        const formattedKeyValue = formatKey(key);

        set({
          userKey: key,
          formattedKey: formattedKeyValue,
          error: error as Error,
          isRegisterLoading: false,
        });

        return {
          success: true, // 프론트엔드에서는 성공으로 처리
          key,
          formattedKey: formattedKeyValue,
          warning:
            '백엔드 저장 과정에서 오류가 발생했지만 키는 생성되었습니다.',
        };
      }
    },

    loginWithSocial: async (provider: 'github' | 'google') => {
      // 이미 로딩 중이면 중복 실행 방지
      if (get().isLoginLoading) return;

      try {
        set({ isLoginLoading: true, error: null });

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            scopes: provider === 'github' ? 'google' : 'email profile',
          },
        });

        if (error) {
          console.error(`${provider} 로그인 실패:`, error);
          throw error;
        }

        console.log(`${provider} 로그인 시작됨`);
      } catch (error) {
        console.error(`${provider} 로그인 오류:`, error);
        set({ error: error as Error });
      }
    },

    // 로그아웃
    signOut: async () => {
      try {
        set({ isLogoutLoading: true });
        const { error } = await supabase.auth.signOut();

        if (error) throw error;

        // 상태 초기화
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          isLogoutLoading: false,
          // 키는 유지 (재로그인 가능하게)
        });

        return { success: true };
      } catch (error) {
        console.error('로그아웃 오류:', error);
        set({ error: error as Error, isLogoutLoading: false });
        return { success: false, error };
      }
    },

    createAnonymousUserWithEdgeFunction: async (
      key: string,
      clientIP: string,
    ) => {
      key = key.replace(/-/g, '').toUpperCase();
      set({ isRegisterLoading: true });

      const limitCheck = await checkCreationLimit(clientIP);
      if (!limitCheck.allowed) {
        set({ isRegisterLoading: false });
        return {
          success: false,
          error: limitCheck.error,
          code: 'RATE_LIMITED',
        };
      }

      try {
        const { data, error } = await supabase.functions.invoke(
          'create_anonymous_user',
          {
            body: { key },
          },
        );

        if (error) throw error;

        return { success: true, userId: data.userId };
      } catch (error) {
        console.error('Edge Function 호출 오류:', error);
        return { success: false, error: error as Error };
      } finally {
        set({ isRegisterLoading: false });
      }
    },

    createEmailUserWithEdgeFunction: async (
      email: string,
      key: string,
      clientIP: string,
    ) => {
      try {
        key = key.replace(/-/g, '').toUpperCase();

        const limitCheck = await checkCreationLimit(clientIP);
        if (!limitCheck.allowed) {
          return {
            success: false,
            error: limitCheck.error,
            code: 'RATE_LIMITED',
          };
        }

        // Supabase Edge Function 호출
        const { data, error } = await supabase.functions.invoke(
          'create_email_user',
          {
            body: { email, key },
          },
        );

        // 응답 디버깅
        console.log('Edge Function 응답:', { data, error });

        // 에러 처리
        if (error) {
          console.error('Edge Function 호출 오류:', error);

          // 오류 상태 코드 확인 (409는 이미 등록된 이메일)
          if (
            error.message &&
            error.message.toLowerCase().includes('already')
          ) {
            return {
              success: false,
              error: '이미 등록된 이메일입니다.',
              code: 'EMAIL_EXISTS',
            };
          }

          return {
            success: false,
            error: error.message || '알 수 없는 오류가 발생했습니다.',
            code: 'EDGE_FUNCTION_ERROR',
          };
        }

        // data가 null이거나 success가 false인 경우 확인
        if (!data || data.success === false) {
          console.warn('Edge Function 응답이 성공이 아님:', data);

          // data가 있지만 success가 false인 경우
          if (data && data.success === false) {
            return {
              success: false,
              error: data.error || '서버에서 오류가 발생했습니다.',
              code: data.code || 'SERVER_ERROR',
            };
          }

          return {
            success: false,
            error: '서버 응답이 올바르지 않습니다.',
            code: 'INVALID_RESPONSE',
          };
        }

        return { ...data, success: true };
      } catch (error) {
        console.error('Edge Function 호출 예외:', error);
        return {
          success: false,
          error: error.message || '알 수 없는 오류가 발생했습니다.',
          code: 'UNEXPECTED_ERROR',
        };
      }
    },
  })),
);
