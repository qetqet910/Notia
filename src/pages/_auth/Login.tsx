import type React from 'react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Key, AlertCircle, Loader2 } from 'lucide-react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/services/supabaseClient';

import { Toaster } from '@/components/ui/toaster';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { InputOTPControlled } from '@/components/features/inputOtpControl';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/stores/authStore';
import { KeyDisplay } from '@/components/features/keyDisplay';
import { MarkdownPreview } from '@/components/features/dashboard/MarkdownPreview';
import { useToast } from '@/hooks/useToast';
import { generateRandomKey, formatKey } from '@/utils/keyValidation';

import logoImage from '@/assets/images/Logo.png';

// 애니메이션 변수들
const animations = {
  card: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  },
  tabContent: {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: 'easeOut' },
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
};

// 소셜 로그인 버튼 컴포넌트
const SocialLoginButton: React.FC<{
  provider: 'github' | 'google';
  icon: string;
  color: string;
  label: string;
  onClick: (provider: 'github' | 'google') => void;
  disabled: boolean;
  animate: boolean;
  keyPrefix: string;
}> = ({
  provider,
  icon,
  color,
  label,
  onClick,
  disabled,
  animate,
  keyPrefix,
}) => (
  <motion.div
    key={`${keyPrefix}-${provider}`}
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
      <img
        src={icon || '/placeholder.svg'}
        alt={provider}
        className="w-5 h-5"
      />
      <span>{label}</span>
    </Button>
  </motion.div>
);

// 에러 메시지 컴포넌트
const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <motion.div
    key="error-message"
    className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-center gap-2 mt-4"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 10 }}
    transition={{ duration: 0.3 }}
  >
    <AlertCircle size={16} />
    <span className="text-sm">{message}</span>
  </motion.div>
);

