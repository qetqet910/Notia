import React from 'react';
import { Link } from 'react-router-dom';
import logoImage from '@/assets/images/Logo.png';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-toss-border bg-white py-5 px-10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <img src={logoImage} className="h-5" alt="Notia" />
        <div className="flex items-center gap-5">
          <a
            href="https://notia.site/terms"
            className="text-xs font-medium text-toss-light hover:text-toss-gray transition-colors"
          >
            서비스 이용약관
          </a>
          <a
            href="https://notia.site/privacy"
            className="text-xs font-medium text-toss-light hover:text-toss-gray transition-colors"
          >
            개인정보 처리방침
          </a>
          <a
            href="https://github.com/qetqet910/Notia"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-toss-light hover:text-toss-gray transition-colors"
          >
            GitHub
          </a>
        </div>
        <span className="text-xs font-medium text-toss-light">
          © {new Date().getFullYear()} Notia.
        </span>
      </div>
    </footer>
  );
};
