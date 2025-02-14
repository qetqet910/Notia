import * as React from 'react';
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
      {Icon && <Icon className="w-4.5 h-4.5 mr-2"/>}
      {label && <span className="text-xm mb-1">{label}</span>}
      {children}
    </button>
  );
};