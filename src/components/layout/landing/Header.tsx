import React from 'react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import logoImage from '@/assets/images/Logo.png';
import Menu from 'lucide-react/dist/esm/icons/menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';

export const Header: React.FC = () => {
  const navigate = useNavigate();

  const handleFeaturesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 w-full z-50 bg-white/96 backdrop-blur-xl border-b border-toss-border"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between h-[60px] px-6 md:px-10">
        <Link to="/" className="flex items-center">
          <img src={logoImage} className="h-7" alt="Notia" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-7">
          <a
            href="#features"
            onClick={handleFeaturesClick}
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

        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate('/login')}
            className="h-[38px] px-5 bg-notia-primary hover:bg-notia-hover text-white rounded-toss-sm text-sm font-semibold tracking-tight"
          >
            시작하기
          </Button>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-9 w-9 text-toss-dark"
                aria-label="메뉴 열기"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 pt-14">
              <nav className="flex flex-col gap-1 mt-2">
                <SheetClose asChild>
                  <a
                    href="#features"
                    onClick={handleFeaturesClick}
                    className="px-3 py-3 text-base font-medium text-toss-gray hover:text-toss-dark hover:bg-toss-lightGray rounded-toss transition-colors"
                  >
                    기능
                  </a>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    to="/download"
                    className="px-3 py-3 text-base font-medium text-toss-gray hover:text-toss-dark hover:bg-toss-lightGray rounded-toss transition-colors"
                  >
                    다운로드
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    to="/changelog"
                    className="px-3 py-3 text-base font-medium text-toss-gray hover:text-toss-dark hover:bg-toss-lightGray rounded-toss transition-colors"
                  >
                    업데이트
                  </Link>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.nav>
  );
};
