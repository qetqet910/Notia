import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/services/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { generateRandomKey, formatKey } from '@/utils/keys';
import { Navigate } from 'react-router-dom';

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
  isLoading: boolean;
  isLoginLoading: boolean;
  isLogoutLoading: boolean;
  isSessionCheckLoading: boolean;
  isGeneratingKey: boolean;

  // 오류 상태
  error: Error | null;
}

interface UserProfile {
  user_id: string;
  display_name?: string | null;
  avatar_url?: string | null;
  email?: string | null;
  provider?: string;
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

  // 그룹 관련 메서드
  createGroup: (name: string) => Promise<any>;
  joinGroup: (key: string) => Promise<any>;

  // 세션 관리
  checkSession: () => Promise<boolean>;
  fetchUserProfile: (userId: string) => Promise<UserProfile | null>;
  restoreSession: () => Promise<boolean>;
  createAnonymousUserWithEdgeFunction: (key: string) => Promise<{
    success: boolean;
    userId?: User;
    error?: Error;
  }>;
}

// 로컬스토리지 키 가져오기 함수
const getAuthStorageKey = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return (
    'sb-' +
    supabaseUrl.replace('https://', '').replace('.supabase.co', '') +
    '-auth-token'
  );
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      userProfile: null,
      isAuthenticated: false,
      isLoading: false,
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

      // authStore.ts에 추가
      setSessionFromLocalStorage: async () => {
        try {
          console.log('로컬스토리지에서 세션 설정 시도');

          // 로컬스토리지에서 세션 데이터 가져오기
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const authKey =
            'sb-' +
            supabaseUrl.replace('https://', '').replace('.supabase.co', '') +
            '-auth-token';
          const storedSession = localStorage.getItem(authKey);

          if (!storedSession) {
            console.log('로컬스토리지에 세션 데이터 없음');
            return false;
          }

          // 세션 데이터 파싱
          const parsedSession = JSON.parse(storedSession);

          if (!parsedSession || !parsedSession.user) {
            console.log('유효하지 않은 세션 데이터');
            return false;
          }

          // 세션 설정
          set({
            user: parsedSession.user,
            session: parsedSession,
            isAuthenticated: true,
          });

          // 사용자 프로필 가져오기
          const profile = await get().fetchUserProfile(parsedSession.user.id);
          set({ userProfile: profile });

          console.log('로컬스토리지에서 세션 설정 성공');
          return true;
        } catch (error) {
          console.error('로컬스토리지에서 세션 설정 실패:', error);
          return false;
        }
      },

      fetchUserProfile: async (userId: string) => {
        try {
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (error) throw error;

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
          set({ isLoading: true, error: null });
          const cleanKey = key.replace(/-/g, '');

          // 디버깅 로그 (보안을 위해 키 일부만 표시)
          console.log('키 로그인 시도:', cleanKey.substring(0, 4) + '****');

          // 1. 키로 사용자 찾기
          const { data: userData, error: userError } = await supabase.rpc(
            'find_user_by_key',
            { key_value: cleanKey },
          );

          if (userError || !userData || userData.length === 0) {
            throw new Error('유효하지 않은 키입니다.');
          }

          // 2. 익명 로그인 (임시 세션 생성)
          const { data: authData, error: authError } =
            await supabase.auth.signInAnonymously();

          if (authError) {
            throw authError;
          }

          // 3. 사용자 메타데이터 업데이트
          await supabase.auth.updateUser({
            data: {
              original_user_id: userData[0].user_id,
              key_type: userData[0].key_type,
              key_login: true,
              login_method: 'key',
            },
          });

          // 4. 상태 업데이트
          set({
            userKey: cleanKey,
            formattedKey: formatKey(cleanKey),
            isAuthenticated: true,
            isLoading: false,
            user: authData.user,
          });

          return { success: true, user: authData.user, message: '로그인 성공' };
        } catch (error) {
          console.error('키 로그인 실패:', error);
          set({ error: error as Error, isLoading: false });
          return {
            success: false,
            message:
              error instanceof Error
                ? error.message
                : '로그인 중 오류가 발생했습니다.',
            error: error as Error,
          };
        }
      },

      generateEmailKey: async (email?: string) => {
        try {
          set({ isLoading: true, isGeneratingKey: true, error: null });

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
              .from('auth.users')
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
            isLoading: false,
            isGeneratingKey: false,
          });

          return true;
        } catch (error) {
          console.error('키 생성 및 저장 오류:', error);
          set({
            error: error as Error,
            isLoading: false,
            isGeneratingKey: false,
          });
          return false;
        }
      },

      generateAnonymousKey: async () => {
        try {
          set({ isLoading: true, isGeneratingKey: true, error: null });

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
            isLoading: false,
            isGeneratingKey: false,
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
            isLoading: false,
            isGeneratingKey: false,
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
        if (get().isLoginLoading) return;

        try {
          set({ isLoginLoading: true, error: null });

          const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
              redirectTo: `${window.location.origin}/auth/callback`,
            },
          });

          if (error) throw error;
        } catch (error) {
          console.error(`${provider} 로그인 오류:`, error);
          set({ error: error as Error });
        } finally {
          set({ isLoginLoading: false });
        }
      },

      createGroup: async (name: string) => {
        try {
          const userId = get().user?.id;
          if (!userId) {
            throw new Error('로그인이 필요합니다.');
          }

          // 그룹 키 생성
          const groupKey = generateRandomKey(8);

          // 그룹 생성
          const { data: group, error } = await supabase
            .from('user_groups')
            .insert({
              name,
              owner_id: userId,
              key: groupKey,
            })
            .select()
            .single();

          if (error) throw error;

          // 그룹 멤버 추가 (소유자)
          await supabase.from('group_members').insert({
            group_id: group.id,
            user_id: userId,
          });

          return { success: true, group, key: groupKey };
        } catch (error) {
          console.error('그룹 생성 오류:', error);
          return { success: false, error };
        }
      },

      joinGroup: async (groupKey: string) => {
        try {
          const userId = get().user?.id;
          if (!userId) {
            throw new Error('로그인이 필요합니다.');
          }

          // 그룹 찾기
          const { data: group, error: groupError } = await supabase
            .from('user_groups')
            .select('id')
            .eq('key', groupKey)
            .single();

          if (groupError || !group) {
            throw new Error('유효하지 않은 그룹 키입니다.');
          }

          // 이미 멤버인지 확인
          const { data: existingMember } = await supabase
            .from('group_members')
            .select('id')
            .eq('group_id', group.id)
            .eq('user_id', userId)
            .single();

          if (existingMember) {
            return { success: true, message: '이미 그룹 멤버입니다.', group };
          }

          // 그룹 멤버 추가
          const { error: joinError } = await supabase
            .from('group_members')
            .insert({
              group_id: group.id,
              user_id: userId,
            });

          if (joinError) throw joinError;

          return { success: true, message: '그룹에 참여했습니다.', group };
        } catch (error) {
          console.error('그룹 참여 오류:', error);
          return {
            success: false,
            error,
            message: error instanceof Error ? error.message : '알 수 없는 오류',
          };
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

      // Edge 함수로 익명 사용자 생성 (옵션)
      createAnonymousUserWithEdgeFunction: async (key: string) => {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();

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
        }
      },
    }),
    {
      name: getAuthStorageKey(), // 로컬 스토리지 키
      version: 1, // 버전 관리
      partialize: (state) => ({
        userKey: state.userKey,
        formattedKey: state.formattedKey,
      }), // 저장할 상태만 선택
    },
    // 로컬 스토리지에 저장할 상태 선택
  ),
);

