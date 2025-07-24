import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
      <h1 className="text-9xl font-bold text-primary">404</h1>
      <h2 className="text-2xl font-semibold mt-4">페이지를 찾을 수 없습니다.</h2>
      <p className="text-muted-foreground mt-2">
        요청하신 페이지가 존재하지 않거나, 이동되었을 수 있습니다.
      </p>
      <Button onClick={() => navigate('/')} className="mt-8">
        홈으로 돌아가기
      </Button>
    </div>
  );
}
