import React from 'react';
import logoImage from '@/assets/images/Logo.png';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-toss-border bg-white py-5 px-10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <img src={logoImage} className="h-5" alt="Notia" />
        <a
          href="https://github.com/qetqet910/Notia"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-toss-light hover:text-toss-gray transition-colors"
        >
          GitHub
        </a>
        <span className="text-xs font-medium text-toss-light">
          © {new Date().getFullYear()} Notia.
        </span>
      </div>
    </footer>
  );
};
