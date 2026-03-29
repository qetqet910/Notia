import React, { useEffect } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { motion, useAnimation } from 'framer-motion';

import { Toaster } from '@/components/ui/toaster';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import logoImage from '@/assets/images/Logo.png';
import logoDarkImage from '@/assets/images/LogoDark.png';

import { LoginForm, SignupForm } from '@/components/features/auth/AuthComponents';
import { BackgroundOrbs } from '@/components/features/auth/BackgroundOrbs';
import { useAuthPageLogic } from '@/hooks/useAuthPageLogic';
import { useThemeStore } from '@/stores/themeStore';
import { cn } from '@/utils/shadcnUtils';

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

  const { isDarkMode, isDeepDarkMode } = useThemeStore();
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

  const logoSrc = isDarkMode || isDeepDarkMode ? logoDarkImage : logoImage;

  return (
    <div className="relative flex flex-col min-h-screen items-center justify-center overflow-hidden bg-toss-lightGray selection:bg-notia-primary/20 selection:text-toss-dark">
      <Toaster />
      
      {/* 0. Background Layer */}
      <BackgroundOrbs />
      
      {/* 1. Content Layer (Z-Index 10) */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "relative z-10 w-full max-w-[420px] mx-4",
          // Toss Style: Clean white card with subtle shadow
          "bg-white/90",
          "backdrop-blur-xl",
          "border border-toss-border/50",
          "shadow-toss-lg",
          "rounded-toss-xl",
          "p-6 sm:p-8 pt-10 pb-8"
        )}
      >
        {/* Header Section */}
        <div className="text-center mb-8 space-y-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex justify-center"
          >
            <Link to="/" className="block">
              <img 
                src={logoSrc} 
                alt="Notia" 
                className="h-11 w-auto object-contain hover:scale-105 transition-transform duration-300"
              />
            </Link>
          </motion.div>
          
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1 className="text-xl font-bold tracking-tight text-toss-dark">
              {activeTab === 'login' ? '다시 오신 것을 환영합니다' : '새로운 여정을 시작하세요'}
            </h1>
            <p className="text-sm text-toss-gray mt-1.5 font-medium">
              {activeTab === 'login' ? '기억의 조각을 연결하세요' : '당신의 기억을 연결해 드릴게요'}
            </p>
          </motion.div>
        </div>

        {/* Tabs & Forms */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid grid-cols-2 gap-2 bg-toss-lightGray/50 p-1 rounded-toss-lg">
            <TabsTrigger
              value="login"
              className={cn(
                "rounded-toss text-sm font-medium transition-all duration-300",
                "data-[state=active]:bg-white data-[state=active]:text-notia-primary data-[state=active]:shadow-toss",
                "data-[state=active]:hover:bg-white/80"
              )}
            >
              로그인
            </TabsTrigger>
            <TabsTrigger
              value="signup"
              className={cn(
                "rounded-toss text-sm font-medium transition-all duration-300",
                "data-[state=active]:bg-white data-[state=active]:text-notia-primary data-[state=active]:shadow-toss",
                "data-[state=active]:hover:bg-white/80"
              )}
            >
              만들기
            </TabsTrigger>
          </TabsList>

          <div className="relative min-h-[280px]">
            {activeTab === 'login' ? (
              <LoginForm
                isLoginLoading={isLoginLoading}
                onSocialLogin={handleSocialLogin}
                transparent
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
      </motion.div>

      {/* Footer */}
      <motion.div 
        className="z-10 absolute bottom-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1 }}
      >
        <p className="text-[10px] text-toss-light font-semibold tracking-widest uppercase opacity-80">
          Notia Web v{import.meta.env.APP_VERSION || "1.2.0"}
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
