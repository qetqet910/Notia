import React, { useEffect } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { motion, useAnimation } from 'framer-motion';

import { Toaster } from '@/components/ui/toaster';
import logoImage from '@/assets/images/Logo.png';
import logoDarkImage from '@/assets/images/LogoDark.png';

import { LoginForm } from '@/components/features/auth/AuthComponents';
import { useAuthPageLogic } from '@/hooks/useAuthPageLogic';
import { useThemeStore } from '@/stores/themeStore';
import { cn } from '@/utils/shadcnUtils';

// --- Visual Components ---

const BackgroundOrbs = React.memo(() => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-slate-50 dark:bg-slate-950">
      {/* Base Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white to-cyan-50/50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900" />

      {/* 
         Orb 1: Purple (Top Right) 
         움직임을 더 크게, 시간을 길게 잡아서 부드럽게 흐르도록 설정
      */}
      <motion.div
        className="absolute -top-[20%] -right-[10%] w-[80vw] h-[80vw] rounded-full bg-purple-300/40 dark:bg-purple-800/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen"
        animate={{
          x: [0, -100, 50, 0],
          y: [0, 50, -100, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
      />

      {/* Orb 2: Mint/Teal (Bottom Left) */}
      <motion.div
        className="absolute -bottom-[20%] -left-[10%] w-[80vw] h-[80vw] rounded-full bg-[#61C9A8]/40 dark:bg-[#61C9A8]/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen"
        animate={{
          x: [0, 100, -50, 0],
          y: [0, -100, 50, 0],
          scale: [1, 1.2, 0.95, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
      />

      {/* Orb 3: White/Ice Blue Accent (Center-ish) - 하이라이트 역할 */}
      <motion.div
        className="absolute top-[20%] left-[20%] w-[70vw] h-[70vw] rounded-full bg-white/60 dark:bg-slate-200/10 blur-[130px] mix-blend-overlay dark:mix-blend-screen"
        animate={{
          x: [0, -70, 70, 0],
          y: [0, 70, -70, 0],
          scale: [1, 1.2, 0.8, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
      />
    </div>
  );
});
BackgroundOrbs.displayName = 'BackgroundOrbs';

// --- Main Component ---

interface LocationState {
  from?: {
    pathname?: string;
  };
}

const DesktopLogin: React.FC = () => {
  const {
    user,
    isLoginLoading,
    handleSocialLogin,
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
    <div className="relative flex flex-col min-h-screen items-center justify-center overflow-hidden font-['Orbit'] selection:bg-primary/20">
      <Toaster />
      
      {/* 0. Background Layer */}
      <BackgroundOrbs />
      
      {/* 1. Content Layer (Z-Index 10) */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "relative z-10 w-full max-w-[400px] mx-4",
          // Liquid Glass Styles
          "bg-white/40 dark:bg-black/40", // Base transparency
          "backdrop-blur-2xl", // Strong blur
          "bg-gradient-to-b from-white/60 to-white/10 dark:from-white/10 dark:to-transparent", // Vertical gradient for depth
          
          // Borders & Shadows
          "border border-white/40 dark:border-white/10",
          "shadow-[0_8px_32px_0_rgba(31,38,135,0.05)]", // Soft outer shadow
          "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]", // Inner glow ring
          
          "rounded-[32px]",
          "p-8 pt-12 pb-10"
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
            <img 
              src={logoSrc} 
              alt="Notia" 
              className="h-12 w-auto object-contain drop-shadow-sm hover:scale-105 transition-transform duration-300"
            />
          </motion.div>
          
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              다시 오신 걸 환영합니다
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
              기억의 조각을 연결하세요.
            </p>
          </motion.div>
        </div>

        {/* Login Form Section */}
        <div className="relative z-10">
           <LoginForm 
             isLoginLoading={isLoginLoading}
             onSocialLogin={handleSocialLogin}
             transparent
           />
        </div>

      </motion.div>

      {/* Footer */}
      <motion.div 
        className="z-10 absolute bottom-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 1 }}
      >
        <p className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase opacity-80 mix-blend-multiply dark:mix-blend-screen">
          Notia Desktop v{import.meta.env.VITE_APP_VERSION}
        </p>
      </motion.div>
    </div>
  );
};

export default DesktopLogin;
