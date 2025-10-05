import React, { useState, useCallback } from 'react';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/useToast';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';

export const InputOTPControlled: React.FC = () => {
  const [value, setValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { loginWithKey } = useAuthStore();
  const { toast } = useToast();

  const handleSubmit = useCallback(
    async (key: string) => {
      if (key.length !== 16) {
        toast({
          title: '오류',
          description: '16자리 키를 모두 입력해주세요.',
          variant: 'destructive',
        });
        return;
      }

      setIsProcessing(true);
      try {
        const { success, message } = await loginWithKey(key);
        if (!success) {
          toast({
            title: '로그인 실패',
            description: message,
            variant: 'destructive',
          });
          setValue('');
          if (!success) throw message;
        }
      } catch (message) {
        toast({
          title: '로그인 오류',
          description: message,
          variant: 'destructive',
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [loginWithKey, toast],
  );

  const handleKeyUp = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter') {
      handleSubmit(value);
    }
  };

  return (
    <div className="space-y-4 w-full max-w-md mx-auto" onKeyUp={handleKeyUp}>
      <InputOTP
        value={value}
        onChange={setValue}
        onComplete={handleSubmit}
        disabled={isProcessing}
        maxLength={16}
        autoFocus
        autoComplete="off"
        spellCheck={false}
      >
        <div className="flex flex-col w-full justify-center gap-1 sm:gap-2">
          <div className="flex justify-center gap-0.5 sm:gap-1">
            <InputOTPGroup className="gap-0.5 sm:gap-1">
              <InputOTPSlot
                index={0}
                className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8"
              />
              <InputOTPSlot
                index={1}
                className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8"
              />
              <InputOTPSlot
                index={2}
                className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8"
              />
              <InputOTPSlot
                index={3}
                className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8"
              />
            </InputOTPGroup>
            <InputOTPSeparator className="sm:mt-0.5 md:mt-1" />
            <InputOTPGroup className="gap-0.5 sm:gap-1">
              <InputOTPSlot
                index={4}
                className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8"
              />
              <InputOTPSlot
                index={5}
                className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8"
              />
              <InputOTPSlot
                index={6}
                className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8"
              />
              <InputOTPSlot
                index={7}
                className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8"
              />
            </InputOTPGroup>
          </div>
          <div className="flex justify-center gap-0.5 sm:gap-1">
            <InputOTPGroup className="gap-0.5 sm:gap-1">
              <InputOTPSlot
                index={8}
                className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8"
              />
              <InputOTPSlot
                index={9}
                className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8"
              />
              <InputOTPSlot
                index={10}
                className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8"
              />
              <InputOTPSlot
                index={11}
                className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8"
              />
            </InputOTPGroup>
            <InputOTPSeparator className="sm:mt-0.5 md:mt-1" />
            <InputOTPGroup className="gap-0.5 sm:gap-1">
              <InputOTPSlot
                index={12}
                className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8"
              />
              <InputOTPSlot
                index={13}
                className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8"
              />
              <InputOTPSlot
                index={14}
                className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8"
              />
              <InputOTPSlot
                index={15}
                className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8"
              />
            </InputOTPGroup>
          </div>
        </div>
      </InputOTP>

      {isProcessing && (
        <div className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      <p className="text-sm text-center text-muted-foreground">
        16자리 인증 키를 입력하세요
      </p>
    </div>
  );
};
