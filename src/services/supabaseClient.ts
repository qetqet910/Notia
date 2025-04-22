import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Supabase URL과 Anon Key가 환경 변수에 설정되어 있지 않습니다.',
  );
}

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'implicit',
      storage: localStorage,
    },
    global: {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    },
  },
);

supabase.auth.onAuthStateChange((event, session) => {
  console.warn(`Auth 상태 변경: ${event}`);

  if (event === 'SIGNED_IN' && session) {
    console.warn('로그인 상태:', session.user.id);
  } else if (event === 'SIGNED_OUT') {
    console.warn('로그아웃 상태');
  }
});

/**
 * Supabase 클라이언트를 초기화합니다.
 * 세션 문제 발생시 호출하여 클라이언트를 재설정할 수 있습니다.
 */
export const resetSupabaseClient = (): boolean => {
  try {
    console.log('Supabase 클라이언트 재설정 시도');

    // 새 클라이언트 생성
    const newClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
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
};
