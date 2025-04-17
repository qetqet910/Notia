import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  try {
    // 환경 변수에서 Supabase URL과 서비스 역할 키 가져오기
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""

    // Admin 권한으로 Supabase 클라이언트 생성
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // 요청 본문에서 데이터 가져오기
    const { key } = await req.json()

    // 랜덤 이메일 생성
    const randomId = Math.random().toString(36).substring(2, 15)
    const email = `anonymous_${randomId}@example.com`

    // 랜덤 비밀번호 생성
    const password = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

    // 사용자 생성
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        is_anonymous: true,
        anonymous_key: key,
        created_at: new Date().toISOString(),
      },
    })

    if (createError) throw createError

    // 사용자 키 저장
    const { error: keyError } = await supabaseAdmin.from("user_keys").insert({
      user_id: userData.user.id,
      key,
      created_at: new Date().toISOString(),
      is_active: true,
    })

    if (keyError) throw keyError

    // 성공 응답
    return new Response(
      JSON.stringify({
        success: true,
        user_id: userData.user.id,
      }),
      { headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    // 오류 응답
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
})
