import * as React from "react"
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp"

export const InputOTPControlled: React.FC = () => {
  const [value, setValue] = React.useState("")

  const formatValue = (val: string) => {
    return val.replace(/(.{4})/g, "$1-").replace(/-$/, "");
  };

  return (
    <div className="space-y-4 w-full max-w-md mx-auto">
      <InputOTP maxLength={16} value={value} onChange={(value) => setValue(value)} className="gap-0.5 sm:gap-1">
        <div className="flex flex-col w-full justify-center gap-1 sm:gap-2">
          <div className="flex justify-center gap-0.5 sm:gap-1">
            <InputOTPGroup className="gap-0.5 sm:gap-1">
              <InputOTPSlot index={0} className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
              <InputOTPSlot index={1} className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
              <InputOTPSlot index={2} className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
              <InputOTPSlot index={3} className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
            </InputOTPGroup>
            <InputOTPSeparator className="mt-1 sm:mt-1.5 md:mt-2" />
            <InputOTPGroup className="gap-0.5 sm:gap-1">
              <InputOTPSlot index={4} className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
              <InputOTPSlot index={5} className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
              <InputOTPSlot index={6} className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
              <InputOTPSlot index={7} className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
            </InputOTPGroup>
          </div>
          <div className="flex justify-center gap-0.5 sm:gap-1">
            <InputOTPGroup className="gap-0.5 sm:gap-1">
              <InputOTPSlot index={8} className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
              <InputOTPSlot index={9} className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
              <InputOTPSlot index={10} className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
              <InputOTPSlot index={11} className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
            </InputOTPGroup>
            <InputOTPSeparator className="mt-1 sm:mt-1.5 md:mt-2" />
            <InputOTPGroup className="gap-0.5 sm:gap-1">
              <InputOTPSlot index={12} className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
              <InputOTPSlot index={13} className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
              <InputOTPSlot index={14} className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
              <InputOTPSlot index={15} className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
            </InputOTPGroup>
          </div>
        </div>
      </InputOTP>

      <div className="text-center text-sm">
        {value === "" ? <span>코드를 입력해주세요.</span> : <span className="text-sm">{formatValue(value)}</span>}
      </div>
    </div>
  )
}

