import { AlarmClock } from "lucide-react"

export const Logo = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-200 to-violet-200 rounded-lg blur opacity-50"></div>
        <div className="relative bg-white dark:bg-gray-900 p-2 rounded-lg">
          <AlarmClock className="w-6 h-6 text-violet-500" />
        </div>
      </div>
      <span className="text-xxl font-bold bg-gradient-to-r from-pink-500 to-violet-500 text-transparent bg-clip-text">
        AMNESIA
      </span>
    </div>
  )
}

