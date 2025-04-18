import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

console.log("익명 사용자 생성 함수가 시작되었습니다.")

serve(async (req) => {
  try {
    // CORS 헤더 설정
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Content-Type": "application/json",
    }

    // OPTIONS 요청 처리 (CORS preflight)
    if (req.method === "OPTIONS") {
      return new Response(null, { headers, status: 204 })
    }

    // 요청 본문 파싱
    const { key } = await req.json()

    if (!key || typeof key !== "string" || key.length !== 16) {
      throw new Error("유효하지 않은 키 형식입니다.")
    }

    // 환경 변수에서 Supabase URL과 서비스 역할 키 가져오기
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase 환경 변수가 설정되지 않았습니다.")
    }

    // Admin 권한으로 Supabase 클라이언트 생성
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // 랜덤 이메일 생성
    const randomId = Math.random().toString(36).substring(2, 15)
    const email = `anonymous_${randomId}@example.com`

    // 랜덤 비밀번호 생성
    const password = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

    console.log(`익명 사용자 생성 시작: ${email}`)

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

    if (createError) {
      console.error("사용자 생성 오류:", createError)
      throw createError
    }

    console.log(`사용자 생성 성공: ${userData.user.id}`)

    // 사용자 키 저장 (user_keys 테이블이 있는 경우)
    try {
      const { error: keyError } = await supabaseAdmin.from("user_keys").insert({
        user_id: userData.user.id,
        key,
        created_at: new Date().toISOString(),
        is_active: true,
      })

      if (keyError) {
        console.error("키 저장 오류:", keyError)
        // 키 저장 실패해도 계속 진행
      }
    } catch (keyError) {
      console.error("키 저장 중 예외 발생:", keyError)
      // 키 저장 실패해도 계속 진행
    }

    // 성공 응답
    return new Response(
      JSON.stringify({
        success: true,
        user_id: userData.user.id,
        session: null, // 세션은 반환하지 않음 (리디렉션 방지)
      }),
      { headers },
    )
  } catch (error) {
    console.error("함수 실행 오류:", error)

    // 오류 응답
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "알 수 없는 오류가 발생했습니다.",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    )
  }
})
