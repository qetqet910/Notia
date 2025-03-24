import { supabase } from "@/services/supabase";
import { generateRandomKey, formatKey } from "@/utils/keys";

// 익명 로그인으로 키 생성 (수정: 로그인하지 않고 키만 생성)
export async function createAnonymousKey() {
  try {
    // 1. 랜덤 키 생성
    const key = generateRandomKey(16);

    // 2. UUID 생성 (���용자 ID로 사용)
    const userId = generateUUID();

    // 3. 키 저장
    const { error: keyError } = await supabase.from("user_keys").insert({
      user_id: userId,
      key: key,
      created_at: new Date().toISOString(),
      is_active: true,
    });

    if (keyError) {
      console.error("키 저장 오류:", keyError);
      throw keyError;
    }

    // 4. 사용자 프로필 생성
    const { error: profileError } = await supabase
      .from("user_profiles")
      .insert({
        user_id: userId,
        display_name: `User-${userId.substring(0, 6)}`,
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error("프로필 생성 오류:", profileError);
      // 프로필 생성 실패해도 계속 진행
    }

    return {
      success: true,
      key: key,
      formattedKey: formatKey(key),
    };
  } catch (err) {
    console.error("익명 키 생성 오류:", err);
    throw err;
  }
}

// UUID 생성 함수
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
