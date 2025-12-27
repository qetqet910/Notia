import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/services/supabaseClient';
import type { User, Session } from '@supabase/supabase-js';
import type { UserProfile } from '@/types';
import { formatKey } from '@/utils/keyValidation';
import { checkCreationLimit } from '@/utils/kegisterValidation';
import { guideNoteContent } from '@/constants/basicNote';
import { useDataStore } from '@/stores/dataStore';
import { parseNoteContent } from '@/utils/noteParser'; // 올바른 파서 import

// --- Zustand Store ---

interface AuthState {
  user: User | null;
  session: Session | null;
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
  setUserKey: (key: string | null) => void;
  setFormattedKey: (key: string | null) => void;
  setUser: (user: User | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setError: (error: Error | null) => void;
  clearState: () => void;
  clearUserKey: () => void;
  loginWithKey: (key: string) => Promise<{
    success: boolean;
    message?: string;
    user?: User | null;
    error?: Error | null;
  }>;
  loginWithSocial: (provider: 'github' | 'google') => Promise<void>;
  signOut: () => Promise<{ success: boolean; error?: Error | null }>;
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
    user?: User;
    error?: string;
    code?: string;
  }>;
  createEmailUserWithEdgeFunction: (
    email: string,
    key: string,
    clientIP: string,
  ) => Promise<{
    success: boolean;
    user?: User;
    error?: string;
    code?: string;
  }>;
  updateTermsAgreement: () => Promise<{
    success: boolean;
    error?: Error | null;
  }>;
  deleteAccount: () => Promise<{
    success: boolean;
    error?: Error | null;
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
      isSessionCheckLoading: true,
      isProfileLoading: true,
      isTermsLoading: false,
      userKey: null,
      formattedKey: null,
      error: null,

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
          userProfile: null,
        }),
      clearUserKey: () => set({ userKey: null }),

      deleteAccount: async () => {
        set({ isLogoutLoading: true }); // Reuse logout loading state or add new one
        try {
          const { error } = await supabase.functions.invoke('delete_account');
          if (error) throw error;

          // If successful, sign out to clear local state
          
          await get().signOut();
          return { success: true };
        } catch (error) {
          console.error('계정 삭제 오류:', error);
          set({ error: error as Error });
          return { success: false, error: error as Error };
        } finally {
          set({ isLogoutLoading: false });
        }
      },

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
            set({ user: session.user, session, isAuthenticated: true });
            await get().fetchUserProfile(session.user.id);
            return true;
          } else {
            set({
              user: null,
              session: null,
              isAuthenticated: false,
              userProfile: null,
            });
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
            .maybeSingle();

          if (error) {
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

      restoreSession: async () => {
        try {
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();
          if (error) throw error;

          if (session) {
            set({ user: session.user, session, isAuthenticated: true });
            await get().fetchUserProfile(session.user.id);
          } else {
            set({
              user: null,
              session: null,
              isAuthenticated: false,
              userProfile: null,
            });
          }
        } catch (error) {
          console.error('세션 복원 오류:', error);
          set({
            error: error as Error,
            isAuthenticated: false,
            user: null,
            session: null,
            userProfile: null,
          });
        } finally {
          set({ isSessionCheckLoading: false, isProfileLoading: false });
        }
        return false;
      },

      loginWithKey: async (key: string) => {
        set({ isLoginLoading: true, error: null });
        try {
          const cleanKey = key.replace(/-/g, '').toUpperCase();
          const { data: keyCheckData, error: keyCheckError } =
            await supabase.functions.invoke('login_with_key', {
              body: { key: cleanKey },
            });

          if (keyCheckError || !keyCheckData?.success) {
            return {
              success: false,
              message: keyCheckData?.error || '유효하지 않은 키입니다.',
            };
          }

          if (keyCheckData.email) {
            const { data, error } = await supabase.auth.signInWithPassword({
              email: keyCheckData.email,
              password: cleanKey,
            });

            if (error) {
              return {
                success: false,
                message: '유효하지 않은 키입니다. 다시 확인해 주세요.',
              };
            }

            if (data.user) {
              set({
                user: data.user,
                session: data.session,
                isAuthenticated: true,
                userKey: cleanKey,
                formattedKey: formatKey(cleanKey),
              });
              await get().fetchUserProfile(data.user.id);
              return { success: true, message: '로그인 성공', user: data.user };
            }
          }

          return {
            success: false,
            message:
              '로그인에 실패했습니다. 키와 연결된 이메일을 찾을 수 없습니다.',
          };
        } catch (error) {
          console.error('로그인 중 오류 발생:', error);
          const message =
            error instanceof Error
              ? error.message
              : '로그인 중 오류가 발생했습니다.';
          set({ error: error as Error });
          return {
            success: false,
            message,
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
          const redirectTo = `${window.location.origin}/auth/callback`;
          const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: { redirectTo },
          });
          if (error) throw error;
        } catch (error) {
          console.error(`${provider} 로그인 오류:`, error);
          set({ isLoginLoading: false, isRegisterLoading: false });
        }
      },

      signOut: async () => {
        set({ isLogoutLoading: true });
        let result: { success: boolean; error?: Error | null } = { success: true };
        try {
          await supabase.auth.signOut();
        } catch {
          console.warn('로그아웃 API 호출 중 오류 (로컬 상태는 초기화됩니다)');
          result = { success: false, error: new Error('Logout failed') };
        } finally {
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            userProfile: null,
            userKey: null,
            formattedKey: null,
            isLogoutLoading: false,
          });
        }
        return result;
      },

      createAnonymousUserWithEdgeFunction: async (
        key: string,
        clientIP: string,
      ) => {
        set({ isRegisterLoading: true, error: null });
        try {
          const limitCheck = await get().checkCreationLimit(clientIP);
          if (!limitCheck.allowed) {
            return {
              success: false,
              error: limitCheck.error,
              code: 'RATE_LIMITED',
            };
          }

          const { data, error } = await supabase.functions.invoke(
            'create_anonymous_user',
            {
              body: { key: key.replace(/-/g, '').toUpperCase(), clientIP },
            },
          );

          if (error) throw error;

          if (data.user) {
            set({
              userKey: key,
              formattedKey: formatKey(key),
            });
            // Auto-login removed per user request. User must verify key manually.
            return { success: true, user: data.user };
          }
          return {
            success: false,
            error: '사용자 정보가 반환되지 않았습니다.',
            code: 'NO_USER_DATA',
          };
        } catch (error) {
          console.error('익명 사용자 생성 중 오류:', error);
          const code =
            error && typeof error === 'object' && 'code' in error
              ? String(error.code)
              : 'UNEXPECTED_ERROR';
          return {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : '알 수 없는 오류가 발생했습니다.',
            code,
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
        set({ isRegisterLoading: true, error: null });
        try {
          const limitCheck = await get().checkCreationLimit(clientIP);
          if (!limitCheck.allowed) {
            return {
              success: false,
              error: limitCheck.error,
              code: 'RATE_LIMITED',
            };
          }

          const { data, error } = await supabase.functions.invoke(
            'create_email_user',
            {
              body: {
                email,
                key: key.replace(/-/g, '').toUpperCase(),
                clientIP,
              },
            },
          );

          if (error || !data?.success) {
            return {
              success: false,
              error: data?.error || '이메일 사용자 생성에 실패했습니다.',
              code: data?.code || 'UNEXPECTED_ERROR',
            };
          }

          if (data.user) {
            set({
              userKey: key,
              formattedKey: formatKey(key),
            });
            // Auto-login removed per user request.
            return { success: true, user: data.user };
          }
          return {
            success: false,
            error: '사용자 정보가 반환되지 않았습니다.',
            code: 'NO_USER_DATA',
          };
        } catch (error) {
          console.error('이메일 사용자 생성 중 오류:', error);
          const code =
            error && typeof error === 'object' && 'code' in error
              ? String(error.code)
              : 'UNEXPECTED_ERROR';
          return {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : '알 수 없는 오류가 발생했습니다.',
            code,
          };
        } finally {
          set({ isRegisterLoading: false });
        }
      },

      updateTermsAgreement: async () => {
        set({ isTermsLoading: true });
        try {
          const { user, userProfile } = get();
          if (!user || !userProfile) {
            return {
              success: false,
              error: new Error('User not authenticated'),
            };
          }

          const { error: termsError } = await supabase
            .from('users')
            .update({ terms_agreed: true })
            .eq('id', user.id);

          if (termsError) {
            return { success: false, error: termsError };
          }

          set({ userProfile: { ...userProfile, terms_agreed: true } });

          // 중앙화된 파서 사용
          const { tags, reminders } = parseNoteContent(guideNoteContent);
          const remindersToCreate = reminders
            .filter((r) => r.parsedDate)
            .map((r) => ({
              text: r.reminderText!,
              original_text: r.originalText,
              date: r.parsedDate!,
              completed: false,
              enabled: true,
            }));

          useDataStore.getState().createNote({
            owner_id: user.id,
            title: '🎉 NOTIA 에 오신 것을 환영합니다! 🎉',
            content: guideNoteContent,
            tags: tags.map((t) => t.text),
            reminders: remindersToCreate,
          });

          return { success: true };
        } catch (error) {
          console.error(
            'Error updating terms agreement and creating guide note:',
            error,
          );
          return { success: false, error: error as Error };
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
        if (state) {
          state.restoreSession();
        }
      },
    },
  ),
);
