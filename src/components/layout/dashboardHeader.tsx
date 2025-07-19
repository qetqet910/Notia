import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { useThemeStore } from '@/stores/themeStore';

import { UserProfile } from '@/components/features/dashboard/userProfile';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import logoImage from '@/assets/images/Logo.png';
import logoDarkImage from '@/assets/images/LogoDark.png';

export const DashboardHeader: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode, isDeepDarkMode } = useThemeStore();
  const logoSrc = useMemo(
    () => (isDarkMode || isDeepDarkMode ? logoDarkImage : logoImage),
    [isDarkMode, isDeepDarkMode],
  );

  const handleBackUrl = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="border-b py-3 px-4 mb-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 fixed top-0 w-full z-50"
    >
      <div className=" mx-auto flex items-center justify-between">
        <div className="flex items-center ">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={handleBackUrl}
            aria-label="대시보드로 돌아가기"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-primary">
            <img
              src={logoSrc}
              className="max-w-40 cursor-pointer h-8"
              alt="로고"
              onClick={handleBackUrl}
            />
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <UserProfile />
        </div>
      </div>
    </motion.nav>
  );
};
