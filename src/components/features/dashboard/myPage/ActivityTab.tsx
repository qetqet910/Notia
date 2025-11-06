import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Bell from 'lucide-react/dist/esm/icons/bell';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Tag from 'lucide-react/dist/esm/icons/tag';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import { StatItem } from '@/components/features/dashboard/myPage/StatItem';
import { useNotes } from '@/hooks/useNotes';
import { CustomProgress } from '@/components/features/dashboard/myPage/CustomProgress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ActivityData } from '@/types/index';

interface CalculationResult {
  stats: {
    totalNotes: number;
    totalReminders: number;
    completedReminders: number;
    completionRate: number;
    tagsUsed: number;
  };
  activityData: ActivityData[];
}

export const ActivityTab: React.FC = React.memo(() => {
  const { notes, goalStats } = useNotes();
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationResult, setCalculationResult] =
    useState<CalculationResult | null>(null);

  useEffect(() => {
    setIsCalculating(true);
    const worker = new Worker(
      new URL('@/workers/activityCalculator.worker.ts', import.meta.url),
      { type: 'module' },
    );

    worker.onmessage = (event: MessageEvent<CalculationResult>) => {
      setCalculationResult(event.data);
      setIsCalculating(false);
    };

    worker.onerror = (error) => {
      console.error('Worker error:', error);
      setIsCalculating(false);
    };

    worker.postMessage(notes);

    return () => {
      worker.terminate();
    };
  }, [notes]);

  const { stats, activityData } = useMemo(() => {
    if (!calculationResult) {
      return {
        stats: {
          totalNotes: 0,
          totalReminders: 0,
          completedReminders: 0,
          completionRate: 0,
          tagsUsed: 0,
        },
        activityData: [],
      };
    }
    return calculationResult;
  }, [calculationResult]);

  const getLevelColor = useCallback((level: number) => {
    const colors = [
      'bg-muted',
      'bg-green-200',
      'bg-green-300',
      'bg-green-400',
      'bg-green-500',
    ];
    return colors[level] || 'bg-muted';
  }, []);

  const firstActivity = useMemo(
    () => activityData.find((d) => d.count > 0),
    [activityData],
  );

const weeks = useMemo(() => {
  if (!firstActivity) return [];

  // 1. 활동 데이터를 Map으로 변환
  const allDays = new Map<string, { count: number; level: number }>();
  activityData.forEach((d) => {
    allDays.set(d.date, { count: d.count, level: d.level });
  });

  // 2. 시작일과 종료일 설정
  const startDate = new Date(firstActivity.date + 'T00:00:00Z');
  const endDate = new Date(startDate);
  endDate.setUTCMonth(startDate.getUTCMonth() + 6);

  // 3. 주의 시작일 (일요일) 계산
  const weekStartDate = new Date(startDate);
  weekStartDate.setUTCDate(startDate.getUTCDate() - startDate.getUTCDay());

  // 4. 총 주 수 계산
  const totalDays = Math.ceil(
    (endDate.getTime() - weekStartDate.getTime()) / (1000 * 3600 * 24),
  );
  const totalWeeks = Math.ceil(totalDays / 7);

  // 5. Helper 함수: 오프셋으로 날짜 생성
  const getDateByOffset = (offsetDays: number): Date => {
    const date = new Date(weekStartDate);
    date.setUTCDate(weekStartDate.getUTCDate() + offsetDays);
    return date;
  };

  // 6. Helper 함수: Date를 YYYY-MM-DD 문자열로 변환
  const formatDate = (date: Date): string => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 7. 주별 데이터 생성
  const generatedWeeks: { date: string; count: number; level: number }[][] = [];

  for (let weekIndex = 0; weekIndex < totalWeeks; weekIndex++) {
    const week: { date: string; count: number; level: number }[] = [];

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const currentDay = getDateByOffset(weekIndex * 7 + dayIndex);
      const dateStr = formatDate(currentDay);

      // 범위 내 날짜인지 확인
      if (currentDay >= startDate && currentDay <= endDate) {
        const data = allDays.get(dateStr) || { count: 0, level: 0 };
        week.push({ date: dateStr, ...data });
      } else {
        // 범위 밖의 placeholder
        week.push({ date: dateStr, count: -1, level: -1 });
      }
    }

    generatedWeeks.push(week);
  }

  return generatedWeeks;
}, [activityData, firstActivity]);

  const monthLabels = useMemo(() => {
    if (!weeks.length) return [];
    const labels: { weekIndex: number; name: string }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, weekIndex) => {
      const firstDayOfWeek = new Date(week[0].date + 'T00:00:00Z');
      const month = firstDayOfWeek.getUTCMonth();
      if (month !== lastMonth) {
        const containsFirstDay = week.some(
          (day) => new Date(day.date + 'T00:00:00Z').getUTCDate() === 1,
        );
        if (containsFirstDay || weekIndex === 0) {
          labels.push({
            weekIndex,
            name: new Intl.DateTimeFormat('ko-KR', {
              month: 'short',
              timeZone: 'UTC',
            }).format(firstDayOfWeek),
          });
          lastMonth = month;
        }
      }
    });
    return labels;
  }, [weeks]);

  const renderActivityHeatmap = () => {
    if (isCalculating) {
      return (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-32 w-full" />
        </div>
      );
    }

    if (!firstActivity) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="mx-auto h-12 w-12" />
          <p className="mt-4">활동 기록이 없습니다.</p>
          <p>리마인더를 완료하여 활동 기록을 남겨보세요.</p>
        </div>
      );
    }

    return (
      <TooltipProvider delayDuration={100}>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              지난 6개월간 {stats.completedReminders}개의 리마인더 완료
            </span>
            <div className="flex items-center gap-1 text-xs">
              적음{' '}
              {[0, 1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`w-2.5 h-2.5 rounded-sm ${getLevelColor(
                    level,
                  )} border border-black/10`}
                />
              ))}{' '}
              많음
            </div>
          </div>
          <div className="overflow-x-auto pb-2 custom-scrollbar">
            <div className="inline-flex flex-col">
              <div className="flex gap-1.5" style={{ paddingLeft: '2rem' }}>
                {weeks.map((_, weekIndex) => (
                  <div
                    key={weekIndex}
                    className="w-5 text-xs text-muted-foreground text-center"
                  >
                    {monthLabels.find((m) => m.weekIndex === weekIndex)?.name}
                  </div>
                ))}
              </div>
              <div className="flex">
                <div className="flex flex-col gap-1.5 pr-2 text-xs text-muted-foreground pt-1">
                  {['일', '', '수', '', '금', ''].map((label, index) => (
                    <span key={index} className="h-5 flex items-center">
                      {label}
                    </span>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-1.5">
                      {week.map((day, dayIndex) => {
                        if (day.count === -1) {
                          return <div key={dayIndex} className="w-5 h-5" />;
                        }
                        return (
                          <Tooltip key={dayIndex}>
                            <TooltipTrigger asChild>
                              <div
                                className={`w-5 h-5 rounded-sm border border-black/10 ${getLevelColor(
                                  day.level,
                                )} cursor-pointer`}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{`${day.date}: ${day.count}개 완료`}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </TooltipProvider>
    );
  };

  const renderStats = () => {
    if (isCalculating) {
      return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      );
    }
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatItem
          icon={<FileText className="h-7 w-7" />}
          value={stats.totalNotes}
          label="총 노트"
          color="text-blue-500"
        />
        <StatItem
          icon={<Bell className="h-7 w-7" />}
          value={stats.totalReminders}
          label="총 리마인더"
          color="text-yellow-500"
        />
        <StatItem
          icon={<CheckCircle className="h-7 w-7" />}
          value={stats.completedReminders}
          label="완료된 리마인더"
          color="text-green-500"
        />
        <StatItem
          icon={<Tag className="h-7 w-7" />}
          value={stats.tagsUsed}
          label="사용된 태그"
          color="text-orange-500"
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="transition-all duration-300 hover:shadow-lg hover:border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            활동 히트맵
          </CardTitle>
        </CardHeader>
        <CardContent className="custom-scrollbar">
          {renderActivityHeatmap()}
        </CardContent>
      </Card>

      <Card className="transition-all duration-300 hover:shadow-lg hover:border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            상세 통계
          </CardTitle>
        </CardHeader>
        <CardContent>{renderStats()}</CardContent>
      </Card>

      <Card className="transition-all duration-300 hover:shadow-lg hover:border-primary/20">
        <CardHeader>
          <CardTitle>목표 달성률 분석</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">주간 노트 작성</span>
                <span className="text-sm font-bold">
                  {goalStats.weeklyNote.percentage}%
                  <span className="text-muted-foreground ml-1">
                    ({goalStats.weeklyNote.current}/
                    {goalStats.weeklyNote.goal})
                  </span>
                </span>
              </div>
              <CustomProgress value={goalStats.weeklyNote.percentage} />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">주간 리마인더 완료</span>
                <span className="text-sm font-bold">
                  {goalStats.weeklyReminder.percentage}%
                  <span className="text-muted-foreground ml-1">
                    ({goalStats.weeklyReminder.current}/
                    {goalStats.weeklyReminder.goal})
                  </span>
                </span>
              </div>
              <CustomProgress value={goalStats.weeklyReminder.percentage} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
ActivityTab.displayName = 'ActivityTab';