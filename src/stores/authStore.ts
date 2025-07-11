import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/services/supabaseClient';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '@/types';
import { formatKey } from '@/utils/keyValidation';
import { checkCreationLimit } from '@/utils/kegisterValidation';

interface AuthState {
  user: User | null;
  session: any | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;

  userKey: string | null;
  formattedKey: string | null;

  isRegisterLoading: boolean;
  isLoginLoading: boolean;
  isLogoutLoading: boolean;
  isSessionCheckLoading: boolean;

  error: Error | null;
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
    user?: User; // Edge Function에서 반환하는 user 객체
    error?: string;
    code?: string;
  }>;
  createEmailUserWithEdgeFunction: (
    email: string,
    key: string,
    clientIP: string,
  ) => Promise<{
    success: boolean;
    user?: User; // Edge Function에서 반환하는 user 객체
    error?: string;
    code?: string;
  }>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
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
          userProfile: null, // userProfile도 초기화
        }),
      clearUserKey: () => set({ userKey: null }),

      checkCreationLimit: async (clientIP: string) => {
        return await checkCreationLimit(clientIP);
      },

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
            // 세션 확인 시에도 사용자 프로필을 가져오도록 추가
            if (session.user) {
              await get().fetchUserProfile(session.user.id);
            }
            return true;
          } else {
            set({
              user: null,
              session: null,
              isAuthenticated: false,
              userProfile: null, // 세션 없으면 프로필도 초기화
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
          const currentUser = get().user; // 현재 user 상태를 가져옴

          if (
            currentUser &&
            currentUser.app_metadata?.provider &&
            currentUser.app_metadata.provider !== 'email' &&
            !currentUser.email?.startsWith('anon_')
          ) {
            set({ userProfile: null });
            return null; // 조회를 건너뛰고 일찍 종료
          }

          // 커스텀 사용자 테이블 조회
          const { data: profile, error } = await supabase
            .from('users') // 'users' 테이블 이름 확인
            .select('*')
            .eq('id', userId) // 사용자 테이블의 id 필드를 기준으로 조회
            .single();

          if (error) {
            console.error('프로필 조회 오류:', error);
            // 프로필이 없는 경우 (No rows found)에도 에러를 throw하지 않고 null을 반환하도록 처리
            // Supabase의 single() 쿼리에서 결과가 없을 때 발생하는 특정 오류 코드입니다.
            if (error.code === 'PGRST116') {
              set({ userProfile: null }); // userProfile을 null로 설정하여 프로필이 없음을 나타냄
              return null;
            }
            throw error; // 다른 유형의 오류는 여전히 throw
          }

          if (profile) {
            set({ userProfile: profile });
            return profile;
          }

          return null;
        } catch (error) {
          console.error('프로필 조회 오류:', error);
          set({ error: error as Error });
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

          // Edge Function을 통해 키 검증 및 사용자 정보 가져오기
          const { data: keyCheckData, error: keyCheckError } =
            await supabase.functions.invoke('login_with_key', {
              body: { key: cleanKey },
            });

          // 키 검증 실패 시 즉시 오류 반환
          if (keyCheckError) {
            throw keyCheckError;
          }
          if (!keyCheckData || !keyCheckData.success) {
            throw new Error(keyCheckData?.error || '유효하지 않은 키입니다.');
          }

          // Supabase auth.signInWithPassword를 사용하여 실제 로그인
          if (keyCheckData.email) {
            const { data, error } = await supabase.auth.signInWithPassword({
              email: keyCheckData.email,
              password: cleanKey, // 키를 비밀번호로 사용
            });

            if (error) {
              console.error('클라이언트: 로그인 실패:', error);
              throw error;
            }

            if (data.user) {
              set({
                user: data.user,
                session: data.session,
                isAuthenticated: true,
                userKey: cleanKey,
                formattedKey: formatKey(cleanKey),
              });
              // 로그인 성공 후 사용자 프로필 가져오기
              await get().fetchUserProfile(data.user.id);
            }

            return {
              success: true,
              message: '로그인 성공',
              user: data.user,
            };
          } else {
            throw new Error('이메일 정보가 없습니다.');
          }
        } catch (error) {
          console.error('로그인 중 오류 발생:', error);
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
          set({ isLoginLoading: false });
        }
      },

      loginWithSocial: async (provider: 'github' | 'google') => {
        // 이미 로딩 중이면 중복 실행 방지
        if (get().isLoginLoading) return;

        try {
          set({ isLoginLoading: true, isRegisterLoading: true });

          const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
              redirectTo: `${window.location.origin}/auth/callback`,
              scopes: provider === 'google' ? 'email profile' : undefined,
              // Google의 경우 'email profile' 스코프는 기본적으로 사용자 정보를 가져옴.
              // GitHub의 경우 일반적으로 추가 스코프가 필요 없음.
            },
          });

          if (error) {
            console.error(`${provider} 로그인 실패:`, error);
            throw error;
          }
        } catch (error) {
          console.error(`${provider} 로그인 오류:`, error);
          set({ isLoginLoading: false, isRegisterLoading: false });
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
            userProfile: null, // 로그아웃 시 프로필도 초기화
            userKey: null, // 키도 초기화 (다시 로그인해야 함)
            formattedKey: null,
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
        set({ isRegisterLoading: true, error: null });

        const limitCheckResult = await checkCreationLimit(clientIP); // checkCreationLimit 함수 사용
        if (!limitCheckResult.allowed) {
          set({ isRegisterLoading: false });
          return {
            success: false,
            error: limitCheckResult.error,
            code: 'RATE_LIMITED',
          };
        }

        try {
          // Edge Function 호출
          const { data, error: edgeFunctionError } =
            await supabase.functions.invoke('create_anonymous_user', {
              body: { key },
            });

          // Edge Function 자체에서 발생한 오류 처리
          if (edgeFunctionError) {
            console.error('Edge Function 호출 오류:', edgeFunctionError);
            // 호출 오류 발생 시 명시적인 에러 객체 반환
            return {
              success: false,
              error:
                edgeFunctionError.message ||
                'Edge Function 호출 중 알 수 없는 오류가 발생했습니다.',
              code: 'EDGE_FUNCTION_INVOKE_ERROR',
            };
          }

          // data가 null 또는 undefined인지 먼저 확인
          if (data === null || data === undefined) {
            console.warn(
              'Edge Function이 유효한 응답을 반환하지 않았습니다 (data is null/undefined).',
            );
            return {
              success: false,
              error: 'Edge Function에서 유효한 응답을 받지 못했습니다.',
              code: 'EMPTY_EDGE_FUNCTION_RESPONSE',
            };
          }

          // 이제 data.success에 안전하게 접근
          if (data.success === false) {
            console.warn('Edge Function 응답이 성공이 아님:', data);
            return {
              success: false,
              error: data.error || '서버 응답이 올바르지 않습니다.',
              code: data.code || 'SERVER_ERROR',
            };
          }

          // 성공적으로 user가 생성되었다면 authStore 상태 업데이트 및 프로필 가져오기
          if (data.user) {
            set({
              user: data.user,
              session: data.session || null, // 세션이 없을 수 있으므로 null 처리
              userKey: key,
              formattedKey: formatKey(key),
            });
            await get().fetchUserProfile(data.user.id);
            return { success: true, user: data.user };
          } else {
            return {
              success: false,
              error: '사용자 정보가 반환되지 않았습니다.',
              code: 'NO_USER_DATA',
            };
          }
        } catch (error) {
          console.error('익명 사용자 생성 중 오류:', error);
          return {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : '알 수 없는 오류가 발생했습니다.',
            code: 'UNEXPECTED_ERROR',
          };
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
          set({ isRegisterLoading: true, error: null });

          const limitCheckResult = await checkCreationLimit(clientIP); // checkCreationLimit 함수 사용
          if (!limitCheckResult.allowed) {
            set({ isRegisterLoading: false });
            return {
              success: false,
              error: limitCheckResult.error,
              code: 'RATE_LIMITED',
            };
          }

          // Supabase Edge Function 호출
          const { data, error: edgeFunctionError } =
            await supabase.functions.invoke('create_email_user', {
              body: { email, key },
            });

          // Edge Function 자체에서 발생한 오류 처리
          if (edgeFunctionError) {
            console.error('Edge Function 호출 오류:', edgeFunctionError);
            // 호출 오류 발생 시 명시적인 에러 객체 반환
            return {
              success: false,
              error:
                edgeFunctionError.message ||
                'Edge Function 호출 중 알 수 없는 오류가 발생했습니다.',
              code: 'EDGE_FUNCTION_INVOKE_ERROR',
            };
          }

          // data가 null 또는 undefined인지 먼저 확인
          if (data === null || data === undefined) {
            console.warn(
              'Edge Function이 유효한 응답을 반환하지 않았습니다 (data is null/undefined).',
            );
            return {
              success: false,
              error: 'Edge Function에서 유효한 응답을 받지 못했습니다.',
              code: 'EMPTY_EDGE_FUNCTION_RESPONSE',
            };
          }

          // 이제 data.success에 안전하게 접근
          if (data.success === false) {
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

          // 성공적으로 user가 생성되었다면 authStore 상태 업데이트 및 프로필 가져오기
          // Edge Function이 user 객체를 직접 반환하므로 이를 사용
          if (data.user) {
            set({
              user: data.user,
              session: data.session || null, // 세션이 없을 수 있으므로 null 처리
              userKey: key,
              formattedKey: formatKey(key),
            });
            await get().fetchUserProfile(data.user.id);
            return { success: true, user: data.user };
          } else {
            return {
              success: false,
              error: '사용자 정보가 반환되지 않았습니다.',
              code: 'NO_USER_DATA',
            };
          }
        } catch (error) {
          console.error('이메일 사용자 생성 중 오류:', error);
          return {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : '알 수 없는 오류가 발생했습니다.',
            code: 'UNEXPECTED_ERROR',
          };
        } finally {
          set({ isRegisterLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage', // localstorage에 저장될 때 사용될 이름
      partialize: (state) => ({
        userKey: state.userKey,
        formattedKey: state.formattedKey,
        // user와 session은 보안상 localstorage에 직접 저장하지 않거나 신중하게 다뤄야 함
        // 여기서는 session check 시 다시 가져오도록 함
      }),
      // user와 session은 hydration 시 다시 로드하도록 처리
      onRehydrateStorage: (state) => {
        return (state) => {
          if (state) {
            // 세션 복원 로직 호출
            state.restoreSession();
          }
        };
      },
    },
  ),
);
