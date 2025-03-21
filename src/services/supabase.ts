import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase URL과 Anon Key가 설정되지 않았습니다. .env 파일을 확인하세요."
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  // auth: {
  //   persistSession: true,
  //   autoRefreshToken: true,
  // },
});

// export type UserData = {
//   id: string;
//   email?: string;
//   user_key?: string;
//   created_at: string;
// };
