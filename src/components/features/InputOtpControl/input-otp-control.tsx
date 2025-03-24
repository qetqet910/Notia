"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthProvider";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";

export const InputOTPControlled: React.FC = () => {
  const [value, setValue] = useState("");
  const { loginWithKey, isLoading } = useAuth();

  // 키 입력 처리
  const handleValueChange = (newValue: string) => {
    setValue(newValue);

    // 하이픈 제거 후 16자리 키가 모두 입력되면 자동 로그인 시도
    const cleanValue = newValue.replace(/-/g, "");
    if (cleanValue.length === 16) {
      handleSubmit(newValue);
    }
  };

  // 로그인 처리
  const handleSubmit = async (keyValue: string) => {
    try {
      await loginWithKey(keyValue);
    } catch (error) {
      console.error("로그인 오류:", error);
    }
  };

  // 컴포넌트 마운트 시 포커스
  useEffect(() => {
    const firstInput = document.querySelector('input[name="0"]');
    if (firstInput instanceof HTMLInputElement) {
      firstInput.focus();
    }
  }, []);

  // 명시적으로 각 슬롯 렌더링
  return (
    <div className="space-y-4 w-full max-w-md mx-auto">
      <InputOTP
        maxLength={16}
        value={value}
        onChange={(value) => setValue(value)}
        onComplete={handleValueChange}
        className="gap-0.5 sm:gap-1"
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
    </div>
  );
};
