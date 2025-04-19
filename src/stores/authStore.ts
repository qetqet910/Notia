import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/services/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { generateRandomKey, formatKey } from '@/utils/keys';
import { Navigate } from 'react-router-dom';

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  userKey: string | null;
  formattedKey: string | null;
  error: Error | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isLoginLoading: boolean;
  isLogoutLoading: boolean;
  isSessionCheckLoading: boolean;
  isGeneratingKey: boolean | null;

  setUserKey: (key: string | null) => void;
  setFormattedKey: (key: string | null) => void;
  setUser: (user: User | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  clearState: () => void;
}

interface UserProfile {
  user_id: string;
  display_name?: string | null;
  avatar_url?: string | null;
  email?: string | null;
  provider?: string;
}

interface AuthStore extends AuthState {
  // Auth methods
  loginWithKey: (key: string) => Promise<{
    success: boolean;
    message?: string;
  }>;
  generateAndStoreKey: (email?: string) => Promise<boolean>;
  generateAnonymousKey: () => Promise<{
    success: boolean;
    key: string;
    formattedKey: string;
  }>;
  loginWithSocial: (provider: 'github' | 'google') => Promise<void>;
  signOut: () => Promise<{ success: boolean; error?: any }>;
  // Group methods
  createGroup: (name: string) => Promise<any>;
  joinGroup: (key: string) => Promise<any>;
  // Session management
  checkSession: () => Promise<boolean>;
  fetchUserProfile: (userId: string) => Promise<UserProfile | null>;
  setError: (error: Error | null) => void;
  clearUserKey: () => void;
  restoreSession: () => Promise<boolean>;
  createAnonymousUserWithEdgeFunction: (key: string) => Promise<{
    success: boolean;
    userId?: User;
    error?: Error;
  }>;
  lastAuthEvent: string | null;
  lastAuthEventTime: number;
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
      // Initial state
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      isLoginLoading: false,
      isLogoutLoading: false,
      isSessionCheckLoading: false,
      userKey: null,
      formattedKey: null,
      error: null,
      userProfile: null,
      isGeneratingKey: false,
      lastAuthEvent: null,
      lastAuthEventTime: 0,

