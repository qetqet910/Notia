import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL과 Anon Key가 환경 변수에 설정되어 있지 않습니다.',
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
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
});

supabase.auth.onAuthStateChange((event, session) => {
  console.warn('Auth 상태 변경:', event, session); // 이벤트와 세션 정보를 로그로 출력
  if (event === 'SIGNED_IN' && session) {
    console.warn('로그인 상태:', session);
  } else if (event === 'SIGNED_OUT') {
    console.warn('로그아웃 상태:', session);
  }
});

export const resetSupabaseClient = () => {
  try {
    console.log('Supabase 클라이언트 재설정 시도');
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // 새 클라이언트 생성
    const newClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true, // 세션 유지
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
