import type React from 'react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users } from 'react-feather';
import { Key, AlertCircle, Loader2 } from 'lucide-react';
import Lottie from 'lottie-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Toaster } from '@/components/ui/toaster';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { InputOTPControlled } from '@/components/features/InputOtpControl/input-otp-control';
import { useAuthStore } from '@/stores/authStore';
import { KeyDisplay } from '@/components/features/KeyDisplay';
import { useToast } from '@/hooks/use-toast';
import { generateRandomKey, formatKey } from '@/utils/keys';

import logoImage from '@/stores/images/Logo.png';
import animationData from '@/stores/data/login-animation.json';

// 애니메이션 변수들
const animations = {
  card: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  },
  tabContent: {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
    exit: {
      opacity: 0,
      x: 10,
      transition: { duration: 0.2 },
    },
  },
  stagger: {
    visible: {
      transition: { staggerChildren: 0.1 },
    },
  },
  item: {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  },
};

// 소셜 로그인 버튼 컴포넌트
const SocialLoginButton: React.FC<{
  provider: 'github' | 'google';
  icon: string;
  color: string;
  label: string;
  onClick: (provider: 'github' | 'google') => void;
  disabled: boolean;
  animate: boolean;
  keyPrefix: string;
}> = ({
  provider,
  icon,
  color,
  label,
  onClick,
  disabled,
  animate,
  keyPrefix,
}) => (
  <motion.div
    key={`${keyPrefix}-${provider}`}
    initial={animate ? { opacity: 0, y: 10 } : false}
    animate={animate ? { opacity: 1, y: 0 } : {}}
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
);

// 에러 메시지 컴포넌트
const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <motion.div
    key="error-message"
    className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-center gap-2 mt-4"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 10 }}
    transition={{ duration: 0.3 }}
  >
    <AlertCircle size={16} />
    <span className="text-sm">{message}</span>
  </motion.div>
);

