import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Separator } from '../../components/ui/separator';
import { Card, CardContent } from '../../components/ui/card';
import { Copy, Eye, EyeOff, Key, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Lottie from 'lottie-react';
import animationData from '../../stores/login-animation.json'; 

export const Login: React.FC = () => {
  const {
    userKey,
    isAuthenticated,
    isLoading,
    error,
    generateAndStoreKey,
    loginWithSocial
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [formattedKey, setFormattedKey] = useState('');

  // Lottie 애니메이션 옵션
  const defaultOptions = {
    loop: true,
    autoplay: true, 
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice'
    }
  };

  // 키를 포맷팅하여 표시 (XXXX-XXXX-XXXX-XXXX 형식)
  useEffect(() => {
    if (userKey) {
      const chunks = [];
      for (let i = 0; i < userKey.length; i += 4) {
        chunks.push(userKey.substring(i, i + 4));
      }
      setFormattedKey(chunks.join('-'));
    } else {
      setFormattedKey('');
    }
  }, [userKey]);

  // API 키 복사 기능
  const copyToClipboard = () => {
    if (userKey) {
      navigator.clipboard.writeText(userKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  // 일반 로그인 처리
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // 여기서는 키 생성으로 대체 (실제로는 이메일/비밀번호 인증 구현 필요)
    generateAndStoreKey();
  };

  // 소셜 로그인 버튼 컴포넌트
  const SocialLoginButton: React.FC<{
    provider: 'github' | 'google';
    icon: string;
    color: string;
    label: string;
  }> = ({ provider, icon, color, label }) => (
    <Button 
      variant="outline" 
      className="w-full flex items-center justify-center gap-2 h-12 mb-2"
      style={{ borderColor: color, color }}
      onClick={() => loginWithSocial(provider)}
      disabled={isLoading}
    >
      <img src={icon} alt={provider} className="w-5 h-5" />
      <span>{label}</span>
    </Button>
  );

  return (
    <div className="flex min-h-screen">
      {/* 왼쪽 로그인 섹션 */}
      <div className="w-1/2 p-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <h1 className="text-2xl font-bold mb-6 text-center">내 계정 로그인</h1>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-center gap-2 mb-4">
                <AlertCircle size={16} />
                <span className="text-sm">{error}</span>
              </div>
            )}
            
            {/* 기본 로그인 */}
            <form className="space-y-4 mb-6" onSubmit={handleLogin}>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">이메일</label>
                <Input
                  id="email"
                  type="email"
                  placeholder="이메일을 입력하세요"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">비밀번호</label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="비밀번호를 입력하세요"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <Button type="submit" className="w-full h-12" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    처리 중...
                  </>
                ) : (
                  "로그인"
                )}
              </Button>
              
              <div className="flex justify-between items-center text-sm">
                <a href="#" className="text-blue-600 hover:underline">비밀번호 찾기</a>
                <a href="#" className="text-blue-600 hover:underline">회원가입</a>
              </div>
            </form>
            
            {/* 구분선 */}
            <div className="relative my-6">
              <Separator />
              <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-sm text-gray-500">
                또는
              </span>
            </div>
            
            {/* 소셜 로그인 */}
            <div className="space-y-3">
              <SocialLoginButton 
                provider="github"
                icon="/icons/github.svg" 
                color="#24292e" 
                label="GitHub로 로그인"
              />
              <SocialLoginButton 
                provider="google" 
                icon="/icons/google.svg" 
                color="#DB4437" 
                label="Google로 로그인"
              />
            </div>
            
            {/* API 키 표시 섹션 - 인증 성공 시에만 표시 */}
            {isAuthenticated && userKey && (
              <div className="mt-8 pt-6 border-t">
                <div className="flex items-center mb-3">
                  <Key size={18} className="mr-2" />
                  <h3 className="text-md font-medium">API 키</h3>
                </div>
                
                <div className="flex">
                  <div className="flex-grow relative">
                    <Input
                      readOnly
                      value={formattedKey}
                      className="font-mono text-center tracking-wide"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="ml-2"
                    onClick={copyToClipboard}
                  >
                    <Copy size={16} />
                  </Button>
                </div>
                
                {copiedKey && (
                  <p className="text-xs text-green-600 mt-1 text-center">API 키가 복사되었습니다!</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  키를 잃어버리면 데이터에 접근할 수 없습니다. 안전하게 보관하세요.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* 오른쪽 Lottie 애니메이션 */}
      <div className="w-1/2 bg-blue-50 flex items-center justify-center">
        <div className="w-4/5 h-4/5">
            <Lottie animationData={animationData} />
        </div>
      </div>
    </div>
  );
};

export default Login;
