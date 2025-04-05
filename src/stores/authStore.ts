import { create } from 'zustand';
import { supabase } from '@/services/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { generateRandomKey, formatKey } from '@/utils/keys';
import { createAnonymousKey } from '@/services/anonymous-key';

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userKey: string | null;
  formattedKey: string | null;
  error: Error | null;
  userProfile: UserProfile | null;
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
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  userKey: null,
  formattedKey: null,
  error: null,
  userProfile: null,

  // Session management
  checkSession: async () => {
    try {
      console.log("checkSession 시작");
      set({ isLoading: true, error: null });
      
      // 타임아웃 설정 (10초 후 자동으로 로딩 상태 해제)
      const timeoutId = setTimeout(() => {
        console.warn("세션 확인 타임아웃 발생");
        set({ isLoading: false });
      }, 10000);
      
      const {
        data: { session },
      } = await supabase.auth.getSession();
      
      // 타임아웃 취소
      clearTimeout(timeoutId);
      
      console.log("세션 확인 결과:", session ? "세션 있음" : "세션 없음");
  
      const user = session?.user ?? null;
      
      // 사용자 프로필 가져오기
      let profile = null;
      if (user) {
        try {
          console.log("사용자 프로필 가져오기 시도:", user.id);
          profile = await get().fetchUserProfile(user.id);
        } catch (profileError) {
          console.error("프로필 가져오기 오류:", profileError);
          // 프로필 오류가 발생해도 계속 진행
        }
      }
      
      // 모든 상태를 한 번에 업데이트
      set({
        session,
        user,
        isAuthenticated: !!session,
        userProfile: profile,
        isLoading: false
      });
      
      console.log("checkSession 완료, 인증 상태:", !!session);
      return !!session; // 인증 상태 반환
    } catch (error) {
      console.error("세션 확인 오류:", error);
      set({ error: error as Error, isLoading: false });
      return false;
    }
  },

  // 사용자 프로필 가져오기
  fetchUserProfile: async (userId: string) => {
    try {
      // 사용자 정보 가져오기
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return null;

      // 사용자 프로필 정보 가져오기 - maybeSingle 사용
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // 프로필이 없으면 생성 시도
      if (!profileData || profileError) {
        console.log('프로필 없음, 생성 시도');

        const { data: newProfile, error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: userId,
            display_name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split('@')[0] ||
              '사용자',
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          console.error('프로필 생성 오류:', insertError);
        } else {
          console.log('프로필 생성 성공:', newProfile);

          // 새로 생성된 프로필 반환
          return {
            user_id: userId,
            email: user.email,
            provider: user.app_metadata?.provider,
            display_name:
              newProfile?.display_name ||
              user.user_metadata?.full_name ||
              user.user_metadata?.name,
            avatar_url: user.user_metadata?.avatar_url,
          };
        }
      }

      // 기존 프로필 정보 구성
      const profile = {
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

      // 오류 발생 시 기본 정보 반환 시도
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          return {
            user_id: user.id,
            email: user.email,
            provider: user.app_metadata?.provider,
            display_name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split('@')[0] ||
              '사용자',
            avatar_url: user.user_metadata?.avatar_url,
          };
        }
      } catch (e) {
        console.error('기본 프로필 정보 구성 실패:', e);
      }

      return null;
    }
  },

  // Key-based authentication
  loginWithKey: async (key: string) => {
    try {
      set({ isLoading: true, error: null });
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
      set({ error: error as Error, isLoading: false });
      return {
        success: false,
        message: error instanceof Error ? error.message : '로그인 실패',
      };
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
      if (get().isLoading) {
        return {
          success: false,
          key: '',
          formattedKey: '',
        };
      }

      set({ isLoading: true, error: null });

      // 외부 서비스 함수 호출
      const { success, key, formattedKey, error } = await createAnonymousKey();

      if (!success) {
        throw error || new Error('키 생성에 실패했습니다.');
      }

      // 키 정보만 설정 (로그인 상태는 변경하지 않음)
      set({
        userKey: key,
        formattedKey,
        isLoading: false,
      });

      return {
        success: true,
        key,
        formattedKey,
      };
    } catch (error) {
      console.error('익명 키 생성 오류:', error);
      set({ error: error as Error, isLoading: false });
      return {
        success: false,
        key: '',
        formattedKey: '',
      };
    }
  },

  loginWithSocial: async (provider: 'github' | 'google') => {
    try {
      set({ isLoading: true, error: null });

      // 이미 진행 중인 세션이 있는지 확인
      const { data: sessionData } = await supabase.auth.getSession();

      // 이미 로그인된 경우 로그아웃 처리
      if (sessionData.session) {
        console.log('기존 세션 발견, 로그아웃 처리');
        await supabase.auth.signOut({ scope: 'global' });

        // 세션 정리를 위한 짧은 지연
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      console.log(`${provider} 로그인 시작...`);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: provider === 'github' ? 'user:email' : 'email profile',
        },
      });

      if (error) throw error;

      console.log(`${provider} 로그인 리다이렉트 시작:`, data);
    } catch (error) {
      console.error(`${provider} 로그인 오류:`, error);
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

  // authStore.ts - signOut 함수 수정
  signOut: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Supabase 로그아웃 (전역 범위로 설정)
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error("로그아웃 오류:", error);
        set({ error: error as Error });
        return { success: false, error };
      }
      
      // 상태 초기화
      set({
        user: null,
        session: null,
        isAuthenticated: false,
        userKey: null,
        formattedKey: null,
        userProfile: null,
      });
      
      console.log("로그아웃 성공, 상태 초기화 완료");
      
      // 로컬 스토리지 세션 정보 확인 및 제거 시도
      try {
        localStorage.removeItem('supabase.auth.token');
        console.log("로컬 스토리지 세션 정보 제거 시도");
      } catch (e) {
        console.error("로컬 스토리지 접근 오류:", e);
      }
      
      // 로그아웃 이벤트 발생
      window.dispatchEvent(new CustomEvent('auth-signout'));
      
      return { success: true };
    } catch (error) {
      console.error("로그아웃 실패:", error);
      set({ error: error as Error });
      return { success: false, error };
    } finally {
      set({ isLoading: false });
    }
  },

  setError: (error: Error | null) => set({ error }),

  clearUserKey: () => set({ userKey: null, formattedKey: null }),
}));

