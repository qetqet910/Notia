import React, { useEffect } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion, useAnimation } from 'framer-motion';

import { Toaster } from '@/components/ui/toaster';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { animations } from '@/constants/animations';

import logoImage from '@/assets/images/Logo.png';
import loginAnimation from '/lottie/loginAnimation.lottie';

import { LoginForm, SignupForm } from '@/components/features/auth/AuthComponents';
import { useAuthPageLogic } from '@/hooks/useAuthPageLogic';

// --- Memoized Sub-components ---

const AnimationSection = React.memo(() => {
  return (
    <motion.div
      className="w-full flex items-center justify-center p-8 order-first md:order-last bg-gradient-to-b md:bg-gradient-to-r from-white to-[#e6f7f2]"
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

// --- Main Component ---

interface LocationState {
  from?: {
    pathname?: string;
  };
}

export const Login: React.FC = () => {
  const {
    user,
    formattedKey,
    isRegisterLoading,
    isLoginLoading,
    email,
    setEmail,
    copiedKey,
    activeTab,
    setActiveTab,
    showKey,
    handleCreateEmailKey,
    handleSocialLogin,
    handleCreateAnonymousKey,
    copyToClipboard,
  } = useAuthPageLogic();

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

  // 1. Redirect Logic
  if (user) {
     const state = location.state as LocationState;
     const from = state?.from?.pathname || '/dashboard';
     return <Navigate to={from} replace />;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br overflow-hidden from-white to-[#e6f7f2]">
      <Toaster />
      <div className="w-full md:w-1/2 p-4 md:p-8 flex items-start md:mt-32 md:mb-16 justify-center md:justify-end md:pr-24">
        <motion.div
          initial="hidden"
          animate={controls}
          variants={animations.card}
        >
          <Card className="relative w-full max-w-md shadow-lg border-[#d8f2ea] overflow-visible md:mt-0 mt-20">
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

      <div className="hidden md:flex w-full md:w-1/2">
        <AnimationSection />
      </div>
    </div>
  );
};

export default Login;