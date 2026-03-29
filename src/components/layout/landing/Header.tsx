import React from 'react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import logoImage from '@/assets/images/Logo.png';

export const Header: React.FC = () => {
  const navigate = useNavigate();

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-lg border-b border-toss-border/50"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-6">
        <Link to="/" className="flex items-center">
          <img src={logoImage} className="h-7" alt="Notia" />
        </Link>
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/download')}
            className="text-toss-gray hover:text-toss-dark hover:bg-toss-lightGray rounded-toss"
          >
            앱 다운로드
          </Button>
          <Button
            onClick={() => navigate('/login')}
            className="bg-notia-primary hover:bg-notia-hover text-white rounded-toss font-medium"
          >
            로그인
          </Button>
        </div>
      </div>
    </motion.nav>
  );
};
