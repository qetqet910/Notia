# Supabase 함수 코드 가이드

이 마크다운 파일은 `create_anonymous_user` 함수와 CORS 설정을 업데이트하는 데 필요한 코드를 포함하고 있습니다. 아래 코드를 복사하여 Supabase 대시보드의 해당 위치에 붙여넣으세요.

---

## 1. `create_anonymous_user` 함수 코드

**경로:** `supabase/functions/create_anonymous_user/index.ts`

이 파일의 전체 내용을 아래 코드로 교체하세요.

```typescript
import { serve } from 'https://deno.land/std@0.162.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // OPTIONS 요청 처리 (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { key, terms_agreed } = await req.json();
    if (!key) {
      return new Response(JSON.stringify({ error: 'Key is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      },
    );

    const email = `anon_${key.toLowerCase()}@notia.com`;
    const password = key;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      // 이미 존재하는 사용자인 경우, 로그인 시도
      if (authError.message.includes('User already registered')) {
        const { data: loginData, error: loginError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (loginError) {
          return new Response(JSON.stringify({ error: loginError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(
          JSON.stringify({ success: true, user: loginData.user }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }

      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!authData.user) {
      return new Response(JSON.stringify({ error: 'User not created' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error: profileError } = await supabase.from('users').insert({
      id: authData.user.id,
      key: key,
      terms_agreed: terms_agreed,
      email: email,
    });

    if (profileError) {
      // 프로필 생성 실패 시, 생성된 사용자 롤백
      const { data: adminData, error: adminError } =
        await supabase.auth.admin.deleteUser(authData.user.id);

      if (adminError) {
        // 롤백 실패 시 에러 로깅 (실제 운영 환경에서는 더 나은 로깅 방식 고려)
        console.error('Failed to rollback user:', adminError.message);
      }

      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ success: true, user: authData.user }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

---

## 2. `cors.ts` 공유 파일 코드

**경로:** `supabase/functions/_shared/cors.ts`

이 파일의 전체 내용을 아래 코드로 교체하세요.

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};
```

회원가입 해결 O
(진짜 존나게 많고 복잡하고 그지같은 UX, 오류)잡다한 코드 해결

반응형 최적화
Naver, Google SEO 노출 
랜딩페이지 사진 변경

다른 플랫폼 개설 github codespace처럼
LightHouse 측정 후 개선 https://pagespeed.web.dev/

로그, 주석 제거