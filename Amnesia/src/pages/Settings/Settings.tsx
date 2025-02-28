import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Separator } from '../../components/ui/separator';
import { Card, CardContent } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Key, AlertCircle, Loader2, Users, Search } from 'lucide-react';
import { InputOTPControlled } from '../../components/common/Input/Input';
import { useAuth } from '../../hooks/useAuth';
import logoImage from '../../stores/Logo.png';
import Lottie from 'lottie-react';
import animationData from '../../stores/login-animation.json';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [copiedKey, setCopiedKey] = useState(false);
  const [formattedKey, setFormattedKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [activeAuthTab, setActiveAuthTab] = useState('key');

  // Format key (XXXX-XXXX-XXXX-XXXX)
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

  // Copy key to clipboard
  const copyToClipboard = () => {
    if (userKey) {
      navigator.clipboard.writeText(userKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  // Handle login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    generateAndStoreKey();
  };

  // Social login button component
  const SocialLoginButton: React.FC<{
    provider: 'github' | 'google';
    icon: string;
    color: string;
    label: string;
  }> = ({ provider, icon, color, label }) => (
    <Button 
      variant="outline" 
      className="w-full flex items-center justify-center gap-2 h-11 mb-2 hover:shadow-sm"
      style={{ borderColor: color, color }}
      onClick={() => loginWithSocial(provider)}
      disabled={isLoading}
    >
      <img src={icon} alt={provider} className="w-5 h-5" />
      <span>{label}</span>
    </Button>
  );

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-white to-[#e6f7f2]">
      {/* Left login section */}
      <div className="w-full lg:w-1/2 p-4 md:p-8 flex items-center justify-center lg:justify-end lg:pr-16">
        <Card className="relative w-full max-w-md shadow-lg border-[#d8f2ea] overflow-visible">
          <CardContent className="pt-8 pb-6">
            {/* 노트 텍스트 제거하고 로고로 교체 */}
            <div className="flex justify-center items-center mb-6">
              <img src={logoImage} className="w-1/2 object-contain" alt="로고" />
            </div>
            
            <Tabs 
              defaultValue='login' 
              className="space-y-4"
              onValueChange={setActiveTab}
            >
              <TabsList className="grid grid-cols-2 gap-4">
                <TabsTrigger 
                  value="login"
                  className={activeTab === 'login' ? 'text-[#61C9A8] bg-[#e6f7f2]' : ''}
                >
                  로그인
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className={activeTab === 'signup' ? 'text-[#61C9A8] bg-[#e6f7f2]' : ''}
                >
                  회원가입
                </TabsTrigger>
              </TabsList>
              
              {/* 탭 내용 - 기준점을 상단으로 설정 */}
              <div className="relative min-h-[280px]" style={{ transformOrigin: 'top' }}>
                {activeTab === 'login' && (
                  <div className="space-y-4">
                    <form className="space-y-4 mb-6" onSubmit={handleLogin}>
                      <Tabs 
                        defaultValue="key" 
                        className="space-y-4"
                        onValueChange={setActiveAuthTab}
                      >
                        <TabsList className="grid grid-cols-2 gap-4">
                          <TabsTrigger 
                            value="key"
                            className={`flex items-center justify-center gap-2 ${activeAuthTab === 'key' ? 'text-[#61C9A8] bg-[#e6f7f2]' : ''}`}
                          >
                            <Key className="h-4 w-4" />
                            키
                          </TabsTrigger>
                          <TabsTrigger 
                            value="group"
                            className={`flex items-center justify-center gap-2 ${activeAuthTab === 'group' ? 'text-[#61C9A8] bg-[#e6f7f2]' : ''}`}
                          >
                            <Users className="h-4 w-4" />
                            그룹
                          </TabsTrigger>
                        </TabsList>

                        {/* 키/그룹 탭 내용 */}
                        <div className="min-h-[120px]">
                          {activeAuthTab === 'key' && (
                            <div className="space-y-4">
                              <div className="bg-[#f0faf7] p-4 rounded-lg">
                                <InputOTPControlled />
                              </div>
                              <div>
                                <Button 
                                  type="submit" 
                                  className="w-full h-11 bg-[#61C9A8] hover:bg-[#4db596]" 
                                  disabled={isLoading}
                                >
                                  {isLoading ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      처리 중...
                                    </>
                                  ) : (
                                    "로그인"
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}

                          {activeAuthTab === 'group' && (
                            <div className="space-y-4">
                              <div className="bg-[#f0faf7] p-4 rounded-lg">
                                <InputOTPControlled />
                              </div>
                              <div>
                                <Button 
                                  type="submit" 
                                  className="w-full h-11 bg-[#61C9A8] hover:bg-[#4db596]" 
                                  disabled={isLoading}
                                >
                                  그룹 참여하기
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </Tabs>
                
                      <div className="flex justify-end items-center text-sm">
                        <a href="#" className="text-[#61C9A8] hover:underline flex items-center gap-1">
                          <Search size={14} /> 내 노트 찾기
                        </a>
                      </div>
                    </form>
                    
                    <div className="relative my-4">
                      <Separator />
                      <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-sm text-gray-500">
                        또는
                      </span>
                    </div>
                    
                    <div className="space-y-2">
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
                  </div>
                )}
                
                {activeTab === 'signup' && (
                  <div className="space-y-4">
                    <form className="space-y-4 mb-6" onSubmit={handleLogin}>
                      <Tabs defaultValue="key" className="space-y-4">
                        <TabsList className="grid grid-cols-2 gap-4">
                          <TabsTrigger 
                            value="key"
                            className="flex items-center justify-center gap-2"
                          >
                            <Key className="h-4 w-4" />
                            키
                          </TabsTrigger>
                          <TabsTrigger 
                            value="group"
                            className="flex items-center justify-center gap-2"
                          >
                            <Users className="h-4 w-4" />
                            그룹
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="key" className="space-y-4">
                          <div className="bg-[#f0faf7] p-4 rounded-lg">
                            <Input
                              type="email"
                              placeholder="이메일"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="border-[#c5e9de] focus:border-[#61C9A8] focus:ring-[#61C9A8]"
                            />
                            <p className='text-xs text-gray-500 mt-2'>이메일을 입력하지 않으면 백업 키를 받을 수 없어요!</p>
                          </div>
                          
                          <div>
                            <Button 
                              className="w-full h-11 bg-[#61C9A8] hover:bg-[#4db596]"
                              onClick={() => setShowKey(true)}
                            >
                              <Key className="h-4 w-4 mr-2"/>
                              새 키 생성하기
                            </Button>
                          </div>
                        </TabsContent>

                        <TabsContent value="group" className="space-y-4">
                          <div>
                            <Button 
                              onClick={() => setShowKey(true)}
                              className="w-full h-11 bg-[#61C9A8] hover:bg-[#4db596]"
                            >
                              <Users className="h-4 w-4 mr-2" />
                              새 그룹 만들기
                            </Button>
                          </div>
                        </TabsContent>
                      </Tabs>
                  
                      {userKey && showKey && (
                        <div className="mt-6 pt-4 border-t">
                          <div className="flex items-center mb-3">
                            <Key size={18} className="mr-2 text-[#61C9A8]" />
                            <h3 className="text-md font-medium text-[#61C9A8]">노트 키</h3>
                          </div>
                          
                          <div className="flex">
                            <div className="flex-grow relative">
                              <Input
                                readOnly
                                value={formattedKey}
                                className="font-mono text-center tracking-wide border-[#c5e9de]"
                              />
                            </div>
                            <Button
                              variant="outline"
                              size="icon"
                              className="ml-2 border-[#c5e9de] hover:bg-[#f0faf7] hover:border-[#61C9A8]"
                              onClick={copyToClipboard}
                            >
                              <Copy size={16} className="text-[#61C9A8]" />
                            </Button>
                          </div>
                          
                          {copiedKey && (
                            <p className="text-xs text-green-600 mt-1 text-center">
                              노트 키가 복사되었습니다!
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            키를 잃어버리면 데이터에 접근할 수 없습니다. 안전하게 보관하세요.
                          </p>
                        </div>
                      )}
                    </form>
                    
                    <div className="relative my-4">
                      <Separator />
                      <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-sm text-gray-500">
                        또는
                      </span>
                    </div>
                    
                    <div className="space-y-2">
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
                  </div>
                )}
              </div>
            </Tabs>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-center gap-2 mt-4">
                <AlertCircle size={16} />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Right Lottie animation section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 order-first lg:order-last bg-gradient-to-b lg:bg-gradient-to-r from-white to-[#e6f7f2]">
        <div className="w-full max-w-md">
          <div className="w-full md:w-4/5 mx-auto">
            <Lottie 
              animationData={animationData} 
              className="drop-shadow-xl"
            />
          </div>
          
          <div className="text-center mt-6">
            <h2 className="text-xl md:text-2xl font-bold text-[#61C9A8]">안전하게 기록하세요</h2>
            <p className="text-gray-600 mt-2 max-w-sm mx-auto">
              암네시아는 당신의 생각과 아이디어를 안전하게 보관합니다. 언제 어디서나 접근하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;