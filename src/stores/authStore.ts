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
  isProfileLoading: boolean;
  isTermsLoading: boolean;

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
    termsAgreed: boolean,
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
    termsAgreed: boolean,
  ) => Promise<{
    success: boolean;
    user?: User; // Edge Function에서 반환하는 user 객체
    error?: string;
    code?: string;
  }>;
  updateTermsAgreement: () => Promise<{ success: boolean; error?: any }>;
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
      isSessionCheckLoading: true, // 앱 시작 시 항상 세션 체크를 하므로 true로 시작
      isProfileLoading: true, // 프로필 로딩도 함께 시작
      isTermsLoading: false,
      userKey: null,
      formattedKey: null,
      error: null,

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
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) throw error;

          if (session) {
            set({ user: session.user, session, isAuthenticated: true });
            await get().fetchUserProfile(session.user.id);
            return true;
          } else {
            set({ user: null, session: null, isAuthenticated: false, userProfile: null });
            return false;
          }
        } catch (error) {
          console.error('세션 확인 오류:', error);
          set({ error: error as Error, isAuthenticated: false });
          return false;
        } finally {
          set({ isSessionCheckLoading: false });
        }
      },

      fetchUserProfile: async (userId: string) => {
        try {
          set({ isProfileLoading: true });
          const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

          if (error) {
            // 'No rows found'는 에러가 아니라 프로필이 아직 없는 상태일 수 있음
            if (error.code === 'PGRST116') {
              set({ userProfile: null });
              return null;
            }
            throw error;
          }

          set({ userProfile: profile });
          return profile;
        } catch (error) {
          console.error('프로필 조회 오류:', error);
          set({ error: error as Error, userProfile: null });
          return null;
        } finally {
          set({ isProfileLoading: false });
        }
      },

      // 세션 복원
      restoreSession: async () => {
        try {
          // onRehydrateStorage는 isSessionCheckLoading의 초기값인 true를 그대로 사용합니다.
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) throw error;

          if (session) {
            set({ user: session.user, session, isAuthenticated: true });
            // fetchUserProfile이 isProfileLoading을 관리합니다.
            await get().fetchUserProfile(session.user.id);
          } else {
            // 세션이 없으면, 인증되지 않은 상태로 확정합니다.
            set({ user: null, session: null, isAuthenticated: false, userProfile: null });
          }
        } catch (error) {
          console.error('세션 복원 오류:', error);
          // 오류 발생 시에도 인증되지 않은 상태로 확정합니다.
          set({
            error: error as Error,
            isAuthenticated: false,
            user: null,
            session: null,
            userProfile: null,
          });
        } finally {
          // 어떤 경우에도 세션 확인과 프로필 로딩 상태를 false로 설정하여 로딩을 종료합니다.
          set({ isSessionCheckLoading: false, isProfileLoading: false });
        }
        return false; // 반환값은 중요하지 않습니다.
      },

      loginWithKey: async (key: string) => {
        set({ isLoginLoading: true, error: null });
        try {
          const cleanKey = key.replace(/-/g, '').toUpperCase();
          const { data: keyCheckData, error: keyCheckError } = await supabase.functions.invoke('login_with_key', {
            body: { key: cleanKey },
          });

          if (keyCheckError || !keyCheckData?.success) {
            throw new Error(keyCheckData?.error || '유효하지 않은 키입니다.');
          }

          if (keyCheckData.email) {
            const { data, error } = await supabase.auth.signInWithPassword({
              email: keyCheckData.email,
              password: cleanKey,
            });

            if (error) throw error;

            if (data.user) {
              set({
                user: data.user,
                session: data.session,
                isAuthenticated: true,
                userKey: cleanKey,
                formattedKey: formatKey(cleanKey),
              });
              await get().fetchUserProfile(data.user.id);
            }
            return { success: true, message: '로그인 성공', user: data.user };
          } else {
            throw new Error('이메일 정보가 없습니다.');
          }
        } catch (error) {
          console.error('로그인 중 오류 발생:', error);
          set({ error: error as Error });
          return {
            success: false,
            message: error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다.',
            error: error as Error,
          };
        } finally {
          set({ isLoginLoading: false });
        }
      },

      loginWithSocial: async (provider: 'github' | 'google') => {
        if (get().isLoginLoading) return;
        set({ isLoginLoading: true, isRegisterLoading: true });
        try {
          const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: { redirectTo: `${window.location.origin}/auth/callback` },
          });
          if (error) throw error;
        } catch (error) {
          console.error(`${provider} 로그인 오류:`, error);
          set({ isLoginLoading: false, isRegisterLoading: false });
        }
      },

      signOut: async () => {
        set({ isLogoutLoading: true });
        try {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            userProfile: null,
            userKey: null,
            formattedKey: null,
          });
          return { success: true };
        } catch (error) {
          console.error('로그아웃 오류:', error);
          set({ error: error as Error });
          return { success: false, error };
        } finally {
          set({ isLogoutLoading: false });
        }
      },

      createAnonymousUserWithEdgeFunction: async (key: string, clientIP: string, termsAgreed: boolean) => {
        set({ isRegisterLoading: true, error: null });
        try {
          const limitCheckResult = await checkCreationLimit(clientIP);
          if (!limitCheckResult.allowed) {
            return { success: false, error: limitCheckResult.error, code: 'RATE_LIMITED' };
          }

          const { data, error } = await supabase.functions.invoke('create_anonymous_user', {
            body: { key: key.replace(/-/g, '').toUpperCase(), terms_agreed: termsAgreed },
          });

          if (error || !data?.success) {
            throw new Error(data?.error || '익명 사용자 생성에 실패했습니다.');
          }

          if (data.user) {
            set({
              user: data.user,
              session: data.session || null,
              userKey: key,
              formattedKey: formatKey(key),
            });
            await get().fetchUserProfile(data.user.id);
            return { success: true, user: data.user };
          }
          return { success: false, error: '사용자 정보가 반환되지 않았습니다.', code: 'NO_USER_DATA' };
        } catch (error) {
          console.error('익명 사용자 생성 중 오류:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
            code: 'UNEXPECTED_ERROR',
          };
        } finally {
          set({ isRegisterLoading: false });
        }
      },

      createEmailUserWithEdgeFunction: async (email: string, key: string, clientIP: string, termsAgreed: boolean) => {
        set({ isRegisterLoading: true, error: null });
        try {
          const limitCheckResult = await checkCreationLimit(clientIP);
          if (!limitCheckResult.allowed) {
            return { success: false, error: limitCheckResult.error, code: 'RATE_LIMITED' };
          }

          const { data, error } = await supabase.functions.invoke('create_email_user', {
            body: { email, key: key.replace(/-/g, '').toUpperCase(), terms_agreed: termsAgreed },
          });

          if (error || !data?.success) {
            throw new Error(data?.error || '이메일 사용자 생성에 실패했습니다.');
          }

          if (data.user) {
            set({
              user: data.user,
              session: data.session || null,
              userKey: key,
              formattedKey: formatKey(key),
            });
            await get().fetchUserProfile(data.user.id);
            return { success: true, user: data.user };
          }
          return { success: false, error: '사용자 정보가 반환되지 않았습니다.', code: 'NO_USER_DATA' };
        } catch (error) {
          console.error('이메일 사용자 생성 중 오류:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
            code: 'UNEXPECTED_ERROR',
          };
        } finally {
          set({ isRegisterLoading: false });
        }
      },

      updateTermsAgreement: async () => {
        set({ isTermsLoading: true });
        try {
          const { user } = get();
          if (!user) throw new Error('User not authenticated');

          const { error } = await supabase
            .from('users')
            .update({ terms_agreed: true })
            .eq('id', user.id);

          if (error) throw error;

          // 중요: DB 업데이트 후, 스토어의 프로필을 확실하게 다시 불러옵니다.
          await get().fetchUserProfile(user.id);
          
          return { success: true };
        } catch (error) {
          console.error('Error updating terms agreement:', error);
          return { success: false, error };
        } finally {
          set({ isTermsLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        userKey: state.userKey,
        formattedKey: state.formattedKey,
      }),
      onRehydrateStorage: () => (state) => {
        // Zustand v4.5.1 기준, onRehydrateStorage는 (state, error)를 인자로 받는 함수를 반환할 수 있습니다.
        // 앱이 로드될 때 세션 복원을 단 한 번만 실행합니다.
        state?.restoreSession();
      },
    },
  ),
);
