import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-toss-lightGray py-8 border-t border-toss-border/50">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-toss-light text-sm">
          © {new Date().getFullYear()} HyeonMin Kim. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
