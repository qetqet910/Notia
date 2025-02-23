import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Separator } from '../../components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Key, AlertCircle, Loader2, Users } from 'lucide-react';
import { InputOTPControlled } from '../../components/common/Input/Input';
import { useAuth } from '../../hooks/useAuth';
import { Logo } from '../../components/ui/Logo';
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
    <div className="flex min-h-screen justify-center">
      {/* 왼쪽 로그인 섹션 */}
      <div className="w-1/4 p-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <h1 className="text-2xl font-bold mb-6 text-center"><Logo /></h1>
            <Tabs defaultValue='login' className="space-y-4">
              <TabsList className="grid grid-cols-2 gap-4">
                <TabsTrigger value="login">노트 로그인</TabsTrigger>
                <TabsTrigger value="signup">노트 회원가입</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="space-y-4">
              <form className="space-y-4 mb-6" onSubmit={handleLogin}>
                  <Tabs defaultValue="key" className="space-y-4">
                    <TabsList className="grid grid-cols-2 gap-4">
                      <TabsTrigger value="key">키</TabsTrigger>
                      <TabsTrigger value="group">그룹</TabsTrigger>
                    </TabsList>

                    <TabsContent value="key" className="space-y-4">
                      <InputOTPControlled />
                    </TabsContent>

                    <TabsContent value="group" className="space-y-4">

                      {/* {activeGroup && (
                        <div className="p-4 bg-gray-100 rounded-lg">
                          <p className="text-sm text-gray-600 mb-2">그룹 초대 코드:</p>
                          <code className="block text-center">{activeGroup.code}</code>
                        </div>
                      )} */}
                      <InputOTPControlled />
                      <Button variant="outline" className="w-full">
                        그룹 참여하기
                      </Button>
                    </TabsContent>
                  </Tabs>
              
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

              <div className="flex justify-end items-center text-sm">
                <a href="#" className="text-blue-600 hover:underline">내 노트 찾기</a>
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
              </TabsContent>
              <TabsContent value="signup" className="space-y-4">
              <form className="space-y-4 mb-6" onSubmit={handleLogin}>
                  <Tabs defaultValue="key" className="space-y-4">
                    <TabsList className="grid grid-cols-2 gap-4">
                      <TabsTrigger value="key">키</TabsTrigger>
                      <TabsTrigger value="group">그룹</TabsTrigger>
                    </TabsList>

                    <TabsContent value="key" className="space-y-4">
                      <Input
                        type="email"
                        placeholder="이메일 (선택사항)"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <p>이메일을 입력하지 않으면 백업 키를 받을 수 없어요 !</p>
                      
                      <Button 
                        className="w-full"
                      >
                        <Key className="h-4 w-4 mr-2" />
                        새 키 생성하기
                      </Button>

                    </TabsContent>

                    <TabsContent value="group" className="space-y-4">
                      <Button 
                        // onClick={() => {
                        //   const { groupId, inviteCode } = createCollaborativeGroup();
                        //   setActiveGroup({ id: groupId, code: inviteCode });
                        // }}
                        className="w-full"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        새 그룹 만들기
                      </Button>

                      {/* {activeGroup && (
                        <div className="p-4 bg-gray-100 rounded-lg">
                          <p className="text-sm text-gray-600 mb-2">그룹 초대 코드:</p>
                          <code className="block text-center">{activeGroup.code}</code>
                        </div>
                      )} */}
                      <InputOTPControlled />
                      {/* <Button variant="outline" className="w-full">
                        그룹 참여하기
                      </Button> */}
                    </TabsContent>
                  </Tabs>
              
              {/* <Button type="submit" className="w-full h-12" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    처리 중...
                  </>
                ) : (
                  "로그인"
                )}
              </Button> */}
            {/* API 키 표시 섹션 - 인증 성공 시에만 표시 */}
            {userKey && (
              <div className="mt-8 pt-6 border-t">
                <div className="flex items-center mb-3">
                  <Key size={18} className="mr-2" />
                  <h3 className="text-md font-medium">노트 키</h3>
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
                  <p className="text-xs text-green-600 mt-1 text-center">노트 키가 복사되었습니다!</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  키를 잃어버리면 데이터에 접근할 수 없습니다. 안전하게 보관하세요.
                </p>
              </div>
            )}
              {/* <div className="flex justify-end items-center text-sm">
                <a href="#" className="text-blue-600 hover:underline">내 노트 찾기</a>
              </div> */}
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
                label="GitHub로 노트 만들기"
              />
              <SocialLoginButton 
                provider="google" 
                icon="/icons/google.svg" 
                color="#DB4437" 
                label="Google로 노트 만들기"
              />
            </div>
              </TabsContent>
            </Tabs>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-center gap-2 mb-4">
                <AlertCircle size={16} />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* 오른쪽 Lottie 애니메이션 */}
      <div className="w-1/4 flex items-center justify-center align-center">
        <div className="w-4/6 h-4/6">
            <Lottie animationData={animationData} />
        </div>
      </div>
    </div>
  );
};

export default Login;
