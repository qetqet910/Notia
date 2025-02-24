import React from 'react';
import { CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Logo } from '@/components/ui/Logo';
import Lottie from 'lottie-react';
import animationData from '@/stores/login-animation.json';
import logoImage from '../../stores/Logo.png';
import { LoginTabs } from '../../components/features/AuthLogin/LoginTabs';

export const Login: React.FC = () => {
  const { error, isLoading } = useAuth();

  return (
    <div className="flex min-h-screen justify-center">
      {/* 왼쪽 로그인 섹션 */}
      <div className="w-1/2 p-8 flex items-center justify-end">
        <div className="relative w-full h-full max-w-md pt-24">
          <div className="absolute top-0 left-8 scale-125">
            <img src={logoImage} className='w-1/3 ml-8' alt="로고" />
          </div>
          
          <CardContent className="pt-6">
            <h1 className="text-2xl font-bold mb-6 text-left">노트</h1>
            <LoginTabs />
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-center gap-2 mb-4">
                <AlertCircle size={16} />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </CardContent>
        </div>
      </div>
      
      {/* 오른쪽 Lottie 애니메이션 */}
      <div className="w-1/2 flex items-center justify-start align-center">
        <div className="w-3/6 h-3/6">
          <Lottie animationData={animationData} />
        </div>
      </div>
    </div>
  );
};

export default Login;