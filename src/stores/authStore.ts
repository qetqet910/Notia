import { create } from 'zustand';
import { supabase } from '@/services/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { generateRandomKey, formatKey } from '@/utils/keys';
import { createAnonymousKey } from '@/services/anonymous-key';
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
  loginWithKey: (
    key: string,
  ) => Promise<{ success: boolean; message?: string }>;
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
  resetSupabaseClient: () => Promise<boolean>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
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

  resetSupabaseClient: async () => {
    try {
      console.log('Supabase 클라이언트 재설정 시도');

      // 기존 세션 데이터 백업
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // 새 클라이언트 생성
      const { createClient } = await import('@supabase/supabase-js');
      const newClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: localStorage,
        },
      });

      // 기존 클라이언트 교체
      Object.assign(supabase, newClient);

      console.log('Supabase 클라이언트 재설정 완료');
      return true;
    } catch (error) {
      console.error('Supabase 클라이언트 재설정 실패:', error);
      return false;
    }
  },

  // authStore.ts의 checkSession 함수 수정
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
          timeUntilExpiry: `${((expiresAt - now) / 1000 / 60).toFixed(2)}분 후`,
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
      console.log('로컬스토리지 모든 키:', Object.keys(localStorage));

      // 직접 로컬스토리지에서 세션 데이터 확인
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const authKey =
        'sb-' +
        supabaseUrl.replace('https://', '').replace('.supabase.co', '') +
        '-auth-token';
      const storedSession = localStorage.getItem(authKey);

      console.log('로컬스토리지 세션 데이터 존재:', !!storedSession);

      // 세션 가져오기 시도
      console.log('세션 가져오기 시작...');
      let sessionResult;

      try {
        sessionResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('세션 가져오기 타임아웃')), 3000),
          ),
        ]);
      } catch (timeoutError) {
        console.error('세션 가져오기 실패:', timeoutError);

        // 타임아웃 발생 시 로컬스토리지에서 직접 세션 복원 시도
        if (storedSession) {
          console.log(
            '세션 가져오기 타임아웃, 로컬스토리지에서 직접 복원 시도',
          );
          return await get().restoreSession();
        }

        set({
          isAuthenticated: false,
          user: null,
          session: null,
          isSessionCheckLoading: false,
        });
        return false;
      }

      // 세션 결과 처리
      const session = sessionResult?.data?.session;
      console.log('세션 가져오기 완료:', session ? '성공' : '실패');

      if (!session) {
        console.log('세션이 없음, 인증되지 않음으로 설정');
        set({
          isAuthenticated: false,
          user: null,
          session: null,
          isSessionCheckLoading: false,
        });
        return false;
      }

      // 세션이 있는 경우 처리
      const user = session.user;

      // 사용자 프로필 가져오기
      console.log('사용자 프로필 가져오기 시작...');
      const profile = await get().fetchUserProfile(user.id);
      console.log('사용자 프로필 가져오기 완료:', profile);

      // 상태 업데이트
      set({
        session,
        user,
        isAuthenticated: true,
        userProfile: profile,
        isSessionCheckLoading: false,
      });

      return true;
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
  fetchUserProfile: async (userId: string) => {
    try {
      // 이미 인증된 사용자 ID를 사용하므로 getUser() 호출 제거
      // supabase.auth.getUser() 호출 제거

      // 사용자 프로필 정보 가져오기
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('프로필 가져오기 오류:', profileError);
      }

      // 기존 사용자 정보 활용
      const { user } = useAuthStore.getState();
      if (!user) return null;

      // 기본 프로필 정보 구성
      const profile: UserProfile = {
        user_id: userId,
        email: user.email,
        provider: user.app_metadata?.provider,
        display_name:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          profileData?.display_name,
        avatar_url: user.user_metadata?.avatar_url || profileData?.avatar_url,
      };

      return profile;
    } catch (err) {
      console.error('프로필 가져오기 실패:', err);
      return null;
    }
  },

  // Key-based authentication
  loginWithKey: async (key: string) => {
    try {
      set({ isLoginLoading: true, error: null });
      const cleanKey = key.replace(/-/g, '');

      const { data: allKeys, error: allKeysError } = await supabase
        .from('user_keys')
        .select('user_id, key, is_active');

      if (allKeysError) throw allKeysError;

      const matchingKey = allKeys?.find(
        (k) => k.key === cleanKey && k.is_active,
      );
      if (!matchingKey) {
        throw new Error('유효하지 않은 키입니다.');
      }

      const { data: authData, error: authError } =
        await supabase.auth.signInAnonymously();
      if (authError) throw authError;

      await supabase.auth.updateUser({
        data: {
          original_user_id: matchingKey.user_id,
          key_login: true,
          login_method: 'key',
        },
      });

      // 사용자 프로필 가져오기
      const profile = await get().fetchUserProfile(matchingKey.user_id);

      set({
        userKey: cleanKey,
        formattedKey: formatKey(cleanKey),
        isAuthenticated: true,
        userProfile: profile,
        isLoading: false,
      });

      return { success: true, message: '로그인 성공' };
    } catch (error) {
      set({ error: error as Error });
      return {
        success: false,
        message: error instanceof Error ? error.message : '로그인 실패',
      };
    } finally {
      // 로그인 로딩 상태만 false로 변경
      set({ isLoginLoading: false });
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

      const { data: userData, error: signUpError } = await supabase.auth.signUp(
        {
          email,
          password,
          options: {
            data: { key_prefix: key.substring(0, 4) },
          },
        },
      );

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
      // 이미 로딩 중이면 중복 요청 방지
      if (get().isLoginLoading) {
        return {
          success: false,
          key: '',
          formattedKey: '',
        };
      }

      set({ isLoginLoading: true, error: null });

      // 외부 서비스 함수 호출
      const { success, key, formattedKey, error } = await createAnonymousKey();

      if (!success) {
        throw error || new Error('키 생성에 실패했습니다.');
      }

      // 키 정보만 설정 (로그인 상태는 변경하지 않음)
      set({
        userKey: key,
        formattedKey,
        isLoginLoading: false,
      });

      return {
        success: true,
        key,
        formattedKey,
      };
    } catch (error) {
      console.error('익명 키 생성 오류:', error);
      set({ error: error as Error, isLoginLoading: false });
      return {
        success: false,
        key: '',
        formattedKey: '',
      };
    }
  },

  loginWithSocial: async (provider: 'github' | 'google') => {
    // 이미 진행 중인 로그인이 있으면 중복 실행 방지
    if (get().isLoginLoading) return;

    try {
      set({ isLoginLoading: true, error: null });

      // 기존 세션 확인 및 로그아웃
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        console.log('기존 세션 발견, 로그아웃 처리');
        await supabase.auth.signOut({ scope: 'global' });

        // 세션 정리를 위한 짧은 지연
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

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

      if (keyError || !keyData) throw new Error('유효하지 않은 그룹 키입니다.');

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
}));

// 이벤트 리스너에 가드 추가
let isProcessingAuthChange = false;

supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth 상태 변경:', event, session ? '세션 있음' : '세션 없음');
  
  if (session) {
    // 세션이 있으면 인증 상태 업데이트
    useAuthStore.setState({
      user: session.user,
      session: session,
      isAuthenticated: true,
    });
    
    // 사용자 프로필 가져오기
    useAuthStore.getState().fetchUserProfile(session.user.id)
      .then(profile => {
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
});
