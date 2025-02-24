import React from 'react';
import { Button } from '../../ui/button';
import { Separator } from '../../ui/separator';

interface SocialLoginButtonProps {
  provider: 'github' | 'google';
  icon: string;
  color: string;
  label: string;
  onClick: () => void;
  isLoading: boolean;
}

export const SocialLoginButton: React.FC<SocialLoginButtonProps> = ({
  provider,
  icon,
  color,
  label,
  onClick,
  isLoading
}) => (
  <Button 
    variant="outline" 
    className="w-full flex items-center justify-center gap-2 h-12 mb-2"
    style={{ borderColor: color, color }}
    onClick={onClick}
    disabled={isLoading}
  >
    <img src={icon} alt={provider} className="w-5 h-5" />
    <span>{label}</span>
  </Button>
);

export const SocialLoginSection: React.FC<{
  onSocialLogin: (provider: 'github' | 'google') => void;
  isLoading: boolean;
  isSignup?: boolean;
}> = ({ onSocialLogin, isLoading, isSignup = false }) => (
  <>
    <div className="relative my-6">
      <Separator />
      <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-sm text-gray-500">
        또는
      </span>
    </div>
    
    <div className="space-y-3">
      <SocialLoginButton 
        provider="github"
        icon="/icons/github.svg" 
        color="#24292e" 
        label={`GitHub로 ${isSignup ? '노트 만들기' : '로그인'}`}
        onClick={() => onSocialLogin('github')}
        isLoading={isLoading}
      />
      <SocialLoginButton 
        provider="google" 
        icon="/icons/google.svg" 
        color="#DB4437" 
        label={`Google로 ${isSignup ? '노트 만들기' : '로그인'}`}
        onClick={() => onSocialLogin('google')}
        isLoading={isLoading}
      />
    </div>
  </>
);