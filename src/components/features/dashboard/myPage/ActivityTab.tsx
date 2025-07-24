import React, { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  FileText,
  Bell,
  Calendar,
  Tag,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';
import { StatItem } from '@/components/features/dashboard/myPage/StatItem';
import { ActivityData } from '@/types/index';
import { useNotes } from '@/hooks/useNotes';
import { CustomProgress } from '@/components/features/dashboard/myPage/CustomProgress';

interface ActivityTabProps {
  stats: {
    totalNotes: number;
    totalReminders: number;
    completedReminders: number;
    completionRate: number;
    tagsUsed: number;
  };
  activityData: ActivityData[];
}

export const ActivityTab: React.FC<ActivityTabProps> = React.memo(({
  stats,
  activityData,
}) => {
  const { goalStats } = useNotes();

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

    const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];
    const weeklyGroupedData: ActivityData[][] = Array.from({ length: 7 }, () => []);
    const firstDate = activityData[0] ? new Date(activityData[0].date) : new Date();
    const daysToPad = firstDate.getDay();

    for (let i = 0; i < daysToPad; i++) {
      weeklyGroupedData[i].push({ date: '', count: 0, level: 0 });
    }

    activityData.forEach((day) => {
      const dayOfWeek = new Date(day.date).getDay();
      weeklyGroupedData[dayOfWeek].push(day);
    });

    const maxWeeks = Math.max(...weeklyGroupedData.map((week) => week.length));

    weeklyGroupedData.forEach(week => {
      while (week.length < maxWeeks) {
        week.push({ date: '', count: 0, level: 0 });
      }
    });

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>지난 1년간 {stats.completedReminders}개의 리마인더 완료</span>
          <div className="flex items-center gap-1 text-xs">
            적음{' '}
            {[0, 1, 2, 3, 4].map((level) => (
              <div key={level} className={`w-2.5 h-2.5 rounded-sm ${getLevelColor(level)}`} />
            ))}{' '}
            많음
          </div>
        </div>
        <div className="overflow-x-auto pb-2 custom-scrollbar">
          <div className="flex">
            <div className="flex flex-col gap-1 pr-2 text-xs text-muted-foreground pt-1">
              {dayLabels.map((label, index) => (
                <span key={index} className="h-3.5 flex items-center">
                  {[0, 2, 4, 6].includes(index) ? label : ''}
                </span>
              ))}
            </div>
            <div className="flex flex-grow overflow-x-auto gap-1">
              {Array.from({ length: maxWeeks }).map((_, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {weeklyGroupedData.map((dayRow, dayIndex) => {
                    const day = dayRow[weekIndex];
                    return day?.date ? (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className={`w-3.5 h-3.5 rounded-sm ${getLevelColor(day.level)} hover:ring-2 hover:ring-primary cursor-pointer transition-all duration-100`}
                        title={`${day.date}: ${day.count}개 완료`}
                      />
                    ) : (
                      <div key={`${weekIndex}-${dayIndex}`} className="w-3.5 h-3.5 rounded-sm bg-transparent" />
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
        <CardHeader><CardTitle className="flex items-center"><Calendar className="h-5 w-5 mr-2" />활동 히트맵</CardTitle></CardHeader>
        <CardContent className="custom-scrollbar">{renderActivityHeatmap()}</CardContent>
      </Card>

      <Card className="transition-all duration-300 hover:shadow-lg hover:border-primary/20">
        <CardHeader><CardTitle className="flex items-center"><TrendingUp className="h-5 w-5 mr-2" />상세 통계</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatItem icon={<FileText className="h-7 w-7" />} value={stats.totalNotes} label="총 노트" color="text-blue-500" />
            <StatItem icon={<Bell className="h-7 w-7" />} value={stats.totalReminders} label="총 리마인더" color="text-yellow-500" />
            <StatItem icon={<CheckCircle className="h-7 w-7" />} value={stats.completedReminders} label="완료된 리마인더" color="text-green-500" />
            <StatItem icon={<Tag className="h-7 w-7" />} value={stats.tagsUsed} label="사용된 태그" color="text-orange-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="transition-all duration-300 hover:shadow-lg hover:border-primary/20">
        <CardHeader><CardTitle>목표 달성률 분석</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">주간 노트 작성</span>
                <span className="text-sm font-bold">{goalStats.weeklyNote.percentage}%<span className="text-muted-foreground ml-1">({goalStats.weeklyNote.current}/{goalStats.weeklyNote.goal})</span></span>
              </div>
              <CustomProgress value={goalStats.weeklyNote.percentage} />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">주간 리마인더 완료</span>
                <span className="text-sm font-bold">{goalStats.weeklyReminder.percentage}%<span className="text-muted-foreground ml-1">({goalStats.weeklyReminder.current}/{goalStats.weeklyReminder.goal})</span></span>
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