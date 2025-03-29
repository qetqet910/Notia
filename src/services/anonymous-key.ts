import { supabase } from '@/services/supabase';
import { formatKey, generateRandomKey } from '@/utils/keys';

// 익명 키 생성 함수 (완전히 새로운 접근 방식)
export async function createAnonymousKey() {
  try {
    // 1. 먼저 익명 사용자 생성 (Supabase Auth)
    const { data: authData, error: authError } =
      await supabase.auth.signInAnonymously();

    if (authError) {
      console.error('익명 사용자 생성 오류:', authError);
      throw authError;
    }

    if (!authData.user) {
      throw new Error('익명 사용자 생성 실패');
    }

    // 2. 랜덤 키 생성
    const key = generateRandomKey(16);

    // 3. 키 저장 - Supabase Auth에서 생성된 ID 사용
    const { error: keyError } = await supabase.from('user_keys').insert({
      user_id: authData.user.id,
      key,
      created_at: new Date().toISOString(),
      is_active: true,
    });

    if (keyError) {
      console.error('키 저장 오류:', keyError);
      // 키 저장 실패 시 생성된 사용자 로그아웃
      await supabase.auth.signOut();
      throw keyError;
    }

    // 4. 사용자 프로필 생성
    const displayName = `User-${authData.user.id.substring(0, 6)}`;
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: authData.user.id,
        display_name: displayName,
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error('프로필 생성 오류:', profileError);
      // 프로필 생성 실패해도 계속 진행
    }

    // 5. 로그아웃 (키만 생성하고 로그인 상태는 유지하지 않음)
    await supabase.auth.signOut();

    return {
      success: true,
      key,
      formattedKey: formatKey(key),
    };
  } catch (error) {
    console.error('익명 키 생성 오류:', error);

    // 오류 발생 시 로그아웃 시도
    try {
      await supabase.auth.signOut();
    } catch (logoutError) {
      console.error('로그아웃 오류:', logoutError);
    }

    return {
      success: false,
      key: '',
      formattedKey: '',
      error,
    };
  }
}
