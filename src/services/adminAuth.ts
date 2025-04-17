// 주의: 이 파일은 서버 측에서만 사용해야 합니다!
// 클라이언트에서 직접 호출하면 보안 위험이 있습니다.

import { createClient } from '@supabase/supabase-js';

// 서비스 역할 키로 Supabase 클라이언트 생성
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
);

// 익명 사용자 생성
export async function createAnonymousUser(key: string) {
  try {
    // 랜덤 이메일 생성
    const randomId = Math.random().toString(36).substring(2, 15);
    const email = `anonymous_${randomId}@example.com`;

    // 랜덤 비밀번호 생성
    const password =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    // 사용자 생성
    const { data: userData, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          is_anonymous: true,
          anonymous_key: key,
          created_at: new Date().toISOString(),
        },
      });

    if (createError) throw createError;

    // 사용자 키 저장
    const { error: keyError } = await supabaseAdmin.from('user_keys').insert({
      user_id: userData.user.id,
      key,
      created_at: new Date().toISOString(),
      is_active: true,
    });

    if (keyError) throw keyError;

    return {
      success: true,
      userId: userData.user.id,
    };
  } catch (error) {
    console.error('익명 사용자 생성 오류:', error);
    return { success: false, error };
  }
}
