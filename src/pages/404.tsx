import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-white to-[#e6f7f2] p-4">
      <div className="text-center max-w-md">
        <h1 className="text-9xl font-bold text-[#61C9A8]">404</h1>
        
        <div className="mt-4 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">페이지를 찾을 수 없습니다</h2>
          <p className="text-gray-600">
            찾으시는 페이지가 존재하지 않거나, 이동되었거나<br/>삭제되었을 수 있습니다.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            variant="outline" 
            className="flex items-center gap-2 border-[#61C9A8] text-[#61C9A8] hover:bg-[#e6f7f2]"
            onClick={() => window.history.back()}
          >
            <ArrowLeft size={16} />
            이전 페이지로
          </Button>
          
          <Link to="/">
            <Button className="flex items-center gap-2 bg-[#61C9A8] hover:bg-[#4db596] w-full sm:w-auto">
              <Home size={16} />
              홈으로 이동
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="mt-12 text-center">
        <p className="text-gray-500 text-sm">
          도움이 필요하시면 <a href="mailto:support@example.com" className="text-[#61C9A8] hover:underline">고객센터</a>로 문의해주세요.
        </p>
      </div>
    </div>
  );
};

export default NotFound;