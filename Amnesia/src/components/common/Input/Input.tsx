"use client"

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
    <div className="space-y-4 ml-4 flex flex-col justify-center align-center">
      {/* First Row */}
      <div>
        <InputOTP
          maxLength={16}
          value={value}
          onChange={(value) => setValue(value)}
        >
          <div className="flex flex-col gap-2">
            <div className="flex justify-center">
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
                <InputOTPSlot index={6} />
                <InputOTPSlot index={7} />
              </InputOTPGroup>
            </div>

            {/* Second Row */}
            <div className="flex justify-center">
              <InputOTPGroup>
                <InputOTPSlot index={8} />
                <InputOTPSlot index={9} />
                <InputOTPSlot index={10} />
                <InputOTPSlot index={11} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={12} />
                <InputOTPSlot index={13} />
                <InputOTPSlot index={14} />
                <InputOTPSlot index={15} />
              </InputOTPGroup>
            </div>
          </div>
        </InputOTP>
      </div>
      
      <div className="text-center text-sm">
        {value === "" ? (
          <>팀 코드를<br></br>입력하세요.</>
        ) : (
          <>코드: {value}</>
        )}
      </div>
    </div>
  )
}