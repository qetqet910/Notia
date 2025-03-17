"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Users } from "react-feather"
import { Copy, Key, AlertCircle, Loader2 } from "lucide-react"
import Lottie from "lottie-react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { InputOTPControlled } from "@/components/features/InputOtpControl/input-otp-control"
import { useAuth } from "@/context/AuthProvider"
import logoImage from "@/stores/images/Logo.png"
import animationData from "@/stores/data/login-animation.json"

// 애니메이션 변수들
const animations = {
  card: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  },
  tabContent: {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      x: 10,
      transition: { duration: 0.2 },
    },
  },
  stagger: {
    visible: {
      transition: { staggerChildren: 0.1 },
    },
  },
  item: {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  },
}

// 소셜 로그인 버튼 컴포넌트
const SocialLoginButton: React.FC<{
  provider: "github" | "google"
  icon: string
  color: string
  label: string
  onClick: (provider: "github" | "google") => void
  disabled: boolean
  animate: boolean
}> = ({ provider, icon, color, label, onClick, disabled, animate }) => (
  <motion.div
    initial={animate ? { opacity: 0, y: 10 } : false}
    animate={animate ? { opacity: 1, y: 0 } : {}}
    transition={{ duration: 0.3 }}
  >
    <Button
      variant="outline"
      className="w-full flex items-center justify-center gap-2 h-11 mb-2 hover:shadow-sm"
      style={{ borderColor: color, color }}
      onClick={() => onClick(provider)}
      disabled={disabled}
    >
      <img src={icon || "/placeholder.svg"} alt={provider} className="w-5 h-5" />
      <span>{label}</span>
    </Button>
  </motion.div>
)

// 키 표시 컴포넌트
const KeyDisplay: React.FC<{
  formattedKey: string
  onCopy: () => void
  copied: boolean
}> = ({ formattedKey, onCopy, copied }) => (
  <motion.div
    className="mt-6 pt-4 border-t"
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: "auto" }}
    exit={{ opacity: 0, height: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="flex items-center mb-3">
      <Key size={18} className="mr-2 text-[#61C9A8]" />
      <h3 className="text-md font-medium text-[#61C9A8]">노트 키</h3>
    </div>

    <motion.div
      className="flex"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="flex-grow relative">
        <Input readOnly value={formattedKey} className="font-mono text-center tracking-wide border-[#c5e9de]" />
      </div>
      <Button
        variant="outline"
        size="icon"
        className="ml-2 border-[#c5e9de] hover:bg-[#f0faf7] hover:border-[#61C9A8]"
        onClick={onCopy}
      >
        <Copy size={16} className="text-[#61C9A8]" />
      </Button>
    </motion.div>

    <AnimatePresence mode="wait">
      {copied && (
        <motion.p
          className="text-xs text-green-600 mt-1 text-center"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          노트 키가 복사되었습니다!
        </motion.p>
      )}
    </AnimatePresence>

    <motion.p
      className="text-xs text-muted-foreground mt-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      키를 잃어버리면 데이터에 접근할 수 없습니다. 안전하게 보관하세요.
    </motion.p>
  </motion.div>
)

// 에러 메시지 컴포넌트
const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <motion.div
    className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-center gap-2 mt-4"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 10 }}
    transition={{ duration: 0.3 }}
  >
    <AlertCircle size={16} />
    <span className="text-sm">{message}</span>
  </motion.div>
)

