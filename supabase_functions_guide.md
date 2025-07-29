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
LightHouse 측정 후 개선 https://pagespeed.web.dev/
랜딩페이지 사진 변경
다른 플랫폼 개설 github codespace처럼

다른거말고 dashboard 낙관적 업데이트부터 ㄱㄱ
✦ 모든 수정이 완료되었습니다.

  최종 해결 내역:

   1. 데이터 흐름 단순화: Editor는 이제 전체 노트 객체를 관리하는
      대신, 사용자가 수정한 title, content와 파싱된 tags,
      reminders 데이터 조각들만 onSave를 통해 상위로 전달합니다.
   2. `useNotes` 책임 강화: updateNote 함수는 Editor로부터 받은
      데이터 조각들을 useDataStore의 최신 원본 데이터와 병합하여,
      전체 노트 객체에 대한 완전한 낙관적 업데이트를 수행합니다.
   3. 상태 동기화 문제 해결: Editor가 더 이상 오래된 note prop에
      의존하지 않으므로, 여러 번 연속으로 리마인더를
      추가/수정하거나 다른 노트를 빠르게 오가도 상태가 꼬이는
      문제가 발생하지 않습니다.

  이것으로 리마인더 낙관적 업데이트와 관련된 모든 문제가
  해결되었을 것입니다. 확인 부탁드립니다.

로그, 주석 제거

╭──────────────────────────────────────────────────────────────────╮
│  > @src/pages/dashboard/index.tsx 에서 shortcuts 말야 ctrl+s는   │
│    수정 한 게 없어도 작동해 수정버튼 disabled 처럼 플래그를      │
│    추가해서 수정한 게 없으면 저장할 수 없게 해주고 현재 다른     │
│    수정중이라면 ctrl+s를 제외한 다른 단축키를 사용할 수 없게     │
│    해주고 esc 누르면 취소 버튼 역할을 추가해줘                   │
╰──────────────────────────────────────────────────────────────────╯

 ╭──────────────────────────────────────────────────────────────────────╮
 │ ✔  ReadManyFiles Will attempt to read and concatenate files using p… │
 │                                                                      │
 │    ### ReadManyFiles Result (Target Dir:                             │
 │    `/workspaces/Notia`)                                              │
 │                                                                      │
 │    Successfully read and concatenated content from **1               │
 │    file(s)**.                                                        │
 │                                                                      │
 │    **Processed Files:**                                              │
 │    - `src/pages/dashboard/index.tsx`                                 │
 ╰──────────────────────────────────────────────────────────────────────╯
✦ 알겠습니다. 단축키 사용성과 관련된 좋은 개선 의견입니다.
  dashboard/index.tsx의 handleKeyboardShortcuts 함수를 수정하여
  요청하신 세 가지 기능을 모두 구현하겠습니다.

  요구사항 정리:

   1. `Ctrl+S` 개선: Editor에 수정된 내용이 있을 때만 저장 단축키가
      동작하도록 변경.
   2. 편집 모드 집중: isEditing 상태일 때는 Ctrl+S와 Esc를 제외한 다른
      전역 단축키가 동작하지 않도록 변경.
   3. `Esc` 키 추가: isEditing 상태에서 Esc 키를 누르면 '취소' 버튼처럼
      동작하도록 변경.

  해결 계획:

   1. Editor 컴포넌트가 수정 여부(isDirty)를 부모인 Dashboard 컴포넌트로
       알려줄 수 있는 방법이 필요합니다. onDirtyChange와 같은 콜백
      prop을 Editor에 추가하겠습니다.
   2. Dashboard 컴포넌트에 isDirty 상태를 추가하고, Editor로부터 받은
      값으로 이 상태를 관리합니다.
   3. handleKeyboardShortcuts 함수 내부 로직을 수정하여, isEditing과
      isDirty 상태에 따라 단축키 동작을 분기 처리합니다.

  먼저 Editor 컴포넌트가 수정 여부를 부모에게 알릴 수 있도록
  editor.tsx 파일부터 수정하겠습니다. onDirtyChange prop을 추가하고,
  내용이 변경될 때마다 이 콜백을 호출하도록 합니다.