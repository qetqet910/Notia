import { supabase } from '@/services/supabaseClient';

export const checkCreationLimit = async (
  clientIP: string,
): Promise<{ allowed: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.rpc(
      'check_and_log_creation_attempt',
      {
        request_ip: clientIP,
      },
    );

    if (error) {
      return {
        allowed: false,
        error: '키 생성 가능 여부를 확인하는 중 오류가 발생했습니다.',
      };
    }

    if (data === false) {
      return {
        allowed: false,
        error: '너무 많은 계정을 생성했습니다. 30분 후에 다시 시도해주세요.',
      };
    }

    return { allowed: true };
  } catch (error) {
    return {
      allowed: false,
      error:
        (error instanceof Error ? error.message : String(error)) ||
        '알 수 없는 오류가 발생했습니다.',
    };
  }
};
