import type React from "react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users } from "react-feather";
import { Copy, Key, AlertCircle, Loader2, Search } from "lucide-react";
import Lottie from "lottie-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { InputOTPControlled } from "@/components/features/InputOtpControl/input-otp-control";
import { useAuth } from "@/context/AuthProvider";
import logoImage from "@/stores/images/Logo.png";

import animationData from "@/stores/data/login-animation.json";

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
  } = useAuth();

  const [email, setEmail] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [activeAuthTab, setActiveAuthTab] = useState("key");
  const [initialAnimationComplete, setInitialAnimationComplete] =
    useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, isLoading, navigate]);

  const handleKeyLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // InputOTPControlled 컴포넌트에서 처리됨
  };

  // 소셜 로그인 핸들러
  const handleSocialLogin = async (provider: "github" | "google") => {
    try {
      console.log(`${provider} 로그인 시도`);
      // 지연시간 추가
      await new Promise((resolve) => setTimeout(resolve, 100));
      await loginWithSocial(provider);
    } catch (error) {
      console.error(`${provider} 로그인 오류:`, error);
    }
  };

  // 그룹 참여 핸들러
  const handleGroupJoin = (e: React.FormEvent) => {
    e.preventDefault();
    joinGroup(formattedKey.replace(/-/g, ""));
  };

  // 회원가입 핸들러
  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    generateAndStoreKey(email);
  };

  // 그룹 생성 핸들러
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    createGroup("새 그룹");
  };

  // 최초 로드 시 애니메이션 완료 표시
  useEffect(() => {
    // 초기 애니메이션 완료를 표시하는 타이머 설정
    const timer = setTimeout(() => {
      setInitialAnimationComplete(true);
    }, 1000); // 애니메이션 시간보다 약간 길게 설정

    return () => clearTimeout(timer);
  }, []);

  // Copy key to clipboard
  const copyToClipboard = () => {
    if (userKey) {
      navigator.clipboard.writeText(userKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  // Social login button component
  const SocialLoginButton: React.FC<{
    provider: "github" | "google";
    icon: string;
    color: string;
    label: string;
  }> = ({ provider, icon, color, label }) => (
    <motion.div
      // 최초 로드 후에는 애니메이션 비활성화
      initial={!initialAnimationComplete ? { opacity: 0, y: 10 } : false}
      animate={!initialAnimationComplete ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.3 }}
    >
      <Button
        variant="outline"
        className="w-full flex items-center justify-center gap-2 h-11 mb-2 hover:shadow-sm"
        style={{ borderColor: color, color }}
        onClick={() => handleSocialLogin(provider)}
        disabled={isLoading}
      >
        <img
          src={icon || "/placeholder.svg"}
          alt={provider}
          className="w-5 h-5"
        />
        <span>{label}</span>
      </Button>
    </motion.div>
  );

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const tabContentVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      x: 10,
      transition: {
        duration: 0.2,
      },
    },
  };

  const staggerChildren = {
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br from-white to-[#e6f7f2]">
      {/* Left login section */}
      <div className="w-full lg:w-1/2 p-4 md:p-8 flex items-start lg:mt-32 lg:mb-16 justify-center lg:justify-end lg:pr-24">
        <motion.div
          // 최초 로드 시에만 애니메이션 적용
          initial={!initialAnimationComplete ? "hidden" : false}
          animate={!initialAnimationComplete ? "visible" : {}}
          variants={cardVariants}
        >
          <Card className="relative w-full max-w-md shadow-lg border-[#d8f2ea] overflow-visible">
            <CardContent className="pt-8 pb-6">
              {/* 로고 애니메이션 - 최초 로드 시에만 적용 */}
              <motion.div
                className="flex justify-center items-center mb-6"
                initial={
                  !initialAnimationComplete ? { scale: 0.9, opacity: 0 } : false
                }
                animate={
                  !initialAnimationComplete ? { scale: 1, opacity: 1 } : {}
                }
                transition={{ duration: 0.5 }}
              >
                <Link to="/a" className="w-1/2 object-contain pointer">
                  <img src={logoImage} alt="로고" />
                </Link>
              </motion.div>

              <Tabs
                defaultValue="login"
                className="space-y-4"
                onValueChange={setActiveTab}
              >
                <TabsList className="grid grid-cols-2 gap-4">
                  <TabsTrigger
                    value="login"
                    className={
                      activeTab === "login" ? "text-[#61C9A8] bg-[#e6f7f2]" : ""
                    }
                  >
                    로그인
                  </TabsTrigger>
                  <TabsTrigger
                    value="signup"
                    className={
                      activeTab === "signup"
                        ? "text-[#61C9A8] bg-[#e6f7f2]"
                        : ""
                    }
                  >
                    만들기
                  </TabsTrigger>
                </TabsList>

                {/* 탭 내용 - 기준점을 상단으로 설정 */}
                <div
                  className="relative min-h-[280px]"
                  style={{ transformOrigin: "top" }}
                >
                  <AnimatePresence mode="wait">
                    {activeTab === "login" && (
                      <motion.div
                        key="login-tab"
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={tabContentVariants}
                        className="space-y-4"
                      >
                        <form
                          className="space-y-4 mb-6"
                          onSubmit={
                            activeAuthTab === "key"
                              ? handleKeyLogin
                              : handleGroupJoin
                          }
                        >
                          <Tabs
                            defaultValue="key"
                            className="space-y-4"
                            onValueChange={setActiveAuthTab}
                          >
                            <TabsList className="grid grid-cols-2 gap-4">
                              <TabsTrigger
                                value="key"
                                className={`flex items-center justify-center gap-2 ${
                                  activeAuthTab === "key"
                                    ? "text-[#61C9A8] bg-[#e6f7f2]"
                                    : ""
                                }`}
                              >
                                <Key className="h-4 w-4" />
                                노트
                              </TabsTrigger>
                              <TabsTrigger
                                value="group"
                                className={`flex items-center justify-center gap-2 ${
                                  activeAuthTab === "group"
                                    ? "text-[#61C9A8] bg-[#e6f7f2]"
                                    : ""
                                }`}
                              >
                                <Users className="h-4 w-4" />
                                그룹
                              </TabsTrigger>
                            </TabsList>

                            {/* 키/그룹 탭 내용 */}
                            <div className="min-h-[120px]">
                              <AnimatePresence mode="wait">
                                {activeAuthTab === "key" && (
                                  <motion.div
                                    key="key-tab"
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    variants={tabContentVariants}
                                    className="space-y-4"
                                  >
                                    <motion.div
                                      className="bg-[#f0faf7] p-4 rounded-lg"
                                      variants={itemVariants}
                                    >
                                      <InputOTPControlled />
                                    </motion.div>
                                    <motion.div variants={itemVariants}>
                                      <Button
                                        type="submit"
                                        className="w-full h-11 bg-[#61C9A8] hover:bg-[#4db596]"
                                        disabled={isLoading}
                                      >
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
                                    variants={tabContentVariants}
                                    className="space-y-4"
                                  >
                                    <motion.div
                                      className="bg-[#f0faf7] p-4 rounded-lg"
                                      variants={itemVariants}
                                    >
                                      <InputOTPControlled />
                                    </motion.div>
                                    <motion.div variants={itemVariants}>
                                      <Button
                                        type="submit"
                                        className="w-full h-11 bg-[#61C9A8] hover:bg-[#4db596]"
                                        disabled={isLoading}
                                      >
                                        그룹 참여하기
                                      </Button>
                                    </motion.div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </Tabs>
                        </form>

                        <motion.div
                          className="relative my-4"
                          variants={itemVariants}
                        >
                          <Separator />
                          <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-sm text-gray-500">
                            또는
                          </span>
                        </motion.div>

                        <motion.div
                          className="space-y-2"
                          variants={staggerChildren}
                        >
                          <SocialLoginButton
                            provider="github"
                            icon="/icons/github.svg"
                            color="#24292e"
                            label="GitHub로 로그인"
                          />
                          <SocialLoginButton
                            provider="google"
                            icon="/icons/google.svg"
                            color="#DB4437"
                            label="Google로 로그인"
                          />
                        </motion.div>
                      </motion.div>
                    )}

                    {activeTab === "signup" && (
                      <motion.div
                        key="signup-tab"
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={tabContentVariants}
                        className="space-y-4"
                      >
                        <form
                          className="space-y-4 mb-6"
                          onSubmit={handleSignup}
                        >
                          <Tabs defaultValue="key" className="space-y-4">
                            <TabsList className="grid grid-cols-2 gap-4">
                              <TabsTrigger
                                value="key"
                                className="flex items-center justify-center gap-2"
                              >
                                <Key className="h-4 w-4" />
                                노트
                              </TabsTrigger>
                              <TabsTrigger
                                value="group"
                                className="flex items-center justify-center gap-2"
                              >
                                <Users className="h-4 w-4" />
                                그룹
                              </TabsTrigger>
                            </TabsList>

                            <AnimatePresence mode="wait">
                              <TabsContent value="key" className="space-y-4">
                                <motion.div
                                  className="bg-[#f0faf7] p-4 rounded-lg"
                                  variants={itemVariants}
                                >
                                  <Input
                                    type="email"
                                    placeholder="이메일"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="border-[#c5e9de] focus:border-[#61C9A8] focus:ring-[#61C9A8]"
                                  />
                                  <p className="text-xs text-gray-500 mt-2">
                                    이메일을 입력하지 않으면 백업 키를 받을 수
                                    없어요!
                                  </p>
                                </motion.div>

                                <motion.div variants={itemVariants}>
                                  <Button
                                    className="w-full h-11 bg-[#61C9A8] hover:bg-[#4db596]"
                                    onClick={(e) => {
                                      // e.preventDefault();
                                      // setShowKey(true)
                                      handleSignup;
                                    }}
                                  >
                                    <Key className="h-4 w-4 mr-2" />새 키 만들기
                                  </Button>
                                </motion.div>
                              </TabsContent>

                              <TabsContent value="group" className="space-y-4">
                                <motion.div variants={itemVariants}>
                                  <Button
                                    onClick={(e) => {
                                      // e.preventDefault();
                                      // setShowKey(true)
                                      handleCreateGroup;
                                    }}
                                    className="w-full h-11 bg-[#61C9A8] hover:bg-[#4db596]"
                                  >
                                    <Users className="h-4 w-4 mr-2" />새 그룹
                                    만들기
                                  </Button>
                                </motion.div>
                              </TabsContent>
                            </AnimatePresence>
                          </Tabs>

                          <AnimatePresence mode="wait">
                            {userKey && showKey && (
                              <motion.div
                                className="mt-6 pt-4 border-t"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <div className="flex items-center mb-3">
                                  <Key
                                    size={18}
                                    className="mr-2 text-[#61C9A8]"
                                  />
                                  <h3 className="text-md font-medium text-[#61C9A8]">
                                    노트 키
                                  </h3>
                                </div>

                                <motion.div
                                  className="flex"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.1 }}
                                >
                                  <div className="flex-grow relative">
                                    <Input
                                      readOnly
                                      value={formattedKey}
                                      className="font-mono text-center tracking-wide border-[#c5e9de]"
                                    />
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="ml-2 border-[#c5e9de] hover:bg-[#f0faf7] hover:border-[#61C9A8]"
                                    onClick={copyToClipboard}
                                  >
                                    <Copy
                                      size={16}
                                      className="text-[#61C9A8]"
                                    />
                                  </Button>
                                </motion.div>

                                <AnimatePresence mode="wait">
                                  {copiedKey && (
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
                                  키를 잃어버리면 데이터에 접근할 수 없습니다.
                                  안전하게 보관하세요.
                                </motion.p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </form>

                        <motion.div
                          className="relative my-4"
                          variants={itemVariants}
                        >
                          <Separator />
                          <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-sm text-gray-500">
                            또는
                          </span>
                        </motion.div>

                        <motion.div
                          className="space-y-2"
                          variants={staggerChildren}
                        >
                          <SocialLoginButton
                            provider="github"
                            icon="/icons/github.svg"
                            color="#24292e"
                            label="GitHub로 노트 만들기"
                          />
                          <SocialLoginButton
                            provider="google"
                            icon="/icons/google.svg"
                            color="#DB4437"
                            label="Google로 노트 만들기"
                          />
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Tabs>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-center gap-2 mt-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <AlertCircle size={16} />
                    <span className="text-sm">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Right Lottie animation section */}
      <motion.div
        className="w-full lg:w-1/2 pl-16 flex items-center justify-center lg:justify-start p-8 order-first lg:order-last bg-gradient-to-b lg:bg-gradient-to-r from-white to-[#e6f7f2]"
        // 최초 로드 시에만 애니메이션 적용
        initial={!initialAnimationComplete ? { opacity: 0, x: 20 } : false}
        animate={!initialAnimationComplete ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div className="w-full max-w-md">
          <motion.div
            className="w-full md:w-4/5 mx-auto"
            // 최초 로드 시에만 애니메이션 적용
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
            // 최초 로드 시에만 애니메이션 적용
            initial={!initialAnimationComplete ? { opacity: 0, y: 20 } : false}
            animate={!initialAnimationComplete ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <motion.h2
              className="text-xl md:text-2xl font-bold text-[#61C9A8]"
              // 최초 로드 시에만 애니메이션 적용
              initial={!initialAnimationComplete ? { opacity: 0 } : false}
              animate={!initialAnimationComplete ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              안전하게 기록하세요
            </motion.h2>
            <motion.p
              className="text-gray-600 mt-2 max-w-sm mx-auto flex flex-row items-center"
              // 최초 로드 시에만 애니메이션 적용
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
    </div>
  );
};

export default Login;
