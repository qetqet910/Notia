import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  const errorMessage =
    'Supabase URL과 Anon Key가 환경 변수에 설정되어 있지 않습니다. .env 파일을 확인해주세요.';
  console.error(errorMessage);
  // 렌더링 전에 에러가 발생하면 흰 화면만 보일 수 있으므로, body에 직접 에러 메시지를 씁니다.
  document.body.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background-color: #f8d7da;
      color: #721c24;
      font-family: sans-serif;
      text-align: center;
      padding: 20px;
    ">
      <h1 style="margin-bottom: 10px;">Critical Configuration Error</h1>
      <p style="font-size: 1.2rem;">${errorMessage}</p>
      <p style="font-size: 1rem; margin-top: 20px;">Please contact support or check your environment settings.</p>
    </div>
  `;
  throw new Error(errorMessage);
}

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: localStorage,
    },
    global: {},
  },
);

// supabase.auth.onAuthStateChange((event, session) => {
//   console.warn(`Auth 상태 변경: ${event}`);

//   if (event === 'SIGNED_IN' && session) {
//     console.warn('로그인 상태:', session.user.id);
//   } else if (event === 'SIGNED_OUT') {
//     console.warn('로그아웃 상태');
//   }
// });

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
