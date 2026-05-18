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
      className="fixed top-0 w-full z-50 bg-white/96 backdrop-blur-xl border-b border-toss-border"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between h-[60px] px-10">
        <Link to="/" className="flex items-center">
          <img src={logoImage} className="h-7" alt="Notia" />
        </Link>
        <nav className="hidden md:flex items-center gap-7">
          <a
            href="#features"
            onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="text-sm font-medium text-toss-gray hover:text-toss-dark transition-colors cursor-pointer tracking-tight"
          >
            기능
          </a>
          <Link
            to="/download"
            className="text-sm font-medium text-toss-gray hover:text-toss-dark transition-colors tracking-tight"
          >
            다운로드
          </Link>
          <Link
            to="/changelog"
            className="text-sm font-medium text-toss-gray hover:text-toss-dark transition-colors tracking-tight"
          >
            업데이트
          </Link>
        </nav>
        <Button
          onClick={() => navigate('/login')}
          className="h-[38px] px-5 bg-notia-primary hover:bg-notia-hover text-white rounded-toss-sm text-sm font-semibold tracking-tight"
        >
          시작하기
        </Button>
      </div>
    </motion.nav>
  );
};
