import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTPControlled } from '@/components/common/InputOtpControl';
import { KeyDisplay } from '@/components/common/KeyDisplay';
import { animations } from '@/constants/animations';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Key from 'lucide-react/dist/esm/icons/key';

export const SocialLoginButton = React.memo<{
  provider: 'github' | 'google';
  icon: string;
  color: string;
  label: string;
  onClick: (provider: 'github' | 'google') => void;
  disabled: boolean;
  keyPrefix: string;
}>(({ provider, icon, color, label, onClick, disabled, keyPrefix }) => (
  <motion.div
    key={`${keyPrefix}-${provider}`}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Button
      variant="ghost"
      className="w-full flex items-center justify-center gap-2 h-11 mb-2 border !bg-white/80 dark:!bg-black/60 backdrop-blur-md border-white/40 dark:border-white/10 hover:!bg-white dark:hover:!bg-black/80 transition-all hover:shadow-md shadow-sm"
      style={{ color }}
      onClick={() => onClick(provider)}
      disabled={disabled}
    >
      <img
        src={icon || '/placeholder.svg'}
        alt={provider}
        className="w-5 h-5"
      />
      <span>{label}</span>
    </Button>
  </motion.div>
));
SocialLoginButton.displayName = 'SocialLoginButton';

export const LoginForm = React.memo<{
  isLoginLoading: boolean;
  onSocialLogin: (provider: 'github' | 'google') => void;
  transparent?: boolean;
}>(({ isLoginLoading, onSocialLogin, transparent }) => (
  <motion.div
    key="login-form-tab"
    initial="hidden"
    animate="visible"
    exit="exit"
    variants={animations.tabContent}
    className="space-y-4"
  >
    <form className="space-y-4 mb-6" onSubmit={(e) => e.preventDefault()}>
      <div className="min-h-[120px]">
        <motion.div
          key="key-login-tab"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={animations.tabContent}
          className="space-y-4"
        >
          <motion.div
            key="key-input"
            className={`${transparent ? '' : 'bg-[#f0faf7] p-4'} rounded-lg`}
            variants={animations.item}
          >
            <InputOTPControlled />
          </motion.div>
          <motion.div key="key-button" variants={animations.item}>
            <Button
              type="submit"
              className="w-full h-11 bg-[#61C9A8] hover:bg-[#4db596]"
              disabled={isLoginLoading}
            >
              {isLoginLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>처리 중...</span>
                </div>
              ) : (
                '로그인'
              )}
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </form>

    <motion.div
      key="login-separator"
      className="relative my-6 flex items-center justify-center"
      variants={animations.item}
    >
      <div className="flex-1 h-[2px] bg-border/80"></div>
      <span className="text-xs font-medium text-muted-foreground bg-transparent px-3">
        또는
      </span>
      <div className="flex-1 h-[2px] bg-border/80"></div>
    </motion.div>

    <motion.div
      key="login-social"
      className="space-y-2"
      variants={animations.stagger}
    >
      <SocialLoginButton
        provider="github"
        icon="/icons/github.svg"
        color="#24292e"
        label="GitHub로 로그인"
        onClick={onSocialLogin}
        disabled={isLoginLoading}
        keyPrefix="login"
      />
      <SocialLoginButton
        provider="google"
        icon="/icons/google.svg"
        color="#DB4437"
        label="Google로 로그인"
        onClick={onSocialLogin}
        disabled={isLoginLoading}
        keyPrefix="login"
      />
    </motion.div>
  </motion.div>
));
LoginForm.displayName = 'LoginForm';

export const SignupForm = React.memo<{
  isRegisterLoading: boolean;
  email: string;
  setEmail: (email: string) => void;
  formattedKey: string | null;
  showKey: boolean;
  copiedKey: boolean;
  handleCreateEmailKey: (e: React.FormEvent) => void;
  handleCreateAnonymousKey: (e: React.FormEvent) => void;
  copyToClipboard: (text: string) => void;
  onSocialLogin: (provider: 'github' | 'google') => void;
}>(
  ({
    isRegisterLoading,
    email,
    setEmail,
    formattedKey,
    showKey,
    copiedKey,
    handleCreateEmailKey,
    handleCreateAnonymousKey,
    copyToClipboard,
    onSocialLogin,
  }) => (
    <motion.div
      key="signup-form-tab"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={animations.tabContent}
      className="space-y-4"
    >
      <div className="space-y-4">
        <motion.div key="create-email-key-form" variants={animations.item}>
          <form onSubmit={handleCreateEmailKey} className="space-y-3">
            <div>
              <Input
                type="email"
                placeholder="이메일 주소"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 border-[#c5e9de] focus:border-[#61C9A8] focus:ring-[#61C9A8]"
                required
                disabled={isRegisterLoading}
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 bg-[#61C9A8] hover:bg-[#4db596]"
              disabled={isRegisterLoading || !email.trim()}
            >
              {isRegisterLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  이메일로 키 만들기
                </>
              )}
            </Button>
          </form>
        </motion.div>
        <motion.div
          key="create-anonymous-key-button"
          variants={animations.item}
        >
          <Button
            type="button"
            variant="ghost"
            className="w-full h-11 border border-white/40 dark:border-white/10 !bg-white/80 dark:!bg-black/60 hover:!bg-white dark:hover:!bg-black/80 backdrop-blur-md transition-all hover:shadow-md shadow-sm"
            disabled={isRegisterLoading}
            onClick={handleCreateAnonymousKey}
          >
            {isRegisterLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                처리 중...
              </>
            ) : (
              <>
                <Key className="h-4 w-4 mr-2" />
                이메일 없이 키 만들기
              </>
            )}
          </Button>
        </motion.div>

        {!!formattedKey && !!showKey && (
          <div className="space-y-4">
            <KeyDisplay
              formattedKey={formattedKey}
              onCopy={() => copyToClipboard(formattedKey)}
              copied={copiedKey}
            />
          </div>
        )}
      </div>

      <motion.div
        key="signup-separator"
        className="relative my-6 flex items-center justify-center"
        variants={animations.item}
      >
        <div className="flex-1 h-[2px] bg-border/80"></div>
        <span className="text-xs font-medium text-muted-foreground bg-transparent px-3">
          또는
        </span>
        <div className="flex-1 h-[2px] bg-border/80"></div>
      </motion.div>

      <motion.div
        key="signup-social"
        className="space-y-2"
        variants={animations.stagger}
      >
        <SocialLoginButton
          provider="github"
          icon="/icons/github.svg"
          color="#24292e"
          label="GitHub로 노트 만들기"
          onClick={onSocialLogin}
          disabled={isRegisterLoading}
          keyPrefix="signup"
        />
        <SocialLoginButton
          provider="google"
          icon="/icons/google.svg"
          color="#DB4437"
          label="Google로 노트 만들기"
          onClick={onSocialLogin}
          disabled={isRegisterLoading}
          keyPrefix="signup"
        />
      </motion.div>
    </motion.div>
  ),
);
SignupForm.displayName = 'SignupForm';