// 로그인 컴포넌트
export const Login: React.FC = () => {
  // Zustand 스토어 사용
  const {
    isAuthenticated,
    formattedKey,
    isRegisterLoading,
    isLoginLoading,
    loginWithSocial,
    createAnonymousUserWithEdgeFunction,
    createEmailUserWithEdgeFunction,
  } = useAuthStore();

  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [activeAuthTab, setActiveAuthTab] = useState('key');
  const [signupTab, setSignupTab] = useState('key');
  const [initialAnimationComplete, setInitialAnimationComplete] =
    useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // 임시 약관 내용 (실제 서비스에서는 법률 자문을 받아 작성해야 합니다.)
  const termsOfServiceContent = `
## 서비스 이용 약관

**제1조 (목적)**
본 약관은 Notia 서비스(이하 “서비스”)의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임 사항 및 서비스 이용에 필요한 기타 사항을 정함을 목적으로 합니다.

**제2조 (정의)**
1. “회사”란 Notia 서비스를 제공하는 주체를 의미합니다.
2. “회원”이란 본 약관에 동의하고 회사가 제공하는 서비스를 이용하는 자를 말합니다.
3. “콘텐츠”란 회원이 서비스에 작성·업로드한 텍스트, 이미지, 파일, 기타 자료 일체를 의미합니다.

**제3조 (약관의 효력 및 변경)**
1. 본 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.
2. 회사는 관련 법령을 위반하지 않는 범위에서 약관을 개정할 수 있으며, 개정 약관은 최소 7일 전(중대한 변경 시 30일 전)부터 서비스 내 공지를 통해 고지됩니다.
3. 회원은 변경된 약관에 동의하지 않을 경우 이용계약을 해지할 수 있으며, 계속 이용 시 변경된 약관에 동의한 것으로 간주됩니다.

**제4조 (서비스의 제공 및 변경)**
1. 회사는 연중무휴, 1일 24시간 서비스를 제공함을 원칙으로 합니다.
2. 회사는 서비스의 내용, 운영, 기술상 필요에 따라 서비스 전부 또는 일부를 변경하거나 종료할 수 있습니다.
3. 서비스 변경 시 회사는 회원에게 사전 공지하며, 불가피한 경우 사후 공지할 수 있습니다.

**제5조 (회원가입 및 개인정보 보호)**
1. 회원가입은 회원이 본 약관 및 개인정보 처리방침에 동의하고 회사가 정한 절차에 따라 가입을 신청함으로써 성립됩니다.
2. 회사는 관련 법령에 따라 회원의 개인정보를 보호하며, 개인정보의 수집·이용·보유 및 파기 등은 개인정보 처리방침에 따릅니다.
3. 회원은 개인정보 처리방침에 따라 개인정보 수집·이용에 동의하여야 서비스를 정상 이용할 수 있습니다.

**제6조 (회원의 의무)**
1. 회원은 본인의 계정과 비밀번호에 대한 관리책임을 부담하며, 이를 제3자에게 제공·양도할 수 없습니다.
2. 회원은 다음 행위를 하여서는 안 됩니다.
  a. 타인의 개인정보 도용 또는 부정 사용
  b. 회사 또는 제3자의 지적재산권 침해
  c. 서비스의 정상적 운영을 방해하는 행위
  c. 법령 또는 공서양속에 위반되는 행위

**제7조 (지식재산권)**
1. 회원이 서비스에 작성 또는 업로드한 콘텐츠에 대한 권리는 해당 회원에게 귀속됩니다.
2. 단, 회사는 서비스 제공, 개선, 홍보 목적으로 해당 콘텐츠를 비상업적 범위 내에서 사용할 수 있습니다.
3. 회사는 회원의 동의 없이 콘텐츠를 외부에 공개하거나 상업적으로 이용하지 않습니다.

**제8조 (계약 해지 및 서비스 이용제한)**
1. 회원은 언제든지 서비스 이용계약을 해지할 수 있습니다.
2. 회사는 회원이 본 약관을 위반한 경우, 사전 통지 후 서비스 이용을 일시 중지하거나 계약을 해지할 수 있습니다.
3. 위반행위가 중대한 경우 사전 통지 없이 조치할 수 있으며, 이에 따른 법적 책임은 회원에게 있습니다.

**제9조 (면책 및 책임의 제한)**
1. 회사는 다음의 경우에 대해 책임을 지지 않습니다.
  a. 천재지변, 해킹, 시스템 장애 등 불가항력적 사유
  b. 회원의 귀책으로 인한 서비스 이용 장애
  c. 회원 간 또는 회원과 제3자 간의 분쟁

2. 회사는 서비스 제공과 관련하여 무료로 제공되는 정보 및 자료에 대해 법적 책임을 부담하지 않습니다.

제10조 (손해배상)
회사는 본 약관을 위반하여 발생한 회원의 손해에 대해 고의 또는 중과실이 없는 한 책임을 지지 않으며, 회원도 본인의 귀책으로 인해 회사 또는 제3자에게 손해를 입힌 경우 그 손해를 배상해야 합니다.

제11조 (준거법 및 재판관할)
본 약관은 대한민국 법률을 준거법으로 하며, 서비스 이용과 관련된 분쟁에 대하여는 회사의 본사 소재지를 관할하는 법원을 제1심 전속관할 법원으로 합니다.

**부칙**
본 약관은 2025년 7월 20일부터 적용됩니다.
  `;

  const privacyPolicyContent = `
## 개인정보 처리방침

Notia 서비스(이하 "서비스")는 이용자의 개인정보를 중요하게 여기며, 「개인정보 보호법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 준수합니다. 본 방침은 서비스 이용자가 제공한 개인정보가 어떠한 방식으로 수집, 이용, 보호되는지를 설명합니다.

제1조 (개인정보의 수집 및 이용 목적)
회사는 다음의 목적을 위해 개인정보를 수집하고 이용합니다.
1. 회원 가입 및 관리: 본인확인, 이용자 식별, 계정 관리, 고지사항 전달 등
2. 서비스 제공: 노트 저장, 리마인더 기능 제공, 맞춤형 콘텐츠 제공 등
3. 마케팅 및 광고 활용: 서비스 개선, 이벤트 정보 제공, 통계 분석

제2조 (수집하는 개인정보 항목)
1. 필수 항목:
   - 이메일 주소, OAuth 제공자 고유 ID, IP 주소
2. 자동 수집 항목:
   - 서비스 이용 기록, 접속 로그, 접속 IP

제3조 (개인정보 보유 및 이용 기간)
회사는 개인정보 수집 및 이용 목적 달성 시 지체 없이 파기합니다. 단, 관련 법령에 따른 보존 필요 시 다음과 같이 보관합니다.
- 부정이용 기록: 1년 (회사 내부 방침)
- 계약, 대금결제 및 소비자 분쟁처리 관련 기록: 3~5년 (전자상거래법 등 관련 법령에 따름)

제4조 (개인정보 파기절차 및 방법)
회사는 목적 달성 후 별도 DB 또는 서류함에 안전하게 저장 후 법정 보관기한 경과 시 지체 없이 파기합니다. 전자 파일은 복구 불가능한 기술적 방법으로, 종이 문서는 분쇄기로 파기합니다.

제5조 (개인정보 제3자 제공)
회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않으며, 아래 경우에 한하여 예외적으로 제공합니다.
1. 이용자 동의 시
2. 법령에 근거한 수사기관 등의 요청이 있는 경우

제6조 (개인정보 처리 위탁)
회사는 서비스 운영을 위해 아래 업무를 위탁합니다.
- 수탁자: Supabase
- 위탁업무: 데이터 저장, 인증 처리, 사용자 계정 관리
회사는 위탁계약 체결 시 관련 법령에 따라 개인정보 보호 조치를 명확히 규정하고 있습니다.

제7조 (이용자의 권리와 행사 방법)
이용자는 언제든지 자신의 개인정보 열람, 수정, 삭제, 처리 정지를 요청할 수 있습니다. 관련 요청은 마이페이지 또는 고객센터를 통해 본인확인 후 가능합니다. 또한 서면, 전화, 이메일로도 권리를 행사할 수 있습니다.

제8조 (개인정보 보호책임자)
회사는 개인정보 보호를 위한 책임자를 지정하고, 관련 민원처리 및 피해 구제를 지원합니다.
- 책임자명: [김현민]
- 이메일: [haemmin48@gmail.com]

부칙
본 방침은 2025년 07월 20일부터 시행됩니다.
  `;

  // 인증 상태 변경 시 리디렉션
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // 애니메이션 완료 타이머
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialAnimationComplete(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // 세션 체크
  useEffect(() => {
    useAuthStore.getState().checkSession();
  }, []);

  // 키 복사 핸들러
  // 키 복사 핸들러 - 하이픈 제거 버전
  const copyToClipboard = async (text: string) => {
    try {
      // 하이픈 제거
      const cleanText = text.replace(/-/g, '');

      // 클립보드에 복사
      await navigator.clipboard.writeText(cleanText);
      setCopiedKey(true);

      toast({
        title: '클립보드에 복사됨',
        description: '하이픈이 제거된 키가 클립보드에 복사되었습니다.',
      });

      setTimeout(() => setCopiedKey(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('클립보드 복사 오류:', err);
      toast({
        title: '클립보드 복사 오류',
        description: '클립보드에 복사하는 데 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleCreateEmailKey = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formattedKey && showKey) {
      toast({
        title: '이미 키가 생성되어 있습니다',
        description: '생성된 키를 복사해서 사용하세요.',
      });
      return;
    }

    if (!email || !email.includes('@')) {
      toast({
        title: '유효하지 않은 이메일',
        description: '올바른 이메일 주소를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // 키 미리 생성 (하지만 아직 표시하지 않음)
      const key = generateRandomKey(16);
      const formattedKeyValue = formatKey(key);
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipResponse.json();
      // Edge Function으로 이메일 키 생성 요청
      const result = await createEmailUserWithEdgeFunction(
        email,
        formattedKeyValue,
        ip,
      );

      // 성공일 경우에만 키 저장 및 표시
      if (result.success) {
        // 상태 업데이트
        useAuthStore.setState({
          userKey: key,
          formattedKey: formattedKeyValue,
          // userEmail: email,
        });

        setShowKey(true);

        toast({
          title: '키 생성 성공',
          description: '생성된 키를 복사하여 로그인 탭에서 사용하세요.',
        });
        await supabase.from('creation_attempts').insert({ client_ip: ip });
      } else {
        // 에러 코드에 따른 처리
        let errorMessage = result.error || '알 수 없는 오류가 발생했습니다.';
        let toastVariant: 'default' | 'destructive' = 'destructive';

        // 특정 에러 코드별 메시지 처리
        if (result.code === 'EMAIL_EXISTS') {
          errorMessage = '이미 등록된 이메일입니다. 다른 이메일을 사용하세요.';
        } else if (result.code === 'INVALID_PASSWORD') {
          errorMessage =
            '생성된 키가 보안 요구사항을 충족하지 않습니다. 다시 시도해주세요.';
        }

        toast({
          title: '키 생성 실패',
          description: errorMessage,
          variant: toastVariant,
        });

        setEmail('');
      }
    } catch (err) {
      console.error('이메일 키 생성 오류:', err);

      toast({
        title: '키 생성 오류',
        description:
          '서버 연결 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
        variant: 'destructive',
      });
      setEmail('');
    }
  };

  // 소셜 로그인 핸들러
  const handleSocialLogin = async (provider: 'github' | 'google') => {
    await loginWithSocial(provider);
  };

  // 익명 키 생성 핸들러
  const handleCreateAnonymousKey = async (e: React.FormEvent) => {
    e.preventDefault();

    // 이미 로딩 중이거나 키가 생성된 경우 중복 처리 방지
    if (isRegisterLoading) return;

    if (formattedKey && showKey) {
      toast({
        title: '이미 키가 생성되어 있습니다',
        description: '생성된 키를 복사해서 사용하세요.',
      });
      return;
    }

    try {
      setShowKey(false);

      // 키 생성 및 IP 가져오기 병렬 처리
      const key = generateRandomKey(16);
      const formattedKeyValue = formatKey(key);
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipResponse.json();

      const result = await createAnonymousUserWithEdgeFunction(
        formattedKeyValue,
        ip,
      );

      if (!result.success) {
        const errorMessage = result?.error || '알 수 없는 오류가 발생했습니다.';
        toast({
          title: '키 생성 실패',
          description: errorMessage,
          variant: 'destructive',
        });
        return;
      }

      // 성공 처리 로직
      console.log('익명 사용자 저장 결과:', result);

      useAuthStore.setState({
        userKey: key,
        formattedKey: formattedKeyValue,
      });

      setShowKey(true);

      toast({
        title: '키 생성 성공',
        description: '생성된 키를 복사하여 로그인 탭에서 사용하세요.',
      });

      // IP 기록 - 성공 후에만 수행
      await supabase.from('creation_attempts').insert({ client_ip: ip });
    } catch (err) {
      console.error('익명 사용자 저장 오류:', err);
      toast({
        title: '키 생성 오류',
        description:
          err instanceof Error
            ? err.message
            : '키 생성 중 오류가 발생했습니다. 다시 시도해주세요.',
        variant: 'destructive',
      });
    }
  };

  // 로그인 탭 렌더링
  const renderLoginTab = () => (
    <motion.div
      key="login-form-tab"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={animations.tabContent}
      className="space-y-4"
    >
      <form className="space-y-4 mb-6">
        <Tabs
          defaultValue="key"
          className="space-y-4"
          onValueChange={setActiveAuthTab}
        >
          <div className="min-h-[120px]">
            <motion.div
              key="key-login-tab"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={animations.tabContent}
              className="space-y-4"
            >
              <motion.div
                key="key-input"
                className="bg-[#f0faf7] p-4 rounded-lg"
                variants={animations.item}
              >
                <InputOTPControlled />
              </motion.div>
              <motion.div key="key-button" variants={animations.item}>
                <Button
                  type="submit"
                  className="w-full h-11 bg-[#61C9A8] hover:bg-[#4db596]"
                  disabled={isLoginLoading}
                >
                  {isLoginLoading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>처리 중...</span>
                    </div>
                  ) : (
                    '로그인'
                  )}
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </Tabs>
      </form>

      <motion.div
        key="login-separator"
        className="relative my-4"
        variants={animations.item}
      >
        <Separator />
        <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-sm text-gray-500">
          또는
        </span>
      </motion.div>

      <motion.div
        key="login-social"
        className="space-y-2"
        variants={animations.stagger}
      >
        <SocialLoginButton
          provider="github"
          icon="/icons/github.svg"
          color="#24292e"
          label="GitHub로 로그인"
          onClick={handleSocialLogin}
          disabled={isLoginLoading}
          animate={!initialAnimationComplete}
          keyPrefix="login"
        />
        <SocialLoginButton
          provider="google"
          icon="/icons/google.svg"
          color="#DB4437"
          label="Google로 로그인"
          onClick={handleSocialLogin}
          disabled={isLoginLoading}
          animate={!initialAnimationComplete}
          keyPrefix="login"
        />
      </motion.div>
    </motion.div>
  );

  // 회원가입 탭 렌더링
  const renderSignupTab = () => (
    <motion.div
      key="signup-form-tab"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={animations.tabContent}
      className="space-y-4"
    >
      <Tabs
        defaultValue="key"
        className="space-y-4"
        value={signupTab}
        onValueChange={setSignupTab}
      >
        <div key="key-signup-content">
          <div className="space-y-4">
            {/* 이메일 키 생성 폼 추가 */}
            <motion.div key="create-email-key-form" variants={animations.item}>
              <form onSubmit={handleCreateEmailKey} className="space-y-3">
                <div>
                  <Input
                    type="email"
                    placeholder="이메일 주소"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 border-[#c5e9de] focus:border-[#61C9A8] focus:ring-[#61C9A8]"
                    required
                    disabled={
                      isRegisterLoading || !termsAgreed || !privacyAgreed
                    }
                  />
                </div>
                {/* 약관 동의 체크박스 */}
                <div className="flex flex-col space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={termsAgreed}
                      onCheckedChange={(checked) => setTermsAgreed(!!checked)}
                      disabled={isRegisterLoading}
                    />
                    <Label htmlFor="terms">
                      서비스 이용 약관 동의 (필수){' '}
                      <span
                        className="text-[#61C9A8] cursor-pointer hover:underline"
                        onClick={() => setShowTermsDialog(true)}
                      >
                        [보기]
                      </span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="privacy"
                      checked={privacyAgreed}
                      onCheckedChange={(checked) => setPrivacyAgreed(!!checked)}
                      disabled={isRegisterLoading}
                    />
                    <Label htmlFor="privacy">
                      개인정보 처리 방침 동의 (필수){' '}
                      <span
                        className="text-[#61C9A8] cursor-pointer hover:underline"
                        onClick={() => setShowPrivacyDialog(true)}
                      >
                        [보기]
                      </span>
                    </Label>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 bg-[#61C9A8] hover:bg-[#4db596]"
                  disabled={
                    isRegisterLoading ||
                    !email.trim() ||
                    !termsAgreed ||
                    !privacyAgreed
                  }
                >
                  {isRegisterLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      처리 중...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      이메일로 키 만들기
                    </>
                  )}
                </Button>
              </form>
            </motion.div>
            {/* 익명 키 생성 버튼 */}
            <motion.div
              key="create-anonymous-key-button"
              variants={animations.item}
            >
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 border-[#c5e9de] hover:bg-[#f0faf7] hover:border-[#61C9A8]"
                disabled={isRegisterLoading || !termsAgreed || !privacyAgreed}
                onClick={handleCreateAnonymousKey}
              >
                {isRegisterLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    처리 중...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    이메일 없이 키 만들기
                  </>
                )}
              </Button>
            </motion.div>

            {/* 키 표시 - showKey 상태에 따라 표시 */}
            {!!formattedKey && !!showKey && (
              <KeyDisplay
                formattedKey={formattedKey}
                onCopy={() => copyToClipboard(formattedKey)}
                copied={copiedKey}
                autoCopy={true} // 자동 복사 활성화
              />
            )}
          </div>
        </div>
      </Tabs>

      <motion.div
        key="signup-separator"
        className="relative my-4"
        variants={animations.item}
      >
        <Separator />
        <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-sm text-gray-500">
          또는
        </span>
      </motion.div>

      <motion.div
        key="signup-social"
        className="space-y-2"
        variants={animations.stagger}
      >
        <SocialLoginButton
          provider="github"
          icon="/icons/github.svg"
          color="#24292e"
          label="GitHub로 노트 만들기"
          onClick={handleSocialLogin}
          disabled={isRegisterLoading || !termsAgreed || !privacyAgreed}
          animate={!initialAnimationComplete}
          keyPrefix="signup"
        />
        <SocialLoginButton
          provider="google"
          icon="/icons/google.svg"
          color="#DB4437"
          label="Google로 노트 만들기"
          onClick={handleSocialLogin}
          disabled={isRegisterLoading || !termsAgreed || !privacyAgreed}
          animate={!initialAnimationComplete}
          keyPrefix="signup"
        />
      </motion.div>

      {/* 서비스 이용 약관 다이얼로그 */}
      <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>서비스 이용 약관</DialogTitle>
            <DialogDescription>
              Notia 서비스 이용을 위한 약관입니다.
            </DialogDescription>
          </DialogHeader>
          <MarkdownPreview content={termsOfServiceContent} />
        </DialogContent>
      </Dialog>

      {/* 개인정보 처리 방침 다이얼로그 */}
      <Dialog open={showPrivacyDialog} onOpenChange={setShowPrivacyDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>개인정보 처리 방침</DialogTitle>
            <DialogDescription>
              Notia 서비스의 개인정보 처리 방침입니다.
            </DialogDescription>
          </DialogHeader>
          <MarkdownPreview content={privacyPolicyContent} />
        </DialogContent>
      </Dialog>
    </motion.div>
  );

  // 애니메이션 섹션 렌더링
  const renderAnimationSection = () => (
    <motion.div
      className="w-full lg:w-1/2 flex items-center justify-center lg:justify-start p-8 order-first lg:order-last bg-gradient-to-b lg:bg-gradient-to-r from-white to-[#e6f7f2]"
      initial={!initialAnimationComplete ? { opacity: 0, x: 20 } : false}
      animate={!initialAnimationComplete ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      <div className="w-full max-w-md">
        <motion.div
          className="w-full h-full mx-auto"
          initial={!initialAnimationComplete ? { scale: 0.9 } : false}
          animate={!initialAnimationComplete ? { scale: 1 } : {}}
          transition={{
            duration: 0.8,
            type: 'spring',
            bounce: 0.3,
          }}
        >
          <DotLottieReact
            src="/loginAnimation.lottie"
            loop
            autoplay
            className="drop-shadow-xl w-full h-full transform scale-150"
          />
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
            순간을 기록하세요,
          </motion.h2>
          <motion.p
            className="text-gray-600 mt-2 max-w-sm mx-auto"
            initial={!initialAnimationComplete ? { opacity: 0 } : false}
            animate={!initialAnimationComplete ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            중요한 순간으로 내일을 만들어 드릴게요.
            <br />
            언제, 어디서나 기록하세요.
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  );

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gradient-to-br overflow-hidden from-white to-[#e6f7f2]">
      {/* 로그인 섹션 */}
      <Toaster />
      <div className="w-full lg:w-1/2 p-4 md:p-8 flex items-start lg:mt-32 lg:mb-16 justify-center lg:justify-end lg:pr-24">
        <motion.div
          initial={!initialAnimationComplete ? 'hidden' : false}
          animate={!initialAnimationComplete ? 'visible' : {}}
          variants={animations.card}
        >
          <Card className="relative w-full max-w-md shadow-lg border-[#d8f2ea] overflow-visible">
            <CardContent className="pt-8 pb-6">
              {/* 로고 */}
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
                <Link
                  to="/"
                  className="w-1/2 object-contain pointer flex justify-center"
                >
                  <img src={logoImage || '/placeholder.svg'} alt="로고" />
                </Link>
              </motion.div>

              {/* 탭 컨테이너 */}
              <Tabs
                defaultValue="login"
                className="space-y-4"
                onValueChange={setActiveTab}
              >
                <TabsList className="grid grid-cols-2 gap-4">
                  <TabsTrigger
                    value="login"
                    className={
                      activeTab === 'login' ? 'text-[#61C9A8] bg-[#e6f7f2]' : ''
                    }
                  >
                    로그인
                  </TabsTrigger>
                  <TabsTrigger
                    value="signup"
                    className={
                      activeTab === 'signup'
                        ? 'text-[#61C9A8] bg-[#e6f7f2]'
                        : ''
                    }
                  >
                    만들기
                  </TabsTrigger>
                </TabsList>

                {/* 탭 내용 */}
                <div
                  className="relative min-h-[280px]"
                  style={{ transformOrigin: 'top' }}
                >
                  {activeTab === 'login' ? renderLoginTab() : renderSignupTab()}
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* 애니메이션 섹션 */}
      {renderAnimationSection()}
    </div>
  );
};

export default Login;
