import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL과 Anon Key가 환경 변수에 설정되어 있지 않습니다.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: localStorage,
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  },
});

export const resetSupabaseClient = () => {
  try {
    console.log('Supabase 클라이언트 재설정 시도');

    // 기존 세션 데이터 백업
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // 새 클라이언트 생성
    const newClient = createClient(supabaseUrl, supabaseAnonKey, {
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
