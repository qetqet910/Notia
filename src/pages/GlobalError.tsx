import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate, useRouteError } from 'react-router-dom';
import { supabase } from '@/services/supabaseClient';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/useToast';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';

export default function GlobalError() {
  const navigate = useNavigate();
  const error = useRouteError() as any;
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  console.error('Global Error Captured:', error);

  const handleSendError = async () => {
    setLoading(true);
    try {
      const errorMessage = error?.message || error?.statusText || '알 수 없는 오류';
      const errorStack = error?.stack || JSON.stringify(error, null, 2);
      
      const { error: dbError } = await supabase.from('feedback').insert({
        user_id: user?.id || null,
        message: `[시스템 오류 리포트]\n메시지: ${errorMessage}\n\n상세 정보:\n${errorStack}`,
        category: 'bug',
      });

      if (dbError) throw dbError;

      toast({
        title: '오류 정보 전송 완료',
        description: '개발자에게 오류 정보가 성공적으로 전달되었습니다. 감사합니다!',
      });
    } catch (err) {
      console.error('Failed to send error report:', err);
      toast({
        title: '전송 실패',
        description: '오류 정보를 보내는 중 문제가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground p-4 text-center">
      <h1 className="text-6xl font-bold text-destructive mb-4">Oops!</h1>
      <h2 className="text-2xl font-semibold">오류가 발생했습니다.</h2>
      <p className="text-muted-foreground mt-2 max-w-md">
        죄송합니다. 예기치 않은 오류가 발생했습니다.<br />
        잠시 후 다시 시도해 주세요.
      </p>

      {/* 사용자 요청에 따라 화면상의 에러 상세 메시지는 노출하지 않음 */}

      <div className="flex flex-wrap justify-center gap-4 mt-8">
        <Button onClick={handleSendError} variant="secondary" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          개발자에게 보내기
        </Button>
        <Button onClick={() => window.location.reload()} variant="outline">
          새로고침
        </Button>
        <Button onClick={() => navigate('/')}>
          홈으로 돌아가기
        </Button>
      </div>
    </div>
  );
}
