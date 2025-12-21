import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// 1. window.__ENV__ (HTML 주입) 확인
// 2. import.meta.env (Vite define 치환) 확인
const SUPABASE_URL = 
  window.__ENV__?.VITE_SUPABASE_URL || 
  import.meta.env.VITE_SUPABASE_URL;

const SUPABASE_ANON_KEY = 
  window.__ENV__?.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  const errorMessage =
    'Supabase URL과 Anon Key가 환경 변수에 설정되어 있지 않습니다.';
  
  console.error(errorMessage, {
    URL_Exists: !!SUPABASE_URL,
    Key_Exists: !!SUPABASE_ANON_KEY,
    Source: window.__ENV__ ? 'window.__ENV__' : 'import.meta.env'
  });

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
      <div style="text-align: left; background: rgba(0,0,0,0.1); padding: 10px; margin-top: 20px; border-radius: 4px;">
        <p><strong>URL:</strong> ${SUPABASE_URL ? '✅ Loaded' : '❌ Missing'}</p>
        <p><strong>Key:</strong> ${SUPABASE_ANON_KEY ? '✅ Loaded' : '❌ Missing'}</p>
        <p><strong>Inject Method:</strong> ${window.__ENV__ ? 'HTML Injection' : 'Vite Define'}</p>
      </div>
      <p style="font-size: 1rem; margin-top: 20px;">Please check .env file and rebuild.</p>
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
      detectSessionInUrl: false,
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
