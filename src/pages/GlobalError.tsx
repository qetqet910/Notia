import { Button } from '@/components/ui/button';
import { useNavigate, useRouteError } from 'react-router-dom';

export default function GlobalError() {
  const navigate = useNavigate();
  const error = useRouteError() as unknown;

  console.error(error);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground p-4 text-center">
      <h1 className="text-6xl font-bold text-destructive mb-4">Oops!</h1>
      <h2 className="text-2xl font-semibold">오류가 발생했습니다.</h2>
      <p className="text-muted-foreground mt-2 max-w-md">
        죄송합니다. 예기치 않은 오류가 발생했습니다.<br />
        잠시 후 다시 시도해 주세요.
      </p>
      {error && (
        <div className="mt-4 p-4 bg-muted rounded-md text-sm text-left w-full max-w-lg overflow-auto max-h-40">
          <p className="font-mono">{error.statusText || error.message}</p>
        </div>
      )}
      <div className="flex gap-4 mt-8">
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
