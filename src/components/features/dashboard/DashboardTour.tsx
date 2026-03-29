import React, { useEffect, useState } from 'react';
import Joyride, {
  CallBackProps,
  Step,
  STATUS,
  TooltipRenderProps,
} from 'react-joyride';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/stores/themeStore';
import { motion, AnimatePresence } from 'framer-motion';

// Premium Liquid Glass Style Custom Tooltip
const CustomTooltip = ({
  index,
  step,
  backProps,
  primaryProps,
  skipProps,
  tooltipProps,
  isLastStep,
}: TooltipRenderProps) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        {...tooltipProps}
        className="relative w-[340px] rounded-2xl border border-border/50 bg-background/95 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] ring-1 ring-border"
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none" />
        {step.title && (
          <h4 className="mb-3 text-[17px] font-bold leading-none tracking-tight text-primary">
            {step.title}
          </h4>
        )}
        <div className="mb-6 text-[14px] leading-relaxed text-foreground/80 font-medium">
          {step.content}
        </div>
        <div className="flex items-center justify-between gap-3 relative z-10">
          <Button
            variant="ghost"
            size="sm"
            {...skipProps}
            className="text-xs text-muted-foreground hover:bg-muted-foreground/10 h-8"
          >
            건너뛰기
          </Button>
          <div className="flex gap-2">
            {index > 0 && (
              <Button variant="outline" size="sm" className="h-8 text-xs bg-background/50 backdrop-blur-sm" {...backProps}>
                이전
              </Button>
            )}
            <Button variant="default" size="sm" className="h-8 text-xs shadow-md" {...primaryProps}>
              {isLastStep ? '시작하기' : '다음'}
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const DashboardTour: React.FC = () => {
  const { user, completeOnboarding } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (user && !user.user_metadata?.onboarding_completed) {
      const timer = setTimeout(() => {
        setRun(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      await completeOnboarding();
    }
  };

  const steps: Step[] = [
    {
      target: 'body',
      placement: 'center',
      title: '환영합니다! 👋',
      content: (
        <div>
          <p>
            Notia에 오신 것을 환영합니다.
            <br />
            더 강력해진 노트 경험을 위한 간단한 가이드를 시작할게요.
          </p>
        </div>
      ),
      disableBeacon: true,
    },
    {
      target: '#tour-sidebar-nav',
      title: '메인 네비게이션',
      content:
        '이곳에서 노트, 리마인더, 캘린더, 타임라인 등 핵심 기능으로 빠르게 이동할 수 있습니다.',
      placement: 'right',
    },
    {
      target: '#tour-create-note',
      title: '새 노트 작성',
      content: '언제든지 이 버튼을 눌러 새로운 아이디어를 기록하세요.',
      placement: 'bottom',
    },
    {
      target: 'body',
      placement: 'center',
      title: '노트를 연결하세요 🔗',
      content: (
        <div>
          <p>[[노트제목]] 형식으로 다른 노트를 링크할 수 있습니다.</p>
          <p className="mt-2 text-xs text-muted-foreground/80">
            에디터에서 /link 명령어를 사용하거나,<br/>
            직접 [[ 를 입력하면 자동완성이 나타납니다.
          </p>
        </div>
      ),
      disableBeacon: true,
    },
    {
      target: '#tour-user-profile',
      title: '계정 설정',
      content: '프로필 수정, 설정 변경, 로그아웃은 이곳에서 할 수 있습니다.',
      placement: 'bottom-end',
    },
    {
      target: '#tour-goal-progress',
      title: '목표 달성 현황',
      content: '설정한 목표의 진행 상황을 실시간으로 확인하고 동기를 얻으세요.',
      placement: 'top', // 스크롤 방지를 위해 위쪽으로 배치
    },
  ];

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      tooltipComponent={CustomTooltip}
      disableOverlayClose
      floaterProps={{
        disableAnimation: true,
      }}
      styles={{
        options: {
          zIndex: 10000,
          arrowColor: isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)',
        },
        spotlight: {
          borderRadius: '12px',
        },
      }}
    />
  );
};
