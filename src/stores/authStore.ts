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
  restoreSession: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  session: null,
  isAuthenticated: false,
  userKey: null,
  formattedKey: null,
  error: null,
  userProfile: null,
  isLoading: false,
  isLoginLoading: false,
  isLogoutLoading: false,
  isSessionCheckLoading: false,

  // authStore.ts의 checkSession 함수 수정
  restoreSession: async () => {
    try {
      console.log('세션 복원 시도');
      set({ isLoading: true });

      // 로컬스토리지에서 세션 키 확인
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const authKey =
        'sb-' +
        import.meta.env.VITE_SUPABASE_URL.replace('https://', '').replace(
          '.supabase.co',
          '',
        ) +
        '-auth-token';
      const storedSession = localStorage.getItem(authKey);

      if (!storedSession) {
        console.log('저장된 세션 없음');
        set({ isLoading: false });
        return false;
      }

      // 세션 새로고침 시도
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('세션 새로고침 오류:', error);
        set({ isLoading: false });
        return false;
      }

      if (!data.session) {
        console.log('새로고침 후에도 세션 없음');
        set({ isLoading: false });
        return false;
      }

      // 세션 복원 성공
      console.log('세션 복원 성공:', data.session.user.id);

      // 사용자 프로필 가져오기
      const profile = await get().fetchUserProfile(data.session.user.id);

      // 상태 업데이트
      set({
        session: data.session,
        user: data.session.user,
        isAuthenticated: true,
        userProfile: profile,
        isLoading: false,
      });

      return true;
    } catch (error) {
      console.error('세션 복원 실패:', error);
      set({ isLoading: false });
      return false;
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
        import.meta.env.VITE_SUPABASE_URL.replace('https://', '').replace(
          '.supabase.co',
          '',
        ) +
        '-auth-token';
      console.log(authKey);
      const storedSession = localStorage.getItem(authKey);

      console.log('로컬스토리지 세션 데이터 존재:', !!storedSession);

      // 세션 가져오기 전 짧은 지연 추가 (브라우저 안정화를 위해)
      await new Promise((resolve) => setTimeout(resolve, 100));

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
          console.log('로컬스토리지에서 세션 복원 시도');
          try {
            // 세션 새로고침 시도
            const refreshResult = await supabase.auth.refreshSession();
            sessionResult = refreshResult;
            console.log('세션 새로고침 결과:', refreshResult);
          } catch (refreshError) {
            console.error('세션 새로고침 실패:', refreshError);
          }
        }
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
    if (get().isLoading) return;

    try {
      set({ isLoading: true, error: null });

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error) {
      set({ error: error as Error });
    } finally {
      set({ isLoading: false });
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
  signOut: async () => {
    try {
      set({ isLogoutLoading: true, error: null });
      await supabase.auth.signOut();

      // 상태 초기화
      set({
        user: null,
        session: null,
        isAuthenticated: false,
        userKey: null,
        formattedKey: null,
        userProfile: null,
      });

      // 로그아웃 성공
      return { success: true };
    } catch (error) {
      set({ error: error as Error });
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

supabase.auth.onAuthStateChange(async (_event, session) => {
  // 이미 처리 중인 경우 중복 처리 방지
  if (isProcessingAuthChange) return;
  isProcessingAuthChange = true;

  try {
    const user = session?.user ?? null;
    const currentState = useAuthStore.getState();

    // 세션 상태가 변경되었을 때만 업데이트
    if (currentState.session !== session) {
      useAuthStore.setState({
        session,
        user,
        isAuthenticated: !!session,
      });

      // 사용자 프로필 가져오기
      if (user) {
        const profile = await useAuthStore.getState().fetchUserProfile(user.id);
        useAuthStore.setState({ userProfile: profile });
      } else {
        useAuthStore.setState({ userProfile: null });
      }
    }
  } finally {
    isProcessingAuthChange = false;
  }
});
