import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 요청 본문 파싱
    const { email } = await req.json()

    // Supabase 클라이언트 생성
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 랜덤 키 생성
    const generateRandomKey = (length: number) => {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
      let result = ''
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }

    // 랜덤 비밀번호 생성
    const password = generateRandomKey(12)
    const key = generateRandomKey(16)

    // 1. 사용자 생성
    let userEmail = email
    if (!userEmail) {
      userEmail = `anon-${Date.now()}@amnesia.app`
    }

    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: userEmail,
      password: password,
      email_confirm: true
    })

    if (userError) {
      throw userError
    }

    const userId = userData.user.id

    // 2. 사용자 키 저장
    const { error: keyError } = await supabase
      .from('user_keys')
      .insert({
        user_id: userId,
        key: key,
        created_at: new Date().toISOString(),
        is_active: true
      })

    if (keyError) {
      throw keyError
    }

    // 3. 사용자 프로필 생성
    const displayName = email ? email.split('@')[0] : '익명 사용자'
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        display_name: displayName,
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('프로필 생성 오류:', profileError)
    }

    // 4. 세션 생성
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.createSession({
      user_id: userId
    })

    if (sessionError) {
      throw sessionError
    }

    return new Response(
      JSON.stringify({
        user: userData.user,
        key: key,
        session: sessionData
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      }
    )
  }
})