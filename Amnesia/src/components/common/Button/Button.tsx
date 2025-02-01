import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps {
  icon?: LucideIcon;
  label?: string;
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  icon: Icon, 
  label, 
  className = '', 
  onClick,
  children 
}) => {
  return (
    <button 
      className={`flex items-center justify-center ${className}`}
      onClick={onClick}
    >
      {Icon && <Icon className="w-6 h-6" />}
      {label && <span className="text-xs mt-1">{label}</span>}
      {children}
    </button>
  );
};