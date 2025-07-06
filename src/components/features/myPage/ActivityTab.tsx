import React, { useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FileText, Calendar, Tag, TrendingUp, CheckCircle } from 'lucide-react';
import { Reminder } from '@/types/index';
import { StatItem } from '@/components/ui/myPage/StatItem';
import { ActivityData } from '@/types/index';

import { useNotes } from '@/hooks/useNotes';
import { CustomProgress } from '@/components/ui/myPage/CustomProgress';

interface ActivityTabProps {
  stats: {
    totalNotes: number;
    totalReminders: number;
    completedReminders: number;
    completionRate: number;
    tagsUsed: number;
  };
  activityData: ActivityData[];
  reminders: Reminder[];
}

export const ActivityTab: React.FC<ActivityTabProps> = ({
  stats,
  activityData,
  reminders,
}) => {
  const { goalStats } = useNotes();

  const getLevelColor = useCallback((level: number) => {
    const colors = [
      'bg-muted', // Level 0: No activity
      'bg-green-200', // Level 1: Low activity
      'bg-green-300', // Level 2: Moderate activity
      'bg-green-400', // Level 3: High activity
      'bg-green-500', // Level 4: Very High activity
    ];
    return colors[level] || 'bg-muted';
  }, []);

  const renderActivityHeatmap = useCallback(() => {
    if (activityData.every((d) => d.count === 0)) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="mx-auto h-12 w-12" />
          <p className="mt-4">활동 기록이 없습니다.</p>
          <p>리마인더를 완료하여 활동 기록을 남겨보세요.</p>
        </div>
      );
    }

    // GitHub 스타일 히트맵을 위한 데이터 준비
    const START_DAY_OF_WEEK = 0; // 0: 일요일, 1: 월요일
    const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

    // 7개의 배열 (요일별)로 데이터를 재구성
    const weeklyGroupedData: ActivityData[][] = Array.from(
      { length: 7 },
      () => [],
    );

    // activityData는 이미 365일 (오래된 순)
    const firstDateInActivityData = activityData[0]
      ? new Date(activityData[0].date)
      : null;

    if (firstDateInActivityData) {
      const firstDayIndex = firstDateInActivityData.getDay(); // 0 (Sunday) to 6 (Saturday)
      // 첫 번째 주를 START_DAY_OF_WEEK에 맞춰 패딩
      const daysToPadAtBeginning = (firstDayIndex - START_DAY_OF_WEEK + 7) % 7;

      for (let i = 0; i < daysToPadAtBeginning; i++) {
        weeklyGroupedData[(START_DAY_OF_WEEK + i) % 7].push({
          date: '',
          count: 0,
          level: 0,
        });
      }
    }

    activityData.forEach((day) => {
      const dayOfWeek = new Date(day.date).getDay();
      weeklyGroupedData[dayOfWeek].push(day);
    });

    // 모든 요일별 배열의 길이가 같도록 (즉, 모든 열의 길이가 같도록) 패딩
    const maxWeeks = Math.max(...weeklyGroupedData.map((week) => week.length));

    for (let i = 0; i < 7; i++) {
      while (weeklyGroupedData[i].length < maxWeeks) {
        weeklyGroupedData[i].push({ date: '', count: 0, level: 0 });
      }
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>지난 1년간 {stats.completedReminders}개의 리마인더 완료</span>
          <div className="flex items-center gap-1 text-xs">
            적음{' '}
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`w-2.5 h-2.5 rounded-sm ${getLevelColor(level)}`}
              />
            ))}{' '}
            많음
          </div>
        </div>
        <div className="overflow-x-auto pb-2 custom-scrollbar">
          <div className="flex">
            {/* 요일 레이블 */}
            <div className="flex flex-col gap-1 pr-2 text-xs text-muted-foreground pt-1">
              {dayLabels.map((label, index) => (
                <span key={index} className="h-3.5 flex items-center">
                  {/* 일, 수, 금만 표시하여 공간 절약 */}
                  {index === 0 || index === 2 || index === 4 || index === 6
                    ? label
                    : ''}
                </span>
              ))}
            </div>

            {/* 히트맵 그리드 */}
            <div className="flex flex-grow overflow-x-auto gap-1">
              {Array.from({ length: maxWeeks }).map((_, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {weeklyGroupedData.map((dayRow, dayIndex) => {
                    const day = dayRow[weekIndex];
                    return day?.date ? (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className={`w-3.5 h-3.5 rounded-sm ${getLevelColor(
                          day.level,
                        )} hover:ring-2 hover:ring-primary cursor-pointer transition-all duration-100`}
                        title={`${day.date}: ${day.count}개 완료`}
                      />
                    ) : (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className="w-3.5 h-3.5 rounded-sm bg-transparent"
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }, [activityData, stats.completedReminders, getLevelColor]);

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
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatItem
              icon={<FileText className="h-5 w-5" />}
              value={stats.totalNotes}
              label="총 노트"
            />
            <StatItem
              icon={<Calendar className="h-5 w-5" />}
              value={stats.totalReminders}
              label="총 리마인더"
            />
            <StatItem
              icon={<CheckCircle className="h-5 w-5" />}
              value={stats.completedReminders}
              label="완료된 리마인더"
            />
            <StatItem
              icon={<Tag className="h-5 w-5" />}
              value={stats.tagsUsed}
              label="사용된 태그"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="transition-all duration-300 hover:shadow-lg hover:border-primary/20">
        <CardHeader>
          <CardTitle>목표 달성률 분석</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 주간 노트 작성 목표 */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">주간 노트 작성</span>
                <span className="text-sm font-bold">
                  {goalStats.weeklyNote.percentage}%
                  <span className="text-muted-foreground ml-1">
                    ({goalStats.weeklyNote.current}/{goalStats.weeklyNote.goal})
                  </span>
                </span>
              </div>
              <CustomProgress value={goalStats.weeklyNote.percentage} />
            </div>

            {/* 주간 리마인더 완료 목표 */}
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
};
