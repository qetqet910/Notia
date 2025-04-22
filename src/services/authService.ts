import { supabase } from '@services/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

/**
 * 사용자 프로필 인터페이스
 */
interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  updated_at: string;
}

/**
 * 사용자 프로필을 조회하거나 생성합니다.
 */
export const getOrCreateUserProfile = async (
  user: User,
): Promise<UserProfile | null> => {
  try {
    // 기존 프로필 조회
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingProfile) {
      console.log('기존 프로필 발견');
      return existingProfile as UserProfile;
    }

    // 프로필이 없으면 새로 생성
    console.log('프로필 없음, 생성 시도');
    const displayName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      '사용자';

    const { data, error: insertError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: user.id,
        display_name: displayName,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('프로필 생성 오류:', insertError);
      return null;
    }

    console.log('프로필 생성 성공');
    return data as UserProfile;
  } catch (error) {
    console.error('프로필 처리 오류:', error);
    return null;
  }
};

/**
 * 현재 세션을 확인합니다.
 */
export const getCurrentSession = async (): Promise<{
  session: Session | null;
  user: User | null;
  error: Error | null;
}> => {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return { session: null, user: null, error };
    }

    return {
      session: data.session,
      user: data.session?.user || null,
      error: null,
    };
  } catch (error) {
    return {
      session: null,
      user: null,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
};

/**
 * 사용자 로그인 상태를 확인하고 프로필을 로드합니다.
 */
export const initializeAuthState = async () => {
  const { session, user, error } = await getCurrentSession();

  if (error || !user) {
    return { isAuthenticated: false, user: null, session: null, profile: null };
  }

  const profile = await getOrCreateUserProfile(user);

  return {
    isAuthenticated: true,
    user,
    session,
    profile,
  };
};
