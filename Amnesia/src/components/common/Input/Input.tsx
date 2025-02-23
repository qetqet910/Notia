import * as React from "react"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"

export function InputOTPControlled() {
  const [value, setValue] = React.useState("")

  return (
    <div className="space-y-4">
      <InputOTP
        maxLength={16}
        value={value}
        onChange={(value) => setValue(value)}
        className="gap-1" // Reduce gap between inputs
      >
        <div className="flex flex-col pl-3 justify-center gap-1"> {/* Reduced gap */}
          <div className="flex justify-center gap-1"> {/* Reduced gap */}
            <InputOTPGroup className="gap-1"> {/* Reduced gap */}
              <InputOTPSlot index={0} className="w-10 h-10" /> {/* Smaller size */}
              <InputOTPSlot index={1} className="w-10 h-10" />
              <InputOTPSlot index={2} className="w-10 h-10" />
              <InputOTPSlot index={3} className="w-10 h-10" />
            </InputOTPGroup>
            <InputOTPSeparator className="mt-2"/>
            <InputOTPGroup className="gap-1">
              <InputOTPSlot index={4} className="w-10 h-10" />
              <InputOTPSlot index={5} className="w-10 h-10" />
              <InputOTPSlot index={6} className="w-10 h-10" />
              <InputOTPSlot index={7} className="w-10 h-10" />
            </InputOTPGroup>
          </div>
          <div className="flex justify-center gap-1">
            <InputOTPGroup className="gap-1">
              <InputOTPSlot index={8} className="w-10 h-10" />
              <InputOTPSlot index={9} className="w-10 h-10" />
              <InputOTPSlot index={10} className="w-10 h-10" />
              <InputOTPSlot index={11} className="w-10 h-10" />
            </InputOTPGroup>
            <InputOTPSeparator className="mt-2"/>
            <InputOTPGroup className="gap-1">
              <InputOTPSlot index={12} className="w-10 h-10" />
              <InputOTPSlot index={13} className="w-10 h-10" />
              <InputOTPSlot index={14} className="w-10 h-10" />
              <InputOTPSlot index={15} className="w-10 h-10" />
            </InputOTPGroup>
          </div>
        </div>
      </InputOTP>
      
      <div className="text-center text-sm">
        {value === "" ? (
          <span>코드를 입력하세요.</span>
        ) : (
          <span>코드: {value}</span>
        )}
      </div>
    </div>
  )
}