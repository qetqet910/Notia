'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';

export const InputOTPControlled: React.FC = () => {
  const [value, setValue] = useState('');
  const { loginWithKey, isLoading } = useAuthStore();
  const [localLoading, setLocalLoading] = useState(false);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 키 입력 처리
  const handleValueChange = (newValue: string) => {
    // 이미 로딩 중이면 입력 무시
    if (isLoading || localLoading || isSubmitting) return;

    setValue(newValue);

    // 하이픈 제거 후 16자리 키가 모두 입력되면 자동 로그인 시도
    const cleanValue = newValue.replace(/-/g, '');
    if (cleanValue.length === 16) {
      handleSubmit(newValue);
    }
  };

  // 로그인 처리
  const handleSubmit = async (keyValue: string) => {
    // 이미 로딩 중이면 중복 요청 방지
    if (isLoading || localLoading || isSubmitting) return;

    try {
      // 로컬 로딩 상태 설정
      setLocalLoading(true);
      setIsSubmitting(true);

      console.log(
        '키 로그인 시도:',
        keyValue.replace(/-/g, '').substring(0, 4) + '****',
      );

      // 로그인 시도
      const result = await loginWithKey(keyValue);

      if (!result.success) {
        toast({
          title: '로그인 실패',
          description: result.message || '로그인에 실패했습니다.',
          variant: 'destructive',
        });

        // 실패 시 입력값 초기화
        setValue('');
      } else {
        toast({
          title: '로그인 성공',
          description: '로그인에 성공했습니다. 대시보드로 이동합니다.',
        });
      }
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
    } finally {
      // 일정 시간 후 로컬 로딩 상태 해제 (UI 표시를 위해)
      setTimeout(() => {
        setLocalLoading(false);
        setIsSubmitting(false);
      }, 1000);
    }
  };

  // 컴포넌트 마운트 시 포커스
  useEffect(() => {
    const firstInput = document.querySelector('input[name="0"]');
    if (firstInput instanceof HTMLInputElement) {
      firstInput.focus();
    }
  }, []);

  // 전역 또는 로컬 로딩 상태 확인
  const isProcessing = isLoading || localLoading || isSubmitting;

  return (
    <div className="space-y-4 w-full max-w-md mx-auto">
      <InputOTP
        maxLength={16}
        value={value}
        onChange={(value) => setValue(value)}
        onComplete={handleValueChange}
        className="gap-0.5 sm:gap-1"
        disabled={isProcessing}
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

      {/* 로딩 상태 표시 */}
      {isProcessing && (
        <div className="flex justify-center mt-2">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#61C9A8]"></div>
          <span className="ml-2 text-sm text-gray-500">처리 중...</span>
        </div>
      )}
    </div>
  );
};