// 이벤트 리스너에 가드 추가
let isProcessingAuthChange = false;
let lastAuthEvent = { event: null, time: 0 };

supabase.auth.onAuthStateChange((event, session) => {
  // 이벤트 디바운싱 - 같은 이벤트가 짧은 시간 내에 반복되는 경우 무시
  const now = Date.now();
  if (lastAuthEvent.event === event && now - lastAuthEvent.time < 1000) {
    return;
  }

  // 이벤트 정보 업데이트
  lastAuthEvent = {
    event,
    time: now,
  };

  // 이미 처리 중인 경우 중복 처리 방지
  if (isProcessingAuthChange) {
    return;
  }

  // 처리 시작
  isProcessingAuthChange = true;

  try {
    if (session) {
      // 세션이 있으면 인증 상태 업데이트
      useAuthStore.setState({
        user: session.user,
        session: session,
        isAuthenticated: true,
      });

      // 사용자 프로필 가져오기
      useAuthStore
        .getState()
        .fetchUserProfile(session.user.id)
        .then((profile) => {
          useAuthStore.setState({ userProfile: profile });
        });
    } else if (event === 'SIGNED_OUT') {
      // 로그아웃 이벤트인 경우 상태 초기화
      useAuthStore.setState({
        user: null,
        session: null,
        isAuthenticated: false,
        userProfile: null,
      });
    }
  } finally {
    // 일정 시간 후에 처리 플래그 해제
    setTimeout(() => {
      isProcessingAuthChange = false;
    }, 100);
  }
});
