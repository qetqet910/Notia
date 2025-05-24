import React, { useState, useEffect, useMemo } from 'react';
import { useThemeStore } from '@/stores/themeStore';
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
  CheckCircle2,
  CalendarClock,
  FileText,
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

// 리마인더 시간 파싱 함수
const parseReminderTime = (reminderValue: string): Date | null => {
  const now = new Date();

  if (reminderValue === '오늘') {
    const today = new Date();
    today.setHours(9, 0, 0, 0);
    return today;
  } else if (reminderValue === '내일') {
    const tomorrow = addDays(new Date(), 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow;
  } else if (reminderValue === '모레') {
    const dayAfterTomorrow = addDays(new Date(), 2);
    dayAfterTomorrow.setHours(9, 0, 0, 0);
    return dayAfterTomorrow;
  }

  const dateTimeMatch = reminderValue.match(/(\d{4}-\d{2}-\d{2})\s+(\d+)시/);
  if (dateTimeMatch) {
    try {
      const [, dateStr, hourStr] = dateTimeMatch;
      const [year, month, day] = dateStr.split('-').map(Number);
      const hour = parseInt(hourStr);
      if (hour >= 0 && hour <= 23) {
        return new Date(year, month - 1, day, hour, 0, 0, 0);
      }
    } catch (e) {
      console.error('날짜+시간 파싱 오류:', e);
    }
  }

  const hourMatch = reminderValue.match(/(\d+)시/);
  if (hourMatch) {
    const hour = parseInt(hourMatch[1]);
    if (hour >= 0 && hour <= 23) {
      const reminderTime = new Date();
      reminderTime.setHours(hour, 0, 0, 0);

      if (reminderTime < now) {
        return addDays(reminderTime, 1);
      }
      return reminderTime;
    }
  }

  if (reminderValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
    try {
      const [year, month, day] = reminderValue.split('-').map(Number);
      return new Date(year, month - 1, day, 9, 0, 0, 0);
    } catch (e) {
      console.error('날짜 파싱 오류:', e);
    }
  }

  return null;
};

export const ReminderView: React.FC<ReminderViewProps> = ({
  notes,
  onToggleReminder,
  onMarkCompleted,
  onOpenNote,
}) => {
  const { isDarkMode, isDeepDarkMode } = useThemeStore();
  const [activeFilter, setActiveFilter] = useState<
    'today' | 'tomorrow' | 'upcoming' | 'completed'
  >('today');
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [reminderStates, setReminderStates] = useState<
    Record<string, { completed: boolean; enabled: boolean }>
  >({});
  const [globalNotifications, setGlobalNotifications] = useState(true);

  // 노트에서 리마인더 추출
  useEffect(() => {
    const extractedReminders: Reminder[] = [];

    notes.forEach((note) => {
      const reminderRegex = /@([^@#\n]+?)\./g;
      const content = note.content || '';
      let match;
      let matchIndex = 0;

      while ((match = reminderRegex.exec(content)) !== null) {
        const reminderText = match[1].trim();
        const reminderTime = parseReminderTime(reminderText);

        if (reminderTime) {
          const reminderId = `${
            note.id
          }-${reminderText}-${reminderTime.getTime()}-${matchIndex}`;
          matchIndex++;

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
      const reminderDate = startOfDay(reminder.reminderTime);

      switch (activeFilter) {
        case 'today':
          return (
            !reminder.completed &&
            isWithinInterval(reminderDate, {
              start: today,
              end: endOfDay(today),
            })
          );
        case 'tomorrow':
          return (
            !reminder.completed &&
            isWithinInterval(reminderDate, {
              start: tomorrow,
              end: endOfDay(tomorrow),
            })
          );
        case 'upcoming':
          return !reminder.completed && reminderDate > tomorrow;
        case 'completed':
          return reminder.completed;
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
    const completedReminders: Reminder[] = [];

    filteredReminders.forEach((reminder) => {
      const reminderDate = startOfDay(reminder.reminderTime);

      if (reminder.completed) {
        completedReminders.push(reminder);
      } else if (
        reminder.reminderTime < now &&
        !isToday(reminder.reminderTime)
      ) {
        overdue.push(reminder);
      } else if (
        isWithinInterval(reminderDate, { start: today, end: endOfDay(today) })
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
      completed: completedReminders,
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
        <div className="flex items-center mb-4 px-1">
          {icon}
          <h3 className="text-sm font-semibold ml-2 text-gray-700">{title}</h3>
          <Badge variant="secondary" className="ml-2 text-xs">
            {reminders.length}
          </Badge>
        </div>
        <div className="space-y-2">
          {reminders.map((reminder) => renderReminderCard(reminder))}
        </div>
      </div>
    );
  };

  // 리마인더 카드 렌더링
  const renderReminderCard = (reminder: Reminder) => {
    const isOverdue =
      reminder.reminderTime < new Date() &&
      !isToday(reminder.reminderTime) &&
      !reminder.completed;

    return (
      <Card
        key={reminder.id}
        className={`transition-all duration-200 hover:shadow-md border-l-4 ${
          isOverdue
            ? 'border-l-red-400 bg-red-50'
            : reminder.completed
            ? 'border-l-green-400 bg-green-50'
            : 'border-l-blue-400 bg-white'
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* 완료 체크박스 */}
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-6 w-6 rounded-full flex-shrink-0 mt-1"
              onClick={() =>
                handleMarkCompleted(reminder.id, !reminder.completed)
              }
            >
              <div
                className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  reminder.completed
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-300 hover:border-green-400'
                }`}
              >
                {reminder.completed && <CheckCircle2 className="h-3 w-3" />}
              </div>
            </Button>

            {/* 메인 콘텐츠 */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3
                  className={`font-medium text-lg leading-tight ${
                    reminder.completed
                      ? 'line-through text-gray-500'
                      : isOverdue
                      ? 'text-red-700'
                      : 'text-gray-900'
                  }`}
                >
                  {reminder.reminderText}
                </h3>

                {/* 알림/노트 버튼 */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!reminder.completed && (
                    <Switch
                      checked={reminder.enabled && globalNotifications}
                      onCheckedChange={(checked) =>
                        handleToggleReminder(reminder.id, checked)
                      }
                      disabled={!globalNotifications}
                      className="size-sm"
                    />
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                    onClick={() => onOpenNote(reminder.noteId)}
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* 시간 정보 */}
              <div
                className={`flex items-center text-sm ${
                  isOverdue ? 'text-red-600' : 'text-gray-600'
                }`}
              >
                <Clock className="h-3.5 w-3.5 mr-1.5" />
                <span>{formatDate(reminder.reminderTime)}</span>
                {isOverdue && (
                  <Badge
                    variant="destructive"
                    className="ml-2 text-xs px-1.5 py-0.5"
                  >
                    지연됨
                  </Badge>
                )}
              </div>

              {/* 노트 정보 */}
              <div className="text-sm text-gray-500">
                <div className="flex items-start gap-1.5">
                  <span className="font-medium text-gray-600 text-xs">
                    📝 {reminder.noteTitle}
                  </span>
                </div>
                {reminder.noteContent && (
                  <p className="line-clamp-2 mt-1 text-xs opacity-75">
                    {reminder.noteContent}
                  </p>
                )}
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
    <div
      className={`flex flex-col h-full theme-${
        isDarkMode ? (isDeepDarkMode ? 'deepdark' : 'dark') : 'light'
      }`}
    >
      {/* 헤더 */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <CalendarClock className="h-6 w-6 mr-3 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">리마인더</h1>
          </div>
        </div>

        <Tabs
          value={activeFilter}
          onValueChange={(v) =>
            setActiveFilter(
              v as 'today' | 'tomorrow' | 'upcoming' | 'completed',
            )
          }
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="today">오늘</TabsTrigger>
            <TabsTrigger value="tomorrow">내일</TabsTrigger>
            <TabsTrigger value="upcoming">예정</TabsTrigger>
            <TabsTrigger value="completed">완료</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 알림 설정 */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Label htmlFor="notifications" className="text-sm font-medium">
              전체 알림
            </Label>
            <Switch
              id="notifications"
              checked={globalNotifications}
              onCheckedChange={handleGlobalNotificationsToggle}
            />
          </div>
          <Badge
            variant={globalNotifications ? 'default' : 'secondary'}
            className="text-xs"
          >
            {globalNotifications ? '켜짐' : '꺼짐'}
          </Badge>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <ScrollArea className="flex-1 p-4">
        {filteredReminders.length > 0 ? (
          <div>
            {activeFilter === 'completed' ? (
              renderReminderGroup(
                '완료된 항목',
                groupedReminders.completed,
                <CheckCircle2 className="h-4 w-4 text-green-600" />,
              )
            ) : (
              <>
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
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <Bell className="h-16 w-16 mb-6 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeFilter === 'completed'
                ? '완료된 리마인더가 없습니다'
                : '리마인더가 없습니다'}
            </h3>
            <p className="text-sm text-gray-500 max-w-md">
              노트에{' '}
              <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                @오늘
              </code>
              ,{' '}
              <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                @내일
              </code>
              ,{' '}
              <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                @3시
              </code>
              와 같은 형식으로 리마인더를 추가해보세요
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ReminderView;
