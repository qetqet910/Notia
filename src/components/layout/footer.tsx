import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-transparent py-8">
      <div className="max-w-3xl mx-auto px-6">
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
          © {new Date().getFullYear()} HyeonMin Kim. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
