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

// --- Visual Components (Synced with DesktopLogin) ---

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
    <div className="relative flex flex-col min-h-screen items-center justify-center overflow-hidden selection:bg-primary/20">
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
          // Liquid Glass Styles - High Quality Refinement
          "bg-white/40 dark:bg-black/40", 
          "backdrop-blur-3xl", // Stronger Blur for depth
          "bg-gradient-to-b from-white/70 to-white/30 dark:from-white/10 dark:to-transparent", // More pronounced gradient
          
          // Borders & Shadows - Enhanced for 3D feel
          "border border-white/60 dark:border-white/10",
          "shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]", 
          "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]", // Inner glow ring
          
          "rounded-[32px]",
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
                className="h-11 w-auto object-contain drop-shadow-sm hover:scale-105 transition-transform duration-300"
              />
            </Link>
          </motion.div>
          
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {activeTab === 'login' ? '다시 오신 것을 환영합니다' : '새로운 여정을 시작하세요'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
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
          <TabsList className="grid grid-cols-2 gap-2 bg-black/5 dark:bg-white/5 p-1 rounded-2xl">
            <TabsTrigger
              value="login"
              className={cn(
                "rounded-xl text-sm font-medium transition-all duration-300",
                "data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm",
                "data-[state=active]:dark:bg-white/10 data-[state=active]:dark:text-white"
              )}
            >
              로그인
            </TabsTrigger>
            <TabsTrigger
              value="signup"
              className={cn(
                "rounded-xl text-sm font-medium transition-all duration-300",
                "data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm",
                "data-[state=active]:dark:bg-white/10 data-[state=active]:dark:text-white"
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
        <p className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase opacity-80 mix-blend-multiply dark:mix-blend-screen">
          Notia Web v{import.meta.env.APP_VERSION || "1.0.2"}
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
