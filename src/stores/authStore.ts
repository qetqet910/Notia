import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/services/supabaseClient';
import type { User, Session } from '@supabase/supabase-js';
import type { UserProfile } from '@/types';
import { formatKey } from '@/utils/keyValidation';
import { checkCreationLimit } from '@/utils/kegisterValidation';

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
  signOut: () => Promise<{ success: boolean; error?: Error | null }>;

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
  updateTermsAgreement: () => Promise<{
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
          const {
            data: { session },
            error,
          } = await supabase.auth.getSession();
          if (error) throw error;

          if (session) {
            set({ user: session.user, session, isAuthenticated: true });
            // fetchUserProfile이 isProfileLoading을 관리합니다.
            await get().fetchUserProfile(session.user.id);
          } else {
            // 세션이 없으면, 인증되지 않은 상태로 확정합니다.
            set({
              user: null,
              session: null,
              isAuthenticated: false,
              userProfile: null,
            });
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

          // 1. Edge Function을 호출하여 키에 해당하는 이메일을 가져옵니다.
          const { data: keyCheckData, error: keyCheckError } =
            await supabase.functions.invoke('login_with_key', {
              body: { key: cleanKey },
            });

          if (keyCheckError || !keyCheckData?.success) {
            throw new Error(keyCheckData?.error || '유효하지 않은 키입니다.');
          }

          if (keyCheckData.email) {
            // 2. 받아온 이메일과 키로 로그인을 시도합니다.
            const { data, error } = await supabase.auth.signInWithPassword({
              email: keyCheckData.email,
              password: cleanKey,
            });

            if (error)
              throw new Error('유효하지 않은 키입니다. 다시 확인해 주세요.');

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

          throw new Error(
            '로그인에 실패했습니다. 키와 연결된 이메일을 찾을 수 없습니다.',
          );
        } catch (error) {
          console.error('로그인 중 오류 발생:', error);
          set({ error: error as Error });
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
          return { success: false, error: error as Error };
        } finally {
          set({ isLogoutLoading: false });
        }
      },

      createAnonymousUserWithEdgeFunction: async (
        key: string,
        clientIP: string,
      ) => {
        set({ isRegisterLoading: true, error: null });
        try {
          const { data, error } = await supabase.functions.invoke(
            'create_anonymous_user',
            {
              body: { key: key.replace(/-/g, '').toUpperCase(), clientIP },
            },
          );

          if (error || !data?.success) {
            const errorMessage =
              data?.error || '익명 사용자 생성에 실패했습니다.';
            const errorCode = data?.code || 'UNEXPECTED_ERROR';
            // 에러 객체를 생성하여 code 속성을 포함시킵니다.
            const customError = new Error(errorMessage);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (customError as any).code = errorCode;
            throw customError;
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
          return {
            success: false,
            error: '사용자 정보가 반환되지 않았습니다.',
            code: 'NO_USER_DATA',
          };
        } catch (error) {
          console.error('익명 사용자 생성 중 오류:', error);
          return {
            success: false,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            error:
              error instanceof Error
                ? error.message
                : '알 수 없는 오류가 발생했습니다.',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            code: (error as any)?.code || 'UNEXPECTED_ERROR',
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
            const errorMessage =
              data?.error || '이메일 사용자 생성에 실패했습니다.';
            const errorCode = data?.code || 'UNEXPECTED_ERROR';
            // 에러 객체를 생성하여 code 속성을 포함시킵니다.
            const customError = new Error(errorMessage);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (customError as any).code = errorCode;
            throw customError;
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
          return {
            success: false,
            error: '사용자 정보가 반환되지 않았습니다.',
            code: 'NO_USER_DATA',
          };
        } catch (error) {
          console.error('이메일 사용자 생성 중 오류:', error);
          return {
            success: false,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            error:
              error instanceof Error
                ? error.message
                : '알 수 없는 오류가 발생했습니다.',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            code: (error as any)?.code || 'UNEXPECTED_ERROR',
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

          // 1. 약관 동의 업데이트
          const { error: termsError } = await supabase
            .from('users')
            .update({ terms_agreed: true })
            .eq('id', user.id);

          if (termsError) throw termsError;

          // 2. 가이드 노트 생성
          const guideNoteContent = `# Notia에 오신 것을 환영합니다!

Notia는 여러분의 생각을 정리하고, 일정을 관리하며, 생산성을 높일 수 있도록 도와주는 똑똑한 노트 앱입니다.

## 주요 기능 🚀

### 1. 스마트 리마인더
- 노트 내용에 '@' 기호를 사용하여 간편하게 리마인더를 설정해보세요.
- 예시: \`@내일 오후 3시 프로젝트 보고서 제출하기.\`
- Notia가 자동으로 시간을 인식하여 캘린더에 추가하고, 시간에 맞춰 알림을 보내드립니다.

### 2. 자동 태그 분류
- # 기호로 노트를 쉽게 분류하고 관리하세요.
- 예시: \`#프로젝트 \`#아이디어 \`#회의록
- 태그를 클릭하면 해당 태그가 포함된 모든 노트를 한눈에 볼 수 있습니다.

### 3. 마크다운 지원
- 직관적인 마크다운 문법으로 서식이 풍부한 노트를 작성할 수 있습니다.
- \`**굵게**\`, \`*기울임꼴*\`, \`\`\`코드 블록\`\`\`, - 목록, [ ] 체크리스트 등 다양한 기능을 활용해보세요.

### 4. 팀 스페이스 (출시 예정)
- 팀을 만들어 동료들과 노트를 공유하고 함께 작업하는 기능이 곧 추가될 예정입니다.

## 시작하기

이 가이드 노트를 자유롭게 수정하거나 삭제하고, 여러분의 첫 노트를 작성해보세요!

**궁금한 점이 있다면 언제든지 '도움말' 페이지를 참고해주세요.**

Notia와 함께 생산적인 하루를 만들어보세요! 🌟`;

          const guideNote = {
            owner_id: user.id,
            title: '🎉 NOTIA 에 오신 것을 환영합니다! 🎉',
            content: guideNoteContent,
            tags: ['가이드'],
          };

          const { error: noteError } = await supabase
            .from('notes')
            .insert(guideNote);
          if (noteError) throw noteError;

          // 3. 스토어의 프로필을 확실하게 다시 불러옵니다.
          await get().fetchUserProfile(user.id);

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