// 로그인 컴포넌트
export const Login: React.FC = () => {
  const {
    loginWithKey,
    isAuthenticated,
    userKey,
    formattedKey,
    isLoading,
    error,
    generateAndStoreKey,
    loginWithSocial,
    createGroup,
    joinGroup,
  } = useAuth()

  const [email, setEmail] = useState("")
  const [copiedKey, setCopiedKey] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [activeTab, setActiveTab] = useState("login")
  const [activeAuthTab, setActiveAuthTab] = useState("key")
  const [signupTab, setSignupTab] = useState("key")
  const [initialAnimationComplete, setInitialAnimationComplete] = useState(false)
  const navigate = useNavigate()

  // 인증 상태 변경 시 리디렉션
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate("/dashboard")
    }
  }, [isAuthenticated, isLoading, navigate])

  // 애니메이션 완료 타이머
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialAnimationComplete(true)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  // 키 복사 핸들러
  const copyToClipboard = () => {
    if (userKey) {
      navigator.clipboard.writeText(userKey)
      setCopiedKey(true)
      setTimeout(() => setCopiedKey(false), 2000)
    }
  }

  // 키 로그인 핸들러
  const handleKeyLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // InputOTPControlled 컴포넌트에서 처리됨
  }

  // 그룹 참여 핸들러
  const handleGroupJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (formattedKey) {
      joinGroup(formattedKey.replace(/-/g, ""))
    }
  }

  // 소셜 로그인 핸들러
  const handleSocialLogin = async (provider: "github" | "google") => {
    try {
      console.log(`${provider} 로그인 시도`)
      await new Promise((resolve) => setTimeout(resolve, 100))
      await loginWithSocial(provider)
    } catch (error) {
      console.error(`${provider} 로그인 오류:`, error)
    }
  }

  // 새 키 생성 핸들러
  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await generateAndStoreKey(email)
      setShowKey(true)
    } catch (err) {
      console.error("키 생성 오류:", err)
    }
  }

  // 그룹 생성 핸들러
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const result = await createGroup("새 그룹")
      console.log("그룹 생성 성공:", result)
    } catch (err: any) {
      console.error("그룹 생성 오류:", err)
    }
  }

  // 로그인 탭 렌더링
  const renderLoginTab = () => (
    <motion.div
      key="login-form"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={animations.tabContent}
      className="space-y-4"
    >
      <form className="space-y-4 mb-6" onSubmit={activeAuthTab === "key" ? handleKeyLogin : handleGroupJoin}>
        <Tabs defaultValue="key" className="space-y-4" onValueChange={setActiveAuthTab}>
          <TabsList className="grid grid-cols-2 gap-4">
            <TabsTrigger
              value="key"
              className={`flex items-center justify-center gap-2 ${
                activeAuthTab === "key" ? "text-[#61C9A8] bg-[#e6f7f2]" : ""
              }`}
            >
              <Key className="h-4 w-4" />
              노트
            </TabsTrigger>
            <TabsTrigger
              value="group"
              className={`flex items-center justify-center gap-2 ${
                activeAuthTab === "group" ? "text-[#61C9A8] bg-[#e6f7f2]" : ""
              }`}
            >
              <Users className="h-4 w-4" />
              그룹
            </TabsTrigger>
          </TabsList>

          <div className="min-h-[120px]">
            <AnimatePresence mode="wait">
              {activeAuthTab === "key" && (
                <motion.div
                  key="key-tab"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={animations.tabContent}
                  className="space-y-4"
                >
                  <motion.div className="bg-[#f0faf7] p-4 rounded-lg" variants={animations.item}>
                    <InputOTPControlled />
                  </motion.div>
                  <motion.div variants={animations.item}>
                    <Button type="submit" className="w-full h-11 bg-[#61C9A8] hover:bg-[#4db596]" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          처리 중...
                        </>
                      ) : (
                        "로그인"
                      )}
                    </Button>
                  </motion.div>
                </motion.div>
              )}

              {activeAuthTab === "group" && (
                <motion.div
                  key="group-tab"
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={animations.tabContent}
                  className="space-y-4"
                >
                  <motion.div className="bg-[#f0faf7] p-4 rounded-lg" variants={animations.item}>
                    <InputOTPControlled />
                  </motion.div>
                  <motion.div variants={animations.item}>
                    <Button type="submit" className="w-full h-11 bg-[#61C9A8] hover:bg-[#4db596]" disabled={isLoading}>
                      그룹 참여하기
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Tabs>
      </form>

      <motion.div className="relative my-4" variants={animations.item}>
        <Separator />
        <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-sm text-gray-500">
          또는
        </span>
      </motion.div>

      <motion.div className="space-y-2" variants={animations.stagger}>
        <SocialLoginButton
          provider="github"
          icon="/icons/github.svg"
          color="#24292e"
          label="GitHub로 로그인"
          onClick={handleSocialLogin}
          disabled={isLoading}
          animate={!initialAnimationComplete}
        />
        <SocialLoginButton
          provider="google"
          icon="/icons/google.svg"
          color="#DB4437"
          label="Google로 로그인"
          onClick={handleSocialLogin}
          disabled={isLoading}
          animate={!initialAnimationComplete}
        />
      </motion.div>
    </motion.div>
  )

  // 회원가입 탭 렌더링
  const renderSignupTab = () => (
    <motion.div
      key="signup-form"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={animations.tabContent}
      className="space-y-4"
    >
      <Tabs defaultValue="key" className="space-y-4" value={signupTab} onValueChange={setSignupTab}>
        <TabsList className="grid grid-cols-2 gap-4">
          <TabsTrigger value="key" className="flex items-center justify-center gap-2">
            <Key className="h-4 w-4" />
            노트
          </TabsTrigger>
          <TabsTrigger value="group" className="flex items-center justify-center gap-2">
            <Users className="h-4 w-4" />
            그룹
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value="key" className="space-y-4">
            <form onSubmit={handleCreateKey} className="space-y-4">
              <motion.div className="bg-[#f0faf7] p-4 rounded-lg" variants={animations.item}>
                <Input
                  type="email"
                  placeholder="이메일"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-[#c5e9de] focus:border-[#61C9A8] focus:ring-[#61C9A8]"
                />
                <p className="text-xs text-gray-500 mt-2">이메일을 입력하지 않으면 백업 키를 받을 수 없어요!</p>
              </motion.div>

              <motion.div variants={animations.item}>
                <Button type="submit" className="w-full h-11 bg-[#61C9A8] hover:bg-[#4db596]" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      처리 중...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />새 키 만들기
                    </>
                  )}
                </Button>
              </motion.div>
            </form>
          </TabsContent>

          <TabsContent value="group" className="space-y-4">
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <motion.div variants={animations.item}>
                <Button type="submit" className="w-full h-11 bg-[#61C9A8] hover:bg-[#4db596]" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      처리 중...
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4 mr-2" />새 그룹 만들기
                    </>
                  )}
                </Button>
              </motion.div>
            </form>
          </TabsContent>
        </AnimatePresence>
      </Tabs>

      <AnimatePresence mode="wait">
        {userKey && showKey && (
          <KeyDisplay formattedKey={formattedKey || ""} onCopy={copyToClipboard} copied={copiedKey} />
        )}
      </AnimatePresence>

      <motion.div className="relative my-4" variants={animations.item}>
        <Separator />
        <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-sm text-gray-500">
          또는
        </span>
      </motion.div>

      <motion.div className="space-y-2" variants={animations.stagger}>
        <SocialLoginButton
          provider="github"
          icon="/icons/github.svg"
          color="#24292e"
          label="GitHub로 노트 만들기"
          onClick={handleSocialLogin}
          disabled={isLoading}
          animate={!initialAnimationComplete}
        />
        <SocialLoginButton
          provider="google"
          icon="/icons/google.svg"
          color="#DB4437"
          label="Google로 노트 만들기"
          onClick={handleSocialLogin}
          disabled={isLoading}
          animate={!initialAnimationComplete}
        />
      </motion.div>
    </motion.div>
  )

  // 애니메이션 섹션 렌더링
  const renderAnimationSection = () => (
    <motion.div
      className="w-full lg:w-1/2 pl-16 flex items-center justify-center lg:justify-start p-8 order-first lg:order-last bg-gradient-to-b lg:bg-gradient-to-r from-white to-[#e6f7f2]"
      initial={!initialAnimationComplete ? { opacity: 0, x: 20 } : false}
      animate={!initialAnimationComplete ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      <div className="w-full max-w-md">
        <motion.div
          className="w-full md:w-4/5 mx-auto"
          initial={!initialAnimationComplete ? { scale: 0.9 } : false}
          animate={!initialAnimationComplete ? { scale: 1 } : {}}
          transition={{
            duration: 0.8,
            type: "spring",
            bounce: 0.3,
          }}
        >
          <Lottie animationData={animationData} className="drop-shadow-xl" />
        </motion.div>

        <motion.div
          className="text-center mt-6"
          initial={!initialAnimationComplete ? { opacity: 0, y: 20 } : false}
          animate={!initialAnimationComplete ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <motion.h2
            className="text-xl md:text-2xl font-bold text-[#61C9A8]"
            initial={!initialAnimationComplete ? { opacity: 0 } : false}
            animate={!initialAnimationComplete ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            안전하게 기록하세요
          </motion.h2>
          <motion.p
            className="text-gray-600 mt-2 max-w-sm mx-auto"
            initial={!initialAnimationComplete ? { opacity: 0 } : false}
            animate={!initialAnimationComplete ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            Amnesia는 생각과 아이디어를 항상 안전하게 보관합니다.
            <br />
            언제 어디서나 접근하세요.
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  )

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-white to-[#e6f7f2]">
      {/* 로그인 섹션 */}
      <div className="w-full lg:w-1/2 p-4 md:p-8 flex items-start lg:mt-32 lg:mb-16 justify-center lg:justify-end lg:pr-24">
        <motion.div
          initial={!initialAnimationComplete ? "hidden" : false}
          animate={!initialAnimationComplete ? "visible" : {}}
          variants={animations.card}
        >
          <Card className="relative w-full max-w-md shadow-lg border-[#d8f2ea] overflow-visible">
            <CardContent className="pt-8 pb-6">
              {/* 로고 */}
              <motion.div
                className="flex justify-center items-center mb-6"
                initial={!initialAnimationComplete ? { scale: 0.9, opacity: 0 } : false}
                animate={!initialAnimationComplete ? { scale: 1, opacity: 1 } : {}}
                transition={{ duration: 0.5 }}
              >
                <Link to="/" className="w-1/2 object-contain pointer">
                  <img src={logoImage || "/placeholder.svg"} alt="로고" />
                </Link>
              </motion.div>

              {/* 탭 컨테이너 */}
              <Tabs defaultValue="login" className="space-y-4" onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2 gap-4">
                  <TabsTrigger value="login" className={activeTab === "login" ? "text-[#61C9A8] bg-[#e6f7f2]" : ""}>
                    로그인
                  </TabsTrigger>
                  <TabsTrigger value="signup" className={activeTab === "signup" ? "text-[#61C9A8] bg-[#e6f7f2]" : ""}>
                    만들기
                  </TabsTrigger>
                </TabsList>

                {/* 탭 내용 */}
                <div className="relative min-h-[280px]" style={{ transformOrigin: "top" }}>
                  <AnimatePresence mode="wait">
                    {activeTab === "login" && renderLoginTab()}
                    {activeTab === "signup" && renderSignupTab()}
                  </AnimatePresence>
                </div>
              </Tabs>

              {/* 에러 메시지 */}
              <AnimatePresence mode="wait">{error && <ErrorMessage message={error} />}</AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* 애니메이션 섹션 */}
      {renderAnimationSection()}
    </div>
  )
}

export default Login

