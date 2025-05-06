import type React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@services/supabaseClient';

// 메모이제이션을 위해 함수를 컴포넌트 외부로 이동
const debounce = <F extends (...args: any[]) => Promise<any>>(
  func: F,
  waitFor: number,
) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<F>): Promise<ReturnType<F>> => {
    if (timeout) {
      clearTimeout(timeout);
    }

    return new Promise((resolve) => {
      timeout = setTimeout(async () => {
        const result = await func(...args);
        resolve(result);
        timeout = null;
      }, waitFor);
    }) as Promise<ReturnType<F>>;
  };
};

export const InputOTPControlled: React.FC = () => {
  const [value, setValue] = useState('');
  const { loginWithKey, isLoading } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  // 사용자가 입력할 때 호출되는 함수
  const handleValueChange = useCallback(
    (newValue: string) => {
      // 이미 처리 중이면 입력 무시
      if (isLoading || isSubmitting) return;

      const sanitizedValue = newValue
        .replace(/[^a-zA-Z0-9-]/g, '')
        .toUpperCase();
      setValue(sanitizedValue);

      // 하이픈 제거 후 16자리 키가 모두 입력되면 자동 로그인 시도
      const cleanValue = sanitizedValue.replace(/-/g, '');
      if (cleanValue.length === 16) {
        void handleSubmit(cleanValue);
      }
    },
    [isLoading, isSubmitting],
  );

  // 로그인 처리 함수 - 디바운스 적용
  const handleSubmit = useCallback(
    debounce(async (keyValue: string) => {
      // 이미 처리 중이면 중복 요청 방지
      if (isLoading || isSubmitting) return { success: false };

      try {
        setIsSubmitting(true);

        const result = await loginWithKey(keyValue);

        if (!result.success) {
          toast({
            title: '로그인 실패',
            description: result.message || '로그인에 실패했습니다.',
            variant: 'destructive',
          });

          // 실패 시 입력값 초기화하고 포커스 설정
          setValue('');
          setTimeout(() => inputRef.current?.focus(), 100);
        } else {
          toast({
            title: '로그인 성공',
            description: '환영합니다! 대시보드로 이동합니다.',
          });
        }

        return result;
      } catch (error) {
        console.error('로그인 오류:', error);

        toast({
          title: '로그인 오류',
          description:
            error instanceof Error
              ? error.message
              : '로그인 중 오류가 발생했습니다.',
          variant: 'destructive',
        });

        // 오류 발생 시 입력값 초기화
        setValue('');
        return { success: false, error };
      } finally {
        setIsSubmitting(false);
      }
    }, 300), // 300ms 디바운스로 빠른 연속 요청 방지
    [loginWithKey, isLoading, isSubmitting, toast],
  );

  // 컴포넌트 마운트 시 포커스
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 로딩 상태 메모이제이션
  const isProcessing = isLoading || isSubmitting;

  return (
    <div className="space-y-4 w-full max-w-md mx-auto">
      <InputOTP
        ref={inputRef}
        value={value}
        onChange={handleValueChange}
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

      {/* 로딩 상태 표시 - 조건식 수정 */}
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