// 로그인 컴포넌트
export const Login: React.FC = () => {
  // Zustand 스토어 사용
  const {
    isAuthenticated,
    formattedKey,
    isLoading,
    isLoginLoading,
    error,
    loginWithSocial,
    isGeneratingKey,
    createAnonymousUserWithEdgeFunction,
    createEmailUserWithEdgeFunction,
    createGroup,
    joinGroup,
  } = useAuthStore();

  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [activeAuthTab, setActiveAuthTab] = useState('key');
  const [signupTab, setSignupTab] = useState('key');
  const [initialAnimationComplete, setInitialAnimationComplete] =
    useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // 인증 상태 변경 시 리디렉션
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // 애니메이션 완료 타이머
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialAnimationComplete(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // 세션 체크
  useEffect(() => {
    useAuthStore.getState().checkSession();
  }, []);

  // 키 복사 핸들러
  // 키 복사 핸들러 - 하이픈 제거 버전
  const copyToClipboard = async (text: string) => {
    try {
      // 하이픈 제거
      const cleanText = text.replace(/-/g, '');

      // 클립보드에 복사
      await navigator.clipboard.writeText(cleanText);
      setCopiedKey(true);

      toast({
        title: '클립보드에 복사됨',
        description: '하이픈이 제거된 키가 클립보드에 복사되었습니다.',
      });

      setTimeout(() => setCopiedKey(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('클립보드 복사 오류:', err);
      toast({
        title: '클립보드 복사 오류',
        description: '클립보드에 복사하는 데 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleCreateEmailKey = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isGeneratingKey || localLoading) {
      console.log('이미 처리 중입니다.');
      return;
    }

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
      // 로딩 상태 활성화
      setLocalLoading(true);

      // 키 미리 생성 (하지만 아직 표시하지 않음)
      const key = generateRandomKey(16);
      const formattedKeyValue = formatKey(key);

      // Edge Function으로 이메일 키 생성 요청
      const result = await createEmailUserWithEdgeFunction(
        email,
        formattedKeyValue,
      );

      // 성공일 경우에만 키 저장 및 표시
      if (result.success) {
        // 상태 업데이트
        useAuthStore.setState({
          userKey: key,
          formattedKey: formattedKeyValue,
          // userEmail: email,
        });

        setShowKey(true);

        toast({
          title: '키 생성 성공',
          description: '생성된 키를 복사하여 로그인 탭에서 사용하세요.',
        });
      } else {
        // 에러 코드에 따른 처리
        let errorMessage = result.error || '알 수 없는 오류가 발생했습니다.';
        let toastVariant: 'default' | 'destructive' = 'destructive';

        // 특정 에러 코드별 메시지 처리
        if (result.code === 'EMAIL_EXISTS') {
          errorMessage = '이미 등록된 이메일입니다. 다른 이메일을 사용하세요.';
        } else if (result.code === 'INVALID_PASSWORD') {
          errorMessage =
            '생성된 키가 보안 요구사항을 충족하지 않습니다. 다시 시도해주세요.';
        }

        toast({
          title: '키 생성 실패',
          description: errorMessage,
          variant: toastVariant,
        });
      }
    } catch (err) {
      console.error('이메일 키 생성 오류:', err);

      toast({
        title: '키 생성 오류',
        description:
          '서버 연결 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
        variant: 'destructive',
      });
    } finally {
      setLocalLoading(false);
    }
  };

  // 소셜 로그인 핸들러
  const handleSocialLogin = async (provider: 'github' | 'google') => {
    await loginWithSocial(provider);
  };

  // 익명 키 생성 핸들러
  const handleCreateAnonymousKey = async (e: React.FormEvent) => {
    e.preventDefault(); // 폼 제출 시 페이지 새로고침 방지

    // 이미 로딩 중이면 중복 요청 방지
    if (isLoading) {
      console.log('이미 처리 중입니다.');
      return;
    }

    // 이미 키가 생성되어 있고 표시 중이면 중복 생성 방지
    if (formattedKey && showKey) {
      toast({
        title: '이미 키가 생성되어 있습니다',
        description: '생성된 키를 복사해서 사용하세요.',
      });
      return;
    }

    try {
      // 상태 초기화
      setShowKey(false);
      setLocalLoading(true);

      // 키 즉시 생성
      const key = generateRandomKey(16);
      const formattedKeyValue = formatKey(key);

      // Supabase Edge Function으로 저장 시도
      const result = await createAnonymousUserWithEdgeFunction(
        formattedKeyValue,
      );

      // 성공 시 상태 업데이트
      console.log('익명 사용자 저장 결과:', result);

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
    } finally {
      setLocalLoading(false);
    }
  };

  // 로그인 탭 렌더링
  const renderLoginTab = () => (
    <motion.div
      key="login-form-tab"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={animations.tabContent}
      className="space-y-4"
    >
      <form className="space-y-4 mb-6">
        <Tabs
          defaultValue="key"
          className="space-y-4"
          onValueChange={setActiveAuthTab}
        >
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
                  disabled={isGeneratingKey || localLoading}
                >
                  {isGeneratingKey || localLoading ? (
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
        </Tabs>
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
          onClick={handleSocialLogin}
          disabled={isLoginLoading}
          animate={!initialAnimationComplete}
          keyPrefix="login"
        />
        <SocialLoginButton
          provider="google"
          icon="/icons/google.svg"
          color="#DB4437"
          label="Google로 로그인"
          onClick={handleSocialLogin}
          disabled={isLoginLoading}
          animate={!initialAnimationComplete}
          keyPrefix="login"
        />
      </motion.div>
    </motion.div>
  );

  // 회원가입 탭 렌더링
  const renderSignupTab = () => (
    <motion.div
      key="signup-form-tab"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={animations.tabContent}
      className="space-y-4"
    >
      <Tabs
        defaultValue="key"
        className="space-y-4"
        value={signupTab}
        onValueChange={setSignupTab}
      >
        <div key="key-signup-content">
          <div className="space-y-4">
            {/* 이메일 키 생성 폼 추가 */}
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
                    disabled={isLoading}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 bg-[#61C9A8] hover:bg-[#4db596]"
                  disabled={isLoading || !email.trim()}
                >
                  {isLoading ? (
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
            {/* 익명 키 생성 버튼 */}
            <motion.div
              key="create-anonymous-key-button"
              variants={animations.item}
            >
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 border-[#c5e9de] hover:bg-[#f0faf7] hover:border-[#61C9A8]"
                disabled={isLoading}
                onClick={handleCreateAnonymousKey}
              >
                {isLoading ? (
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

            {/* 키 표시 - showKey 상태에 따라 표시 */}
            {!!formattedKey && !!showKey && (
              <KeyDisplay
                formattedKey={formattedKey}
                onCopy={() => copyToClipboard(formattedKey)}
                copied={copiedKey}
                autoCopy={true} // 자동 복사 활성화
              />
            )}
          </div>
        </div>
      </Tabs>

      {/* {!!userKey && !!showKey && (
        <KeyDisplay
          formattedKey={formattedKey || ''}
          onCopy={copyToClipboard}
          copied={copiedKey}
        />
      )} */}

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
          onClick={handleSocialLogin}
          disabled={isLoading}
          animate={!initialAnimationComplete}
          keyPrefix="signup"
        />
        <SocialLoginButton
          provider="google"
          icon="/icons/google.svg"
          color="#DB4437"
          label="Google로 노트 만들기"
          onClick={handleSocialLogin}
          disabled={isLoading}
          animate={!initialAnimationComplete}
          keyPrefix="signup"
        />
      </motion.div>
    </motion.div>
  );

  // 애니메이션 섹션 렌더링
  const renderAnimationSection = () => (
    <motion.div
      className="w-full lg:w-1/2 pl-16 flex items-center justify-center lg:justify-start p-8 order-first lg:order-last bg-gradient-to-b lg:bg-gradient-to-r from-white to-[#e6f7f2]"
      initial={!initialAnimationComplete ? { opacity: 0, x: 20 } : false}
      animate={!initialAnimationComplete ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      <div className="w-full max-w-md">
        <motion.div
          className="w-full md:w-4/5 mx-auto"
          initial={!initialAnimationComplete ? { scale: 0.9 } : false}
          animate={!initialAnimationComplete ? { scale: 1 } : {}}
          transition={{
            duration: 0.8,
            type: 'spring',
            bounce: 0.3,
          }}
        >
          <Lottie animationData={animationData} className="drop-shadow-xl" />
        </motion.div>

        <motion.div
          className="text-center mt-6"
          initial={!initialAnimationComplete ? { opacity: 0, y: 20 } : false}
          animate={!initialAnimationComplete ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <motion.h2
            className="text-xl md:text-2xl font-bold text-[#61C9A8]"
            initial={!initialAnimationComplete ? { opacity: 0 } : false}
            animate={!initialAnimationComplete ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            안전하게 기록하세요
          </motion.h2>
          <motion.p
            className="text-gray-600 mt-2 max-w-sm mx-auto"
            initial={!initialAnimationComplete ? { opacity: 0 } : false}
            animate={!initialAnimationComplete ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            Amnesia는 생각과 아이디어를 항상 안전하게 보관합니다.
            <br />
            언제 어디서나 접근하세요.
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  );

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br overflow-hidden from-white to-[#e6f7f2]">
      {/* 로그인 섹션 */}
      <Toaster />
      <div className="w-full lg:w-1/2 p-4 md:p-8 flex items-start lg:mt-32 lg:mb-16 justify-center lg:justify-end lg:pr-24">
        <motion.div
          initial={!initialAnimationComplete ? 'hidden' : false}
          animate={!initialAnimationComplete ? 'visible' : {}}
          variants={animations.card}
        >
          <Card className="relative w-full max-w-md shadow-lg border-[#d8f2ea] overflow-visible">
            <CardContent className="pt-8 pb-6">
              {/* 로고 */}
              <motion.div
                className="flex justify-center items-center mb-6"
                initial={
                  !initialAnimationComplete ? { scale: 0.9, opacity: 0 } : false
                }
                animate={
                  !initialAnimationComplete ? { scale: 1, opacity: 1 } : {}
                }
                transition={{ duration: 0.5 }}
              >
                <Link to="/" className="w-1/2 object-contain pointer">
                  <img src={logoImage || '/placeholder.svg'} alt="로고" />
                </Link>
              </motion.div>

              {/* 탭 컨테이너 */}
              <Tabs
                defaultValue="login"
                className="space-y-4"
                onValueChange={setActiveTab}
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

                {/* 탭 내용 */}
                <div
                  className="relative min-h-[280px]"
                  style={{ transformOrigin: 'top' }}
                >
                  {activeTab === 'login' ? renderLoginTab() : renderSignupTab()}
                </div>
              </Tabs>

              {/* 에러 메시지 */}
              {error && (
                <ErrorMessage
                  message={
                    error instanceof Error ? error.message : String(error)
                  }
                />
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* 애니메이션 섹션 */}
      {renderAnimationSection()}
    </div>
  );
};

export default Login;
