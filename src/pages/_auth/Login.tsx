import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Key, Loader2 } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, useAnimation } from 'framer-motion';
import { supabase } from '@/services/supabaseClient';

import { Toaster } from '@/components/ui/toaster';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { InputOTPControlled } from '@/components/features/inputOtpControl';
import { useAuthStore } from '@/stores/authStore';
import { KeyDisplay } from '@/components/features/keyDisplay';
import { useToast } from '@/hooks/useToast';
import { generateRandomKey, formatKey } from '@/utils/keyValidation';
import { animations } from '@/constants/animations';

import logoImage from '@/assets/images/Logo.png';
import loginAnimation from '/lottie/loginAnimation.lottie';

// --- Memoized Sub-components ---

const SocialLoginButton = React.memo<{
  provider: 'github' | 'google';
  icon: string;
  color: string;
  label: string;
  onClick: (provider: 'github' | 'google') => void;
  disabled: boolean;
  keyPrefix: string;
}>(({ provider, icon, color, label, onClick, disabled, keyPrefix }) => (
  <motion.div
    key={`${keyPrefix}-${provider}`}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Button
      variant="outline"
      className="w-full flex items-center justify-center gap-2 h-11 mb-2 hover:shadow-sm"
      style={{ borderColor: color, color }}
      onClick={() => onClick(provider)}
      disabled={disabled}
    >
      <img
        src={icon || '/placeholder.svg'}
        alt={provider}
        className="w-5 h-5"
      />
      <span>{label}</span>
    </Button>
  </motion.div>
));
SocialLoginButton.displayName = 'SocialLoginButton';

const AnimationSection = React.memo(() => {
  return (
    <motion.div
      className="w-full lg:w-1/2 flex items-center justify-center lg:justify-start p-8 order-first lg:order-last bg-gradient-to-b lg:bg-gradient-to-r from-white to-[#e6f7f2]"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      <div className="w-full max-w-md">
        <div className="w-full aspect-square mx-auto">
          <DotLottieReact
            src={loginAnimation}
            loop
            autoplay={true}
            className="drop-shadow-xl w-full h-full"
          />
        </div>
        <motion.div
          className="text-center mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <motion.h2
            className="text-xl md:text-2xl font-bold text-[#61C9A8]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            순간을 기록하세요,
          </motion.h2>
          <motion.p
            className="text-gray-600 mt-2 max-w-sm mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            중요한 순간으로 내일을 만들어 드릴게요.
            <br />
            언제, 어디서나 기록하세요.
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  );
});
AnimationSection.displayName = 'AnimationSection';

const LoginForm = React.memo<{
  isLoginLoading: boolean;
  onSocialLogin: (provider: 'github' | 'google') => void;
}>(({ isLoginLoading, onSocialLogin }) => (
  <motion.div
    key="login-form-tab"
    initial="hidden"
    animate="visible"
    exit="exit"
    variants={animations.tabContent}
    className="space-y-4"
  >
    <form className="space-y-4 mb-6">
      <div className="min-h-[120px]">
        <motion.div
          key="key-login-tab"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={animations.tabContent}
          className="space-y-4"
        >
          <motion.div
            key="key-input"
            className="bg-[#f0faf7] p-4 rounded-lg"
            variants={animations.item}
          >
            <InputOTPControlled />
          </motion.div>
          <motion.div key="key-button" variants={animations.item}>
            <Button
              type="submit"
              className="w-full h-11 bg-[#61C9A8] hover:bg-[#4db596]"
              disabled={isLoginLoading}
            >
              {isLoginLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>처리 중...</span>
                </div>
              ) : (
                '로그인'
              )}
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </form>

    <motion.div
      key="login-separator"
      className="relative my-4"
      variants={animations.item}
    >
      <Separator />
      <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-sm text-gray-500">
        또는
      </span>
    </motion.div>

    <motion.div
      key="login-social"
      className="space-y-2"
      variants={animations.stagger}
    >
      <SocialLoginButton
        provider="github"
        icon="/icons/github.svg"
        color="#24292e"
        label="GitHub로 로그인"
        onClick={onSocialLogin}
        disabled={isLoginLoading}
        keyPrefix="login"
      />
      <SocialLoginButton
        provider="google"
        icon="/icons/google.svg"
        color="#DB4437"
        label="Google로 로그인"
        onClick={onSocialLogin}
        disabled={isLoginLoading}
        keyPrefix="login"
      />
    </motion.div>
  </motion.div>
));
LoginForm.displayName = 'LoginForm';

