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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bell,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  CalendarClock,
  FileText,
  ArrowUpDown,
} from 'lucide-react';
import { Note, Reminder } from '@/types';

// 컴포넌트 내부용 리마인더 타입 (기존 로직 유지)
interface InternalReminder {
  id: string;
  noteId: string;
  noteTitle: string;
  noteContent: string;
  reminderText: string;
  reminderTime: Date;
  completed: boolean;
  enabled: boolean;
}

interface ReminderViewProps {
  notes: Note[];
  reminders: Reminder[]; // Supabase에서 가져온 리마인더들
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
  reminders,
  onToggleReminder,
  onMarkCompleted,
  onOpenNote,
}) => {
  const { isDarkMode, isDeepDarkMode } = useThemeStore();
  const [activeFilter, setActiveFilter] = useState<
    'recent' | 'upcoming' | 'overdue' | 'completed'
  >('recent');
  const [internalReminders, setInternalReminders] = useState<
    InternalReminder[]
  >([]);
  const [globalNotifications, setGlobalNotifications] = useState(true);

  // Notes를 Map으로 변환 (빠른 검색용)
  const notesMap = useMemo(() => {
    const map = new Map<string, Note>();
    notes.forEach((note) => map.set(note.id, note));
    return map;
  }, [notes]);

  // Supabase 리마인더를 내부 형식으로 변환
  useEffect(() => {
    const convertedReminders: InternalReminder[] = reminders.map((reminder) => {
      const note = notesMap.get(reminder.note_id);
      const reminderTime = new Date(reminder.reminder_time);

      return {
        id: reminder.id,
        noteId: reminder.note_id,
        noteTitle: note?.title || '알 수 없는 노트',
        noteContent:
          note?.content?.substring(0, 100).replace(/<[^>]*>/g, '') || '',
        reminderText: reminder.reminder_text,
        reminderTime,
        completed: reminder.completed,
        enabled: reminder.enabled,
      };
    });

    setInternalReminders(convertedReminders);
  }, [reminders, notesMap]);

  // 필터링된 리마인더
  const filteredReminders = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = startOfDay(addDays(now, 1));
    const dayAfterTomorrow = startOfDay(addDays(now, 2));

    let filtered = internalReminders.filter((reminder) => {
      const reminderDate = startOfDay(reminder.reminderTime);

      switch (activeFilter) {
        case 'recent':
          // 오늘과 내일 (완료되지 않은 것만)
          return (
            !reminder.completed &&
            reminderDate >= today &&
            reminderDate < dayAfterTomorrow
          );
        case 'upcoming':
          // 모레부터 미래 (완료되지 않은 것만)
          return !reminder.completed && reminderDate >= dayAfterTomorrow;
        case 'overdue':
          // 어제까지 (완료되지 않은 것만)
          return !reminder.completed && reminderDate < today;
        case 'completed':
          // 완료된 것들
          return reminder.completed;
        default:
          return true;
      }
    });

    filtered.sort(
      (a, b) => a.reminderTime.getTime() - b.reminderTime.getTime(),
    );

    return filtered;
  }, [internalReminders, activeFilter]);

  // 시간대별 그룹화 (recent 탭용)
  const groupedRecentReminders = useMemo(() => {
    if (activeFilter !== 'recent') return { today: [], tomorrow: [] };

    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = startOfDay(addDays(now, 1));

    const todayReminders: InternalReminder[] = [];
    const tomorrowReminders: InternalReminder[] = [];

    filteredReminders.forEach((reminder) => {
      const reminderDate = startOfDay(reminder.reminderTime);

      if (
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
      }
    });

    return { today: todayReminders, tomorrow: tomorrowReminders };
  }, [filteredReminders, activeFilter]);

  // 리마인더 완료 상태 토글
  const handleMarkCompleted = (reminderId: string, completed: boolean) => {
    setInternalReminders((prev) =>
      prev.map((reminder) =>
        reminder.id === reminderId ? { ...reminder, completed } : reminder,
      ),
    );
    onMarkCompleted(reminderId, completed);
  };

  // 리마인더 알림 상태 토글
  const handleToggleReminder = (reminderId: string, enabled: boolean) => {
    setInternalReminders((prev) =>
      prev.map((reminder) =>
        reminder.id === reminderId ? { ...reminder, enabled } : reminder,
      ),
    );
    onToggleReminder(reminderId, enabled);
  };

  // 리마인더 그룹 렌더링
  const renderReminderGroup = (
    title: string,
    reminders: InternalReminder[],
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
  const renderReminderCard = (reminder: InternalReminder) => {
    const now = new Date();
    const isOverdue =
      reminder.reminderTime < now &&
      !isToday(reminder.reminderTime) &&
      !reminder.completed;

    return (
      <Card
        key={reminder.id}
        className={`transition-all duration-200 hover:shadow-md border-l-4 ${
          isOverdue
            ? 'border-l-red-400'
            : reminder.completed
            ? 'border-l-green-400'
            : 'border-l-blue-400'
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
                    ? 'border-green-500'
                    : 'border-gray-300 hover:border-green-400'
                }`}
              >
                {reminder.completed && <CheckCircle2 className="h-3 w-3" />}
              </div>
            </Button>

            {/* 메인 콘텐츠 */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-lg leading-tight">
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

    internalReminders.forEach((reminder) => {
      if (!reminder.completed) {
        onToggleReminder(reminder.id, enabled);
      }
    });

    setInternalReminders((prev) =>
      prev.map((reminder) => ({
        ...reminder,
        enabled: reminder.completed ? reminder.enabled : enabled,
      })),
    );
  };

  return (
    <div
      className={`flex flex-col h-full theme-${
        isDarkMode ? (isDeepDarkMode ? 'deepdark' : 'dark') : 'light'
      }`}
    >
      {/* 헤더 */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <CalendarClock className="h-6 w-6 mr-3 text-blue-600" />
            <h1 className="text-xl font-bold">리마인더</h1>
          </div>
        </div>

        <Tabs
          value={activeFilter}
          onValueChange={(v) =>
            setActiveFilter(
              v as 'recent' | 'upcoming' | 'overdue' | 'completed',
            )
          }
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overdue">이전</TabsTrigger>
            <TabsTrigger value="recent">최근</TabsTrigger>
            <TabsTrigger value="upcoming">예정</TabsTrigger>
            <TabsTrigger value="completed">완료</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 알림 설정 */}
        <div
          className={`${
            activeFilter === 'recent' ? 'mt-2' : 'mt-4'
          } flex items-center justify-between`}
        >
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
            {activeFilter === 'recent' ? (
              // 최근 탭: 오늘/내일로 그룹화
              <>
                {renderReminderGroup(
                  '오늘',
                  groupedRecentReminders.today,
                  <Clock className="h-4 w-4 text-blue-600" />,
                )}
                {renderReminderGroup(
                  '내일',
                  groupedRecentReminders.tomorrow,
                  <Calendar className="h-4 w-4 text-green-600" />,
                )}
              </>
            ) : activeFilter === 'upcoming' ? (
              // 예정 탭
              renderReminderGroup(
                '예정된 항목',
                filteredReminders,
                <Calendar className="h-4 w-4 text-gray-600" />,
              )
            ) : activeFilter === 'overdue' ? (
              // 이전 탭
              renderReminderGroup(
                '기한이 지난 항목',
                filteredReminders,
                <AlertCircle className="h-4 w-4 text-red-500" />,
              )
            ) : (
              // 완료 탭
              renderReminderGroup(
                '완료된 항목',
                filteredReminders,
                <CheckCircle2 className="h-4 w-4 text-green-600" />,
              )
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <Bell className="h-16 w-16 mb-6 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeFilter === 'completed'
                ? '완료된 리마인더가 없습니다'
                : activeFilter === 'overdue'
                ? '기한이 지난 리마인더가 없습니다'
                : '리마인더가 없습니다'}
            </h3>
            <p className="text-sm text-gray-500 max-w-md">
              에디터에서 리마인더를 추가하면 여기에 표시됩니다
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ReminderView;