      // 첫 번째 코드의 기본 메서드
      setUserKey: (key) => set({ userKey: key }),
      setFormattedKey: (key) => set({ formattedKey: key }),
      setUser: (user) => set({ user }),
      setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      clearState: () =>
        set({
          userKey: null,
          formattedKey: null,
          user: null,
          isAuthenticated: false,
        }),
      setLastAuthEvent: (event) => set({ lastAuthEvent: event }),
      setLastAuthEventTime: (time) => set({ lastAuthEventTime: time }),
      restoreSession: async () => {
        try {
          console.log('로컬스토리지에서 세션 복원 시도');
          set({ isLoading: true, error: null });

          // 로컬스토리지에서 세션 데이터 가져오기
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const authKey =
            'sb-' +
            supabaseUrl.replace('https://', '').replace('.supabase.co', '') +
            '-auth-token';
          const storedSession = localStorage.getItem(authKey);

          if (!storedSession) {
            console.log('로컬스토리지에 세션 데이터 없음');
            set({ isLoading: false });
            return false;
          }

          try {
            // 세션 데이터 파싱
            const parsedSession = JSON.parse(storedSession);

            if (!parsedSession || !parsedSession.user) {
              console.log('유효하지 않은 세션 데이터');
              set({ isLoading: false });
              return false;
            }

            // 세션 만료 확인
            const expiresAt = parsedSession.expires_at * 1000; // 밀리초로 변환
            const now = Date.now();

            console.log('세션 만료 정보:', {
              expiresAt: new Date(expiresAt).toLocaleString(),
              timeUntilExpiry: `${((expiresAt - now) / 1000 / 60).toFixed(
                2,
              )}분 후`,
              isExpired: expiresAt < now,
            });

            if (expiresAt < now) {
              console.log('세션 만료됨, 새로고침 시도');

              // 세션 새로고침 시도
              try {
                const { data: refreshData, error: refreshError } =
                  await supabase.auth.refreshSession({
                    refresh_token: parsedSession.refresh_token,
                  });

                if (refreshError || !refreshData.session) {
                  console.error('세션 새로고침 실패:', refreshError);
                  set({
                    isAuthenticated: false,
                    user: null,
                    session: null,
                    isLoading: false,
                  });
                  return false;
                }

                // 새로고침 성공, 새 세션 사용
                console.log('세션 새로고침 성공');
                const user = refreshData.session.user;

                // 사용자 프로필 가져오기
                const profile = await get().fetchUserProfile(user.id);

                // 상태 업데이트
                set({
                  session: refreshData.session,
                  user,
                  isAuthenticated: true,
                  userProfile: profile,
                  isLoading: false,
                });

                return true;
              } catch (refreshError) {
                console.error('세션 새로고침 중 오류:', refreshError);
                set({
                  isAuthenticated: false,
                  user: null,
                  session: null,
                  isLoading: false,
                });
                return false;
              }
            }

            // 세션이 유효한 경우 직접 사용
            console.log('유효한 세션 발견, 직접 사용');
            const user = parsedSession.user;

            // 사용자 프로필 가져오기
            const profile = await get().fetchUserProfile(user.id);

            // 상태 업데이트
            set({
              session: {
                access_token: parsedSession.access_token,
                refresh_token: parsedSession.refresh_token,
                expires_at: parsedSession.expires_at,
                expires_in: parsedSession.expires_in,
                token_type: parsedSession.token_type,
                user: parsedSession.user,
              },
              user,
              isAuthenticated: true,
              userProfile: profile,
              isLoading: false,
            });

            return true;
          } catch (parseError) {
            console.error('세션 데이터 파싱 오류:', parseError);
            set({ isLoading: false });
            return false;
          }
        } catch (error) {
          console.error('세션 복원 실패:', error);
          set({ error: error as Error, isLoading: false });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      checkSession: async () => {
        try {
          set({ isSessionCheckLoading: true, error: null });

          // 세션 확인 간소화 - 타임아웃 축소
          try {
            // 타입 문제를 해결하기 위해 Promise.race 대신 직접 타임아웃 처리
            const sessionPromise = supabase.auth.getSession();

            // 타임아웃 설정
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);

            // 세션 가져오기 실행
            const { data } = await sessionPromise;
            clearTimeout(timeoutId); // 성공적으로 완료되면 타임아웃 취소

            if (data?.session) {
              const user = data.session.user;
              // 프로필 가져오기를 병렬로 처리
              const profile = await get().fetchUserProfile(user.id);

              set({
                session: data.session,
                user,
                isAuthenticated: true,
                userProfile: profile,
                isSessionCheckLoading: false,
              });
              return true;
            }
          } catch (error) {
            console.log('세션 가져오기 실패, 로컬스토리지 확인');
          }

          // 로컬스토리지에서 세션 복구 시도
          const restored = await get().restoreSession();
          if (!restored) {
            set({
              isAuthenticated: false,
              user: null,
              session: null,
              isSessionCheckLoading: false,
            });
          }
          return restored;
        } catch (error) {
          console.error('세션 확인 전체 오류:', error);
          set({ error: error as Error, isSessionCheckLoading: false });
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

      // 사용자 프로필 가져오기
      // authStore.ts의 fetchUserProfile 함수 수정
      fetchUserProfile: async (userId: string) => {
        try {
          console.log('사용자 프로필 가져오기 시작:', userId);

          // 사용자 ID가 없으면 null 반환
          if (!userId) {
            console.log('사용자 ID가 없음');
            return null;
          }

          // 사용자 정보 가져오기
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user) {
            console.log('인증된 사용자 없음');
            return null;
          }

          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (profileError) {
            // PGRST116은 "결과가 없음" 오류 코드
            if (profileError.code !== 'PGRST116') {
              console.error('프로필 가져오기 오류:', profileError);
            } else {
              console.log('프로필 데이터 없음, 기본 프로필 사용');
            }
          }

          // 기본 프로필 정보 구성
          const profile = {
            user_id: user.id,
            email: user.email,
            provider: user.app_metadata?.provider,
            display_name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              profileData?.display_name ||
              user.email?.split('@')[0] ||
              '사용자',
            avatar_url:
              user.user_metadata?.avatar_url || profileData?.avatar_url,
          };

          console.log('사용자 프로필 가져오기 완료:', profile);
          return profile;
        } catch (err) {
          console.error('프로필 가져오기 실패:', err);
          return null;
        }
      },

      // Key-based authentication
      loginWithKey: async (key: string) => {
        try {
          set({ isLoading: true, error: null });

          // 디버깅을 위한 로그
          console.log(
            '키 로그인 시도(마스킹됨):',
            key.substring(0, 4) + '****',
          );

          // 1. 키로 사용자 찾기
          const { data: keyData, error: keyError } = await supabase.rpc(
            'find_user_by_key',
            { key_value: key },
          );

          if (keyError || !keyData || keyData.length === 0) {
            throw new Error('유효하지 않은 키입니다.');
          }

          const userData = keyData[0];
          console.log('키 검색 결과:', userData);

          // 2. 해당 user_id로 세션 생성
          let authData;

          // 이미 로그인된 상태인지 확인
          const { data: sessionData } = await supabase.auth.getSession();
          const currentUserId = sessionData?.session?.user?.id;

          // 다른 사용자로 로그인된 경우 로그아웃 후 재로그인
          if (currentUserId && currentUserId !== userData.user_id) {
            await supabase.auth.signOut();
          }

          // 로그인 처리
          if (!currentUserId || currentUserId !== userData.user_id) {
            const { data, error: authError } =
              await supabase.auth.signInAnonymously();

            if (authError) {
              throw authError;
            }

            authData = data;

            // 사용자 메타데이터 업데이트
            await supabase.auth.updateUser({
              data: {
                key_type: userData.key_type,
                key_login: true,
                login_method: 'key',
              },
            });
          } else {
            authData = { user: sessionData.session?.user };
          }

          // 3. 상태 업데이트
          set({
            userKey: key,
            formattedKey: formatKey(key),
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
          };
        }
      },

      createAnonymousUserWithEdgeFunction: async (key: string) => {
        try {
          const { data, error } = await supabase.functions.invoke(
            'create-anonymous-user',
            {
              body: { key },
            },
          );

          if (error) throw error;
          return { success: true, userId: data.user_id };
        } catch (error) {
          console.error('Edge Function 호출 오류:', error);
          return { success: false, error };
        }
      },

      generateAndStoreKey: async (email?: string) => {
        try {
          set({ isLoading: true, error: null });

          if (!email?.trim()) {
            throw new Error('이메일을 입력해주세요.');
          }

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            throw new Error('유효한 이메일 주소를 입력해주세요.');
          }

          const key = generateRandomKey(16);
          const password = generateRandomKey(12);

          const { data: userData, error: signUpError } =
            await supabase.auth.signUp({
              email,
              password,
              options: {
                data: { key_prefix: key.substring(0, 4) },
              },
            });

          if (signUpError) throw signUpError;
          if (!userData.user) throw new Error('사용자 생성에 실패했습니다.');

          await supabase.from('user_keys').insert({
            user_id: userData.user.id,
            key,
            created_at: new Date().toISOString(),
            is_active: true,
          });

          const displayName = email.split('@')[0];
          await supabase.from('user_profiles').insert({
            user_id: userData.user.id,
            display_name: displayName,
            updated_at: new Date().toISOString(),
          });

          set({
            userKey: key,
            formattedKey: formatKey(key),
            isLoading: false,
          });

          return true;
        } catch (error) {
          set({ error: error as Error, isLoading: false });
          return false;
        }
      },

      generateAnonymousKey: async () => {
        try {
          set({ isLoading: true, isGeneratingKey: true, error: null });

          // 1. 랜덤 키 생성 (클라이언트에서 직접 생성)
          const key = generateRandomKey(16);
          const formattedKeyValue = formatKey(key);

          // 2. Edge Function 호출 (배포된 경우)
          // const { data: userData, error: createError } = await supabase.functions.invoke("create-anonymous-user", {
          //   body: { key },
          // });

          // if (createError) {
          //   console.error('사용자 생성 오류:', createError);
          //   throw createError;
          // }

          // 3. 상태 업데이트
          set({
            userKey: key,
            formattedKey: formattedKeyValue,
            isLoading: false,
            isGeneratingKey: false,
          });

          // 4. 성공 반환
          return {
            success: true,
            key,
            formattedKey: formattedKeyValue,
          };
        } catch (error) {
          console.error('익명 키 생성 오류:', error);
          set({
            error: error as Error,
            isLoading: false,
            isGeneratingKey: false,
          });

          // 오류가 발생해도 키는 생성해서 반환
          const key = generateRandomKey(16);
          const formattedKeyValue = formatKey(key);

          set({
            userKey: key,
            formattedKey: formattedKeyValue,
          });

          return {
            success: true,
            key,
            formattedKey: formattedKeyValue,
            warning: '오류가 발생했지만 키는 생성되었습니다.',
          };
        }
      },

      generateEmailKey: async (email: string) => {
        try {
          if (get().isLoading) return false;

          if (!email?.trim()) {
            throw new Error('이메일을 입력해주세요.');
          }

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            throw new Error('유효한 이메일 주소를 입력해주세요.');
          }

          set({ isLoading: true, error: null });
          console.log('이메일 키 생성 시작:', email);

          // 1. 랜덤 키 생성
          const key = generateRandomKey(16);
          const password = generateRandomKey(12);

          // 2. 이메일/비밀번호로 회원가입
          const { data: userData, error: signUpError } =
            await supabase.auth.signUp({
              email,
              password,
              options: {
                data: { key_prefix: key.substring(0, 4) },
              },
            });

          if (signUpError) {
            console.error('회원가입 오류:', signUpError);
            throw signUpError;
          }

          if (!userData.user) {
            throw new Error('사용자 생성에 실패했습니다.');
          }

          console.log('사용자 생성 성공:', userData.user.id);

          // 3. 키 저장
          const { error: keyError } = await supabase.from('user_keys').insert({
            user_id: userData.user.id,
            key,
            created_at: new Date().toISOString(),
            is_active: true,
          });

          if (keyError) {
            console.error('키 저장 오류:', keyError);
            throw keyError;
          }

          // 4. 사용자 프로필 생성
          const displayName = email.split('@')[0];
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: userData.user.id,
              display_name: displayName,
              updated_at: new Date().toISOString(),
            });

          if (profileError) {
            console.error('프로필 생성 오류:', profileError);
            // 프로필 생성 실패해도 계속 진행
          }

          // 5. 로그아웃 (키만 생성하고 로그인 상태는 유지하지 않음)
          await supabase.auth.signOut();

          // 6. 키 설정
          set({
            userKey: key,
            formattedKey: formatKey(key),
            isLoading: false,
          });

          console.log('이메일 키 생성 성공:', formatKey(key));
          return true;
        } catch (error) {
          console.error('이메일 키 생성 오류:', error);

          // 오류 발생 시 로그아웃 시도
          try {
            await supabase.auth.signOut();
          } catch (logoutError) {
            console.error('로그아웃 오류:', logoutError);
          }

          set({ error: error as Error, isLoading: false });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      loginWithSocial: async (provider: 'github' | 'google') => {
        if (get().isLoginLoading) return;

        try {
          set({ isLoginLoading: true, error: null });

          // 불필요한 세션 확인 및 로그아웃 과정 제거
          // OAuth는 브라우저 리디렉션을 통해 새 세션을 생성하므로 기존 세션 확인이 불필요할 수 있음
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
          set({ isLoading: true, error: null });
          const { user } = get();

          if (!user) throw new Error('로그인이 필요합니다.');

          const { data, error } = await supabase
            .from('groups')
            .insert({
              name,
              created_by: user.id,
              created_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (error) throw error;
          return data;
        } catch (error) {
          set({ error: error as Error });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      joinGroup: async (key: string) => {
        try {
          set({ isLoading: true, error: null });
          const cleanKey = key.replace(/-/g, '');

          const { data: keyData, error: keyError } = await supabase
            .from('group_keys')
            .select('group_id')
            .eq('key', cleanKey)
            .eq('is_active', true)
            .single();

          if (keyError || !keyData)
            throw new Error('유효하지 않은 그룹 키입니다.');

          const { user } = get();
          if (!user) throw new Error('로그인이 필요합니다.');

          await supabase.from('group_members').insert({
            group_id: keyData.group_id,
            user_id: user.id,
            role: 'member',
          });

          return { success: true, groupId: keyData.group_id };
        } catch (error) {
          set({ error: error as Error });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // authStore.ts
      // 로그아웃 함수 개선
      signOut: async () => {
        try {
          set({ isLogoutLoading: true, error: null });

          // 로그아웃 전 현재 URL 저장 (필요한 경우)
          const currentPath = window.location.pathname;
          console.log('로그아웃 시작, 현재 경로:', currentPath);

          const { error } = await supabase.auth.signOut();
          if (error) throw error;

          // 상태 초기화
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            userKey: null,
            formattedKey: null,
            userProfile: null,
          });

          // 로컬스토리지에서 세션 데이터 확인 및 삭제
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const authKey = `sb-${supabaseUrl
            .replace('https://', '')
            .replace('.supabase.co', '')}-auth-token`;

          if (localStorage.getItem(authKey)) {
            console.log('로컬스토리지 세션 데이터 삭제');
            localStorage.removeItem(authKey);
          }

          console.log('로그아웃 완료, 로그인 페이지로 리디렉션');

          // 로그인 페이지로 강제 리디렉션
          window.location.href = '/login';

          return { success: true };
        } catch (error) {
          console.error('로그아웃 오류:', error);
          set({ error: error as Error });

          // 오류 발생 시에도 로그인 페이지로 리디렉션 시도
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);

          return { success: false, error };
        } finally {
          set({ isLogoutLoading: false });
        }
      },

      setError: (error: Error | null) => set({ error }),

      clearUserKey: () => set({ userKey: null, formattedKey: null }),
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
