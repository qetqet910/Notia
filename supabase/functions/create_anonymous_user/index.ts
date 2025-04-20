import { serve } from 'https://deno.land/x/supabase_edge_serve@1.0.0/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL') ?? '';
const supabaseAnonKey = Deno.env.get('VITE_SUPABASE_ANON_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);
serve(async (req)=>{
  const requestBody = await req.json();
  const { key } = requestBody; // 클라이언트에서 전달된 key
  try {
    // 익명 로그인 시도
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
    if (authError) {
      throw authError;
    }
    // 데이터베이스에 키 저장
    const { error: insertError } = await supabase.from('keys').insert({
      key,
      type: 'anonymous',
      user_id: authData.user?.id,
      is_active: true
    });
    if (insertError) {
      throw insertError;
    }
    return new Response(JSON.stringify({
      userId: authData.user?.id
    }), {
      status: 200
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500
    });
  }
});