// authStore.ts - onAuthStateChange 이벤트 핸들러 수정
supabase.auth.onAuthStateChange(async (event, session) => {
  const user = session?.user ?? null;

  useAuthStore.setState({
    session,
    user,
    isAuthenticated: !!session,
  });

  // 사용자 프로필 가져오기 또는 생성
  if (user) {
    try {
      // 먼저 프로필이 있는지 확인
      const { data: existingProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(); // single() 대신 maybeSingle() 사용

      // 프로필이 없으면 새로 생성
      if (!existingProfile || profileError) {
        console.log('프로필이 없거나 오류 발생, 새 프로필 생성 시도');

        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            display_name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split('@')[0] ||
              '사용자',
            updated_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error('프로필 생성 오류:', insertError);
        } else {
          console.log('프로필 생성 성공');
        }
      }

      // 프로필 정보 구성 (기존 또는 새로 생성된)
      const profile = {
        user_id: user.id,
        email: user.email,
        provider: user.app_metadata?.provider,
        display_name:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          existingProfile?.display_name ||
          user.email?.split('@')[0] ||
          '사용자',
        avatar_url:
          user.user_metadata?.avatar_url || existingProfile?.avatar_url,
      };

      useAuthStore.setState({ userProfile: profile });
    } catch (err) {
      console.error('프로필 처리 오류:', err);

      // 오류가 발생해도 기본 프로필 정보 설정
      const basicProfile = {
        user_id: user.id,
        email: user.email,
        provider: user.app_metadata?.provider,
        display_name:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          '사용자',
        avatar_url: user.user_metadata?.avatar_url,
      };

      useAuthStore.setState({ userProfile: basicProfile });
    }
  } else {
    useAuthStore.setState({ userProfile: null });
  }
});
