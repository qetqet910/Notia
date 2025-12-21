import React, { useEffect } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { motion, useAnimation } from 'framer-motion';

import { Toaster } from '@/components/ui/toaster';
import { animations } from '@/constants/animations';

import logoImage from '@/assets/images/Logo.png';
import logoDarkImage from '@/assets/images/LogoDark.png'; // Assuming you have dark logo or use same

import { LoginForm } from '@/components/features/auth/AuthComponents';
import { useAuthPageLogic } from '@/hooks/useAuthPageLogic';
import { useThemeStore } from '@/stores/themeStore';

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
    <div className="flex flex-col min-h-screen items-center justify-center bg-background p-4 font-['Orbit']">
      <Toaster />
      
      <motion.div
        initial="hidden"
        animate={controls}
        variants={animations.item} // Use simple item animation instead of card
        className="w-full max-w-[320px]"
      >
        {/* Header Section */}
        <div className="text-center mb-10 space-y-3">
          <motion.img 
            src={logoSrc} 
            alt="Notia" 
            className="h-10 mx-auto"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              다시 오신 것을 환영합니다
            </h1>
            <p className="text-sm text-muted-foreground">
              계속하려면 로그인하세요
            </p>
          </motion.div>
        </div>

        {/* Login Form Section */}
        <div className="backdrop-blur-sm">
           <LoginForm 
             isLoginLoading={isLoginLoading}
             onSocialLogin={handleSocialLogin}
           />
        </div>

        {/* Footer */}
        <motion.div 
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-xs text-muted-foreground/50">
            Notia Desktop App v{process.env.APP_VERSION || '1.0'}
          </p>
        </motion.div>

      </motion.div>
    </div>
  );
};

export default DesktopLogin;