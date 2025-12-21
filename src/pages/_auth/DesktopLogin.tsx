import React, { useEffect } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { motion, useAnimation } from 'framer-motion';

import { Toaster } from '@/components/ui/toaster';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { animations } from '@/constants/animations';

import logoImage from '@/assets/images/Logo.png';

import { LoginForm, SignupForm } from '@/components/features/auth/AuthComponents';
import { useAuthPageLogic } from '@/hooks/useAuthPageLogic';

// --- Main Component ---

interface LocationState {
  from?: {
    pathname?: string;
  };
}

const DesktopLogin: React.FC = () => {
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

  useEffect(() => {
    controls.start('visible');
  }, [controls]);

  // 1. Redirect Logic
  if (user) {
     const state = location.state as LocationState;
     const from = state?.from?.pathname || '/dashboard';
     return <Navigate to={from} replace />;
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-gradient-to-br from-white to-[#e6f7f2] p-4">
      <Toaster />
      <motion.div
        initial="hidden"
        animate={controls}
        variants={animations.card}
        className="w-full max-w-sm"
      >
        <Card className="relative w-full shadow-lg border-[#d8f2ea] overflow-visible">
          <CardContent className="pt-8 pb-6">
            <motion.div
              className="flex justify-center items-center mb-6"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-1/2 flex justify-center">
                <img src={logoImage || '/placeholder.svg'} alt="로고" className="object-contain" />
              </div>
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
  );
};

export default DesktopLogin;