const SignupForm = React.memo<{
  isRegisterLoading: boolean;
  email: string;
  setEmail: (email: string) => void;
  formattedKey: string | null;
  showKey: boolean;
  copiedKey: boolean;
  handleCreateEmailKey: (e: React.FormEvent) => void;
  handleCreateAnonymousKey: (e: React.FormEvent) => void;
  copyToClipboard: (text: string) => void;
  onSocialLogin: (provider: 'github' | 'google') => void;
}>(
  ({
    isRegisterLoading,
    email,
    setEmail,
    formattedKey,
    showKey,
    copiedKey,
    handleCreateEmailKey,
    handleCreateAnonymousKey,
    copyToClipboard,
    onSocialLogin,
  }) => (
    <motion.div
      key="signup-form-tab"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={animations.tabContent}
      className="space-y-4"
    >
      <div className="space-y-4">
        <motion.div key="create-email-key-form" variants={animations.item}>
          <form onSubmit={handleCreateEmailKey} className="space-y-3">
            <div>
              <Input
                type="email"
                placeholder="이메일 주소"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 border-[#c5e9de] focus:border-[#61C9A8] focus:ring-[#61C9A8]"
                required
                disabled={isRegisterLoading}
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 bg-[#61C9A8] hover:bg-[#4db596]"
              disabled={isRegisterLoading || !email.trim()}
            >
              {isRegisterLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  이메일로 키 만들기
                </>
              )}
            </Button>
          </form>
        </motion.div>
        <motion.div
          key="create-anonymous-key-button"
          variants={animations.item}
        >
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 border-[#c5e9de] hover:bg-[#f0faf7] hover:border-[#61C9A8]"
            disabled={isRegisterLoading}
            onClick={handleCreateAnonymousKey}
          >
            {isRegisterLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                처리 중...
              </>
            ) : (
              <>
                <Key className="h-4 w-4 mr-2" />
                이메일 없이 키 만들기
              </>
            )}
          </Button>
        </motion.div>

        {!!formattedKey && !!showKey && (
          <KeyDisplay
            formattedKey={formattedKey}
            onCopy={() => copyToClipboard(formattedKey)}
            copied={copiedKey}
            autoCopy
          />
        )}
      </div>

      <motion.div
        key="signup-separator"
        className="relative my-4"
        variants={animations.item}
      >
        <Separator />
        <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-sm text-gray-500">
          또는
        </span>
      </motion.div>

      <motion.div
        key="signup-social"
        className="space-y-2"
        variants={animations.stagger}
      >
        <SocialLoginButton
          provider="github"
          icon="/icons/github.svg"
          color="#24292e"
          label="GitHub로 노트 만들기"
          onClick={onSocialLogin}
          disabled={isRegisterLoading}
          keyPrefix="signup"
        />
        <SocialLoginButton
          provider="google"
          icon="/icons/google.svg"
          color="#DB4437"
          label="Google로 노트 만들기"
          onClick={onSocialLogin}
          disabled={isRegisterLoading}
          keyPrefix="signup"
        />
      </motion.div>
    </motion.div>
  ),
);
SignupForm.displayName = 'SignupForm';

// --- Main Component ---

interface LocationState {
  from?: {
    pathname?: string;
  };
}

export const Login: React.FC = () => {
  const {
    isAuthenticated,
    formattedKey,
    isRegisterLoading,
    isLoginLoading,
    loginWithSocial,
    createAnonymousUserWithEdgeFunction,
    createEmailUserWithEdgeFunction,
  } = useAuthStore();

  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [showKey, setShowKey] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const controls = useAnimation();

  // Page Visibility API를 사용하여 애니메이션 제어
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        controls.start('visible');
      }
    };

    if (document.visibilityState === 'visible') {
      controls.start('visible');
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [controls]);

  useEffect(() => {
    if (isAuthenticated) {
      const state = location.state as LocationState;
      const from = state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  useEffect(() => {
    useAuthStore.getState().checkSession();
  }, []);

  const copyToClipboard = useCallback(
    async (text: string) => {
      try {
        const cleanText = text.replace(/-/g, '');
        await navigator.clipboard.writeText(cleanText);
        setCopiedKey(true);
        toast({
          title: '클립보드에 복사됨',
          description: '하이픈이 제거된 키가 클립보드에 복사되었습니다.',
        });
        setTimeout(() => setCopiedKey(false), 2000);
      } catch (err) {
        console.error('클립보드 복사 오류:', err);
        toast({
          title: '클립보드 복사 오류',
          description: '클립보드에 복사하는 데 실패했습니다.',
          variant: 'destructive',
        });
      }
    },
    [toast],
  );

  const handleCreateEmailKey = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (formattedKey && showKey) {
        toast({
          title: '이미 키가 생성되어 있습니다',
          description: '생성된 키를 복사해서 사용하세요.',
        });
        return;
      }
      if (!email || !email.includes('@')) {
        toast({
          title: '유효하지 않은 이메일',
          description: '올바른 이메일 주소를 입력해주세요.',
          variant: 'destructive',
        });
        return;
      }
      try {
        const key = generateRandomKey(16);
        const formattedKeyValue = formatKey(key);
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const { ip } = await ipResponse.json();
        const result = await createEmailUserWithEdgeFunction(
          email,
          formattedKeyValue,
          ip,
        );
        if (result.success) {
          useAuthStore.setState({
            userKey: key,
            formattedKey: formattedKeyValue,
          });
          setShowKey(true);
          toast({
            title: '키 생성 성공',
            description: '생성된 키를 복사하여 로그인 탭에서 사용하세요.',
          });
          await supabase.from('creation_attempts').insert({ client_ip: ip });
        } else {
          let errorMessage = result.error || '알 수 없는 오류가 발생했습니다.';
          if (result.code === 'EMAIL_EXISTS') {
            errorMessage =
              '이미 등록된 이메일입니다. 다른 이메일을 사용하세요.';
          } else if (result.code === 'INVALID_PASSWORD') {
            errorMessage =
              '생성된 키가 보안 요구사항을 충족하지 않습니다. 다시 시도해주세요.';
          }
          toast({
            title: '키 생성 실패',
            description: errorMessage,
            variant: 'destructive',
          });
          setEmail('');
        }
      } catch (err) {
        console.error('이메일 키 생성 오류:', err);
        toast({
          title: '키 생성 오류',
          description:
            '서버 연결 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
          variant: 'destructive',
        });
        setEmail('');
      }
    },
    [formattedKey, showKey, email, createEmailUserWithEdgeFunction, toast],
  );

  const handleSocialLogin = useCallback(
    async (provider: 'github' | 'google') => {
      await loginWithSocial(provider);
    },
    [loginWithSocial],
  );

  const handleCreateAnonymousKey = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isRegisterLoading) return;
      if (formattedKey && showKey) {
        toast({
          title: '이미 키가 생성되어 있습니다',
          description: '생성된 키를 복사해서 사용하세요.',
        });
        return;
      }
      try {
        setShowKey(false);
        const key = generateRandomKey(16);
        const formattedKeyValue = formatKey(key);
        const result = await createAnonymousUserWithEdgeFunction(
          formattedKeyValue,
        );
        if (!result.success) {
          const errorMessage =
            result?.error || '알 수 없는 오류가 발생했습니다.';
          toast({
            title: '키 생성 실패',
            description: errorMessage,
            variant: 'destructive',
          });
          return;
        }
        useAuthStore.setState({
          userKey: key,
          formattedKey: formattedKeyValue,
        });
        setShowKey(true);
        toast({
          title: '키 생성 성공',
          description: '생성된 키를 복사하여 로그인 탭에서 사용하세요.',
        });
      } catch (err) {
        console.error('익명 사용자 저장 오류:', err);
        toast({
          title: '키 생성 오류',
          description:
            err instanceof Error
              ? err.message
              : '키 생성 중 오류가 발생했습니다. 다시 시도해주세요.',
          variant: 'destructive',
        });
      }
    },
    [
      isRegisterLoading,
      formattedKey,
      showKey,
      createAnonymousUserWithEdgeFunction,
      toast,
    ],
  );

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br overflow-hidden from-white to-[#e6f7f2]">
      <Toaster />
      <div className="w-full lg:w-1/2 p-4 md:p-8 flex items-start lg:mt-32 lg:mb-16 justify-center lg:justify-end lg:pr-24">
        <motion.div
          initial="hidden"
          animate={controls}
          variants={animations.card}
        >
          <Card className="relative w-full max-w-md shadow-lg border-[#d8f2ea] overflow-visible">
            <CardContent className="pt-8 pb-6">
              <motion.div
                className="flex justify-center items-center mb-6"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Link
                  to="/"
                  className="w-1/2 object-contain pointer flex justify-center"
                >
                  <img src={logoImage || '/placeholder.svg'} alt="로고" />
                </Link>
              </motion.div>

              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-4"
              >
                <TabsList className="grid grid-cols-2 gap-4">
                  <TabsTrigger
                    value="login"
                    className={
                      activeTab === 'login' ? 'text-[#61C9A8] bg-[#e6f7f2]' : ''
                    }
                  >
                    로그인
                  </TabsTrigger>
                  <TabsTrigger
                    value="signup"
                    className={
                      activeTab === 'signup'
                        ? 'text-[#61C9A8] bg-[#e6f7f2]'
                        : ''
                    }
                  >
                    만들기
                  </TabsTrigger>
                </TabsList>

                <div
                  className="relative min-h-[280px]"
                  style={{ transformOrigin: 'top' }}
                >
                  {activeTab === 'login' ? (
                    <LoginForm
                      isLoginLoading={isLoginLoading}
                      onSocialLogin={handleSocialLogin}
                    />
                  ) : (
                    <SignupForm
                      isRegisterLoading={isRegisterLoading}
                      email={email}
                      setEmail={setEmail}
                      formattedKey={formattedKey}
                      showKey={showKey}
                      copiedKey={copiedKey}
                      handleCreateEmailKey={handleCreateEmailKey}
                      handleCreateAnonymousKey={handleCreateAnonymousKey}
                      copyToClipboard={copyToClipboard}
                      onSocialLogin={handleSocialLogin}
                    />
                  )}
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <AnimationSection />
    </div>
  );
};

export default Login;
