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

// Liquid Glass Style Custom Tooltip
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
    <div
      {...tooltipProps}
      className="relative max-w-sm rounded-xl border border-white/20 bg-background/80 p-5 shadow-2xl backdrop-blur-md supports-[backdrop-filter]:bg-background/60 dark:bg-black/60 dark:border-white/10"
    >
      {step.title && (
        <h4 className="mb-3 text-lg font-bold leading-none tracking-tight text-blue-600 dark:text-blue-400">
          {step.title}
        </h4>
      )}
      <div className="mb-6 text-[15px] leading-relaxed font-medium text-foreground/90">
        {step.content}
      </div>
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          {...skipProps}
          className="text-muted-foreground hover:text-foreground"
        >
          건너뛰기
        </Button>
        <div className="flex gap-2">
          {index > 0 && (
            <Button variant="outline" size="sm" {...backProps}>
              이전
            </Button>
          )}
          <Button variant="default" size="sm" {...primaryProps}>
            {isLastStep ? '완료' : '다음'}
          </Button>
        </div>
      </div>
    </div>
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
