import { supabase } from '@/services/supabaseClient';

export const checkCreationLimit = async (
  clientIP: string,
): Promise<{ allowed: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('creation_attempts')
      .select('created_at')
      .eq('client_ip', clientIP)
      .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()) // 30분 이내
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 30분 내 3회 이상 시도 확인
    if (data && data.length >= 3) {
      return {
        allowed: false,
        error: '너무 많은 계정을 생성했습니다. 30분 후에 다시 시도해주세요.',
      };
    }

    return { allowed: true };
  } catch (error) {
    // 오류 발생해도 생성은 허용 (보안보다 사용성 우선)
    console.error('생성 제한 확인 오류:', error);
    return {
      allowed: false,
      error: (error as Error).message || 'Unknown error',
    };
  }
};
