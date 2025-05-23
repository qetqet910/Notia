import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Bell,
  Calendar,
  Clock,
  AlertCircle,
  ChevronRight,
  CheckCircle2,
  CalendarClock,
} from 'lucide-react';
import { Note, Reminder } from '@/types';

interface ReminderViewProps {
  notes: Note[];
  onToggleReminder: (reminderId: string, enabled: boolean) => void;
  onMarkCompleted: (reminderId: string, completed: boolean) => void;
  onOpenNote: (noteId: string) => void;
}

// 날짜 유틸리티 함수들
const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

const isTomorrow = (date: Date): boolean => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
  );
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const startOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

const isWithinInterval = (
  date: Date,
  interval: { start: Date; end: Date },
): boolean => {
  return date >= interval.start && date <= interval.end;
};

const formatDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Seoul',
  };
  return new Intl.DateTimeFormat('ko-KR', options).format(date);
};

export const ReminderView: React.FC<ReminderViewProps> = ({
  notes,
  onToggleReminder,
  onMarkCompleted,
  onOpenNote,
}) => {
  const [activeFilter, setActiveFilter] = useState<
    'today' | 'tomorrow' | 'upcoming' | 'all'
  >('today');
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [reminderStates, setReminderStates] = useState<
    Record<string, { completed: boolean; enabled: boolean }>
  >({});
  const [globalNotifications, setGlobalNotifications] = useState(true);

  // 노트에서 리마인더 추출
  useEffect(() => {
    const extractedReminders: Reminder[] = [];
    const now = new Date();

    notes.forEach((note) => {
      const reminderRegex = /@([^@#\n]+?)\./g;
      const content = note.content || '';
      let match;
      let matchIndex = 0; // 각 노트 내에서 매치된 순서를 추적
      while ((match = reminderRegex.exec(content)) !== null) {
        const reminderText = match[0];
        const reminderValue = match[1];
        let reminderTime: Date | null = null;

        // 시간 파싱 로직
        if (reminderValue === '오늘') {
          reminderTime = new Date();
          reminderTime.setHours(9, 0, 0, 0); // 기본 시간 설정
        } else if (reminderValue === '내일') {
          reminderTime = addDays(new Date(), 1);
          reminderTime.setHours(9, 0, 0, 0);
        } else if (reminderValue === '모레') {
          reminderTime = addDays(new Date(), 2);
          reminderTime.setHours(9, 0, 0, 0);
        } else if (reminderValue.includes('시')) {
          const hourMatch = reminderValue.match(/(\d+)시/);
          if (hourMatch) {
            const hour = parseInt(hourMatch[1]);
            if (hour >= 0 && hour <= 23) {
              reminderTime = new Date();
              reminderTime.setHours(hour, 0, 0, 0);

              if (reminderTime < now) {
                reminderTime = addDays(reminderTime, 1);
              }
            }
          }
        } else if (reminderValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
          try {
            const [year, month, day] = reminderValue.split('-').map(Number);
            reminderTime = new Date(year, month - 1, day, 9, 0, 0, 0);
          } catch (e) {
            console.error('날짜 파싱 오류:', e);
          }
        }

        if (reminderTime) {
          // 고유한 ID 생성: 노트ID + 리마인더텍스트 + 시간 + 매치 인덱스
          const reminderId = `${
            note.id
          }-${reminderText}-${reminderTime.getTime()}-${matchIndex}`;
          matchIndex++; // 매치 인덱스 증가

          extractedReminders.push({
            id: reminderId,
            noteId: note.id,
            noteTitle: note.title,
            noteContent: content.substring(0, 100).replace(/<[^>]*>/g, ''),
            reminderText,
            reminderTime,
            completed: reminderStates[reminderId]?.completed || false,
            enabled: reminderStates[reminderId]?.enabled ?? true,
          });
        }
      }
    });

    extractedReminders.sort(
      (a, b) => a.reminderTime.getTime() - b.reminderTime.getTime(),
    );
    setReminders(extractedReminders);
  }, [notes, reminderStates]);

  // 필터링된 리마인더
  const filteredReminders = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = startOfDay(addDays(now, 1));

    return reminders.filter((reminder) => {
      if (reminder.completed) return false;
      // 완료처리 시 코드 부분

      const reminderDate = startOfDay(reminder.reminderTime);

      switch (activeFilter) {
        case 'today':
          return isWithinInterval(reminderDate, {
            start: today,
            end: endOfDay(today),
          });
        case 'tomorrow':
          return isWithinInterval(reminderDate, {
            start: tomorrow,
            end: endOfDay(tomorrow),
          });
        case 'upcoming':
          return reminderDate > tomorrow;
        case 'all':
        default:
          return true;
      }
    });
  }, [reminders, activeFilter]);

  // 시간대별 그룹화
  const groupedReminders = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = startOfDay(addDays(now, 1));

    const overdue: Reminder[] = [];
    const todayReminders: Reminder[] = [];
    const tomorrowReminders: Reminder[] = [];
    const upcomingReminders: Reminder[] = [];

    filteredReminders.forEach((reminder) => {
      const reminderDate = startOfDay(reminder.reminderTime);

      if (reminder.reminderTime < now && !isToday(reminder.reminderTime)) {
        overdue.push(reminder);
      } else if (
        isWithinInterval(reminderDate, {
          start: today,
          end: endOfDay(today),
        })
      ) {
        todayReminders.push(reminder);
      } else if (
        isWithinInterval(reminderDate, {
          start: tomorrow,
          end: endOfDay(tomorrow),
        })
      ) {
        tomorrowReminders.push(reminder);
      } else {
        upcomingReminders.push(reminder);
      }
    });

    return {
      overdue,
      today: todayReminders,
      tomorrow: tomorrowReminders,
      upcoming: upcomingReminders,
    };
  }, [filteredReminders]);

  // 리마인더 완료 상태 토글
  const handleMarkCompleted = (reminderId: string, completed: boolean) => {
    setReminderStates((prev) => ({
      ...prev,
      [reminderId]: {
        ...prev[reminderId],
        completed,
        enabled: prev[reminderId]?.enabled ?? true,
      },
    }));
    onMarkCompleted(reminderId, completed);
  };

  // 리마인더 알림 상태 토글
  const handleToggleReminder = (reminderId: string, enabled: boolean) => {
    setReminderStates((prev) => ({
      ...prev,
      [reminderId]: {
        ...prev[reminderId],
        enabled,
        completed: prev[reminderId]?.completed || false,
      },
    }));
    onToggleReminder(reminderId, enabled);
  };

  // 리마인더 그룹 렌더링
  const renderReminderGroup = (
    title: string,
    reminders: Reminder[],
    icon?: React.ReactNode,
  ) => {
    if (reminders.length === 0) return null;

    return (
      <div className="mb-6">
        <div className="flex items-center mb-3">
          {icon}
          <h3 className="text-sm font-medium ml-2">{title}</h3>
          <Badge variant="secondary" className="ml-2">
            {reminders.length}
          </Badge>
        </div>
        <div className="space-y-3">
          {reminders.map((reminder) => renderReminderCard(reminder))}
        </div>
      </div>
    );
  };

  // 리마인더 카드 렌더링
  const renderReminderCard = (reminder: Reminder) => {
    return (
      <Card key={reminder.id} className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full p-0 h-6 w-6 mr-3 mt-1"
              onClick={() =>
                handleMarkCompleted(reminder.id, !reminder.completed)
              }
            >
              <div
                className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                  reminder.completed
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {reminder.completed && <CheckCircle2 className="h-3 w-3" />}
              </div>
            </Button>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3
                  className={`font-medium ${
                    reminder.completed ? 'line-through text-gray-500' : ''
                  }`}
                >
                  {reminder.noteTitle}
                </h3>

                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {reminder.reminderText}
                  </Badge>

                  <Switch
                    checked={reminder.enabled && globalNotifications}
                    onCheckedChange={(checked) =>
                      handleToggleReminder(reminder.id, checked)
                    }
                    disabled={!globalNotifications}
                  />

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onOpenNote(reminder.noteId)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {reminder.noteContent && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {reminder.noteContent}
                </p>
              )}

              <div className="flex items-center text-xs text-gray-500 mt-2">
                <Clock className="h-3 w-3 mr-1" />
                <span>{formatDate(reminder.reminderTime)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // 전역 알림 토글 처리
  const handleGlobalNotificationsToggle = (enabled: boolean) => {
    setGlobalNotifications(enabled);

    // 모든 리마인더의 알림 상태 업데이트
    const newStates: Record<string, { completed: boolean; enabled: boolean }> =
      {};
    reminders.forEach((reminder) => {
      newStates[reminder.id] = {
        completed: reminderStates[reminder.id]?.completed || false,
        enabled,
      };
      onToggleReminder(reminder.id, enabled);
    });
    setReminderStates((prev) => ({ ...prev, ...newStates }));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b">
        <Tabs
          value={activeFilter}
          onValueChange={(v) =>
            setActiveFilter(v as 'today' | 'tomorrow' | 'upcoming' | 'all')
          }
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="today">오늘</TabsTrigger>
            <TabsTrigger value="tomorrow">내일</TabsTrigger>
            <TabsTrigger value="upcoming">예정</TabsTrigger>
            <TabsTrigger value="all">전체</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center">
          <CalendarClock className="h-5 w-5 mr-2 text-blue-600" />
          <h2 className="font-medium">리마인더</h2>
        </div>

        <div className="flex items-center space-x-2">
          <Label htmlFor="notifications" className="text-sm">
            알림 {globalNotifications ? '켜짐' : '꺼짐'}
          </Label>
          <Switch
            id="notifications"
            checked={globalNotifications}
            onCheckedChange={handleGlobalNotificationsToggle}
          />
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {filteredReminders.length > 0 ? (
          <div>
            {renderReminderGroup(
              '지연된 항목',
              groupedReminders.overdue,
              <AlertCircle className="h-4 w-4 text-red-500" />,
            )}
            {renderReminderGroup(
              '오늘',
              groupedReminders.today,
              <Clock className="h-4 w-4 text-blue-600" />,
            )}
            {renderReminderGroup(
              '내일',
              groupedReminders.tomorrow,
              <Calendar className="h-4 w-4 text-green-600" />,
            )}
            {renderReminderGroup(
              '예정된 항목',
              groupedReminders.upcoming,
              <Calendar className="h-4 w-4 text-gray-600" />,
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <Bell className="h-12 w-12 mb-4 text-gray-300" />
            <p>리마인더가 없습니다</p>
            <p className="text-sm mt-2">
              노트에 @오늘, @내일, @3시와 같은 형식으로 리마인더를 추가해보세요
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ReminderView;
