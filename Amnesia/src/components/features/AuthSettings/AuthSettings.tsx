// src/components/features/AuthSettings/AuthSettings.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Separator } from '../../../components/ui/separator';
import { useAuth } from '../../../hooks/useAuth';
import { AlertCircle, Github, Mail, Key, Shield, Loader2, Unlock } from 'lucide-react';
    
export const AuthSettings: React.FC = () => {
  const {
    userKey,
    isAuthenticated,
    socialConnections,
    isLoading,
    error,
    generateAndStoreKey,
    loginWithSocial,
    bindKeyWithSocial,
    backupKeyToEmail
  } = useAuth();
  
  const [backupEmail, setBackupEmail] = useState('');
  const [showKey, setShowKey] = useState(false);
  
  const handleGenerateKey = () => {
    const newKey = generateAndStoreKey();
    if (newKey) {
      // 성공 메시지 표시 로직
    }
  };
  
  const handleGithubLogin = async () => {
    await loginWithSocial('github');
  };
  
  const handleGoogleLogin = async () => {
    await loginWithSocial('google');
  };
  
  const handleBindWithGithub = async () => {
    await bindKeyWithSocial('github');
  };
  
  const handleBindWithGoogle = async () => {
    await bindKeyWithSocial('google');
  };
  
  const handleBackupKey = async () => {
    if (!backupEmail) return;
    await backupKeyToEmail(backupEmail);
  };
  
  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield size={20} />
          인증 설정
        </CardTitle>
        <CardDescription>
          개인 접근 키를 생성하고 소셜 계정과 연동하세요
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-center gap-2">
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
          </div>
        )}
        
        {/* 키 관리 섹션 */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Key size={16} />
            접근 키 관리
          </h3>
          
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center space-x-2">
              <Input 
                type={showKey ? "text" : "password"}
                value={userKey || ''} 
                placeholder="아직 생성된 키가 없습니다"
                disabled
                className="font-mono"
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? "숨기기" : "보기"}
              </Button>
            </div>
            
            <Button
              onClick={handleGenerateKey}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : userKey ? (
                "새 키 생성"
              ) : (
                "16자리 키 생성"
              )}
            </Button>
          </div>
          
          {userKey && (
            <p className="text-xs text-muted-foreground">
              키를 잃어버리면 데이터에 접근할 수 없습니다. 안전하게 보관하세요.
            </p>
          )}
        </div>
        
        <Separator />
        
        {/* 키 백업 섹션 */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Mail size={16} />
            키 백업
          </h3>
          
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center space-x-2">
              <Input
                type="email"
                placeholder="이메일 주소"
                value={backupEmail}
                onChange={(e) => setBackupEmail(e.target.value)}
                disabled={!userKey || isLoading}
              />
              <Button
                type="button"
                disabled={!userKey || !backupEmail || isLoading}
                variant="outline"
                onClick={handleBackupKey}
              >
                백업
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              키를 이메일로 안전하게 백업합니다.
            </p>
          </div>
        </div>
        
        <Separator />
        
        {/* 소셜 계정 연동 섹션 */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Unlock size={16} />
            소셜 계정 연동
          </h3>
          
          <div className="grid grid-cols-1 gap-3">
            {/* GitHub 연동 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Github size={18} />
                <span>GitHub 연동</span>
                {socialConnections?.github && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                    연결됨
                  </span>
                )}
              </div>
              
              <Button
                size="sm"
                variant={socialConnections?.github ? "outline" : "default"}
                onClick={userKey ? handleBindWithGithub : handleGithubLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : socialConnections?.github ? (
                  "재연결"
                ) : (
                  "연결하기"
                )}
              </Button>
            </div>
            
            {/* Google 연동 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
                  <path fill="#4285F4" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z"/>
                </svg>
                <span>Google 연동</span>
                {socialConnections?.google && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                    연결됨
                  </span>
                )}
              </div>
              
              <Button
                size="sm"
                variant={socialConnections?.google ? "outline" : "default"}
                onClick={userKey ? handleBindWithGoogle : handleGoogleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : socialConnections?.google ? (
                  "재연결"
                ) : (
                  "연결하기"
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex-col space-y-2">
        <div className="text-xs text-muted-foreground">
          <p>
            {isAuthenticated ? (
              "인증이 완료되었습니다. 이제 모든 기능을 사용할 수 있습니다."
            ) : (
              "인증이 필요합니다. 키를 생성하거나 소셜 계정으로 로그인하세요."
            )}
          </p>
        </div>
      </CardFooter>
    </Card>
  );
};

export default AuthSettings;