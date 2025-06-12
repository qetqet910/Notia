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
  Trash2,
  MoreHorizontal,
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
  onDeleteReminder: (reminderId: string) => void; // 삭제 함수 추가
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
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  if (isToday(date)) {
    return `오늘 ${date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  } else if (isTomorrow(date)) {
    return `내일 ${date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  } else if (diffHours > 0 && diffHours < 168) {
    // 1주일 이내
    const diffDays = Math.ceil(diffHours / 24);
    return `${diffDays}일 후 ${date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  } else {
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
};

export const ReminderView: React.FC<ReminderViewProps> = ({
  notes,
  reminders,
  onToggleReminder,
  onMarkCompleted,
  onDeleteReminder,
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
          return (
            !reminder.completed &&
            reminderDate >= today &&
            reminderDate < dayAfterTomorrow
          );
        case 'upcoming':
          return !reminder.completed && reminderDate >= dayAfterTomorrow;
        case 'overdue':
          return !reminder.completed && reminderDate < today;
        case 'completed':
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

  // 완료된 모든 리마인더 삭제
  const handleDeleteAllCompleted = async () => {
    const completedIds = internalReminders
      .filter((r) => r.completed)
      .map((r) => r.id);

    for (const id of completedIds) {
      await onDeleteReminder(id);
    }
  };

  // 리마인더 삭제
  const handleDeleteReminder = async (reminderId: string) => {
    await onDeleteReminder(reminderId);
    setInternalReminders((prev) =>
      prev.filter((reminder) => reminder.id !== reminderId),
    );
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
        <div className="flex items-center mb-3 px-1">
          {icon}
          <h3 className="text-sm font-medium ml-2 text-gray-600">{title}</h3>
          <Badge variant="secondary" className="ml-2 text-xs px-1.5 py-0.5">
            {reminders.length}
          </Badge>
        </div>
        <div className="space-y-2">
          {reminders.map((reminder) => renderReminderCard(reminder))}
        </div>
      </div>
    );
  };

  // 리마인더 카드 렌더링 (개선된 버전)
  const renderReminderCard = (reminder: InternalReminder) => {
    const now = new Date();
    const isOverdue =
      reminder.reminderTime < now &&
      !isToday(reminder.reminderTime) &&
      !reminder.completed;

    return (
      <Card
        key={reminder.id}
        onClick={() => onOpenNote(reminder.noteId)}
        className={`group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 border-l-3 cursor-pointer ${
          isOverdue
            ? 'border-l-red-400'
            : reminder.completed
            ? 'border-l-green-400'
            : 'border-l-blue-400'
        } ${reminder.completed ? 'opacity-70' : ''}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* 완료 체크박스 */}
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-6 w-6 rounded-full flex-shrink-0 hover:bg-transparent"
              onClick={(e) => {
                e.stopPropagation();
                handleMarkCompleted(reminder.id, !reminder.completed);
              }}
            >
              <div
                className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  reminder.completed
                    ? 'border-green-500 bg-green-500'
                    : 'border-gray-300 group-hover:border-green-400'
                }`}
              >
                {reminder.completed && (
                  <CheckCircle2 className="h-3 w-3 text-white" />
                )}
              </div>
            </Button>

            {/* 메인 콘텐츠 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3
                  className={`font-medium text-base leading-snug ${
                    reminder.completed ? 'line-through text-gray-500' : ''
                  }`}
                >
                  {reminder.reminderText}
                </h3>

                {/* 알람 버튼 - 항상 표시 */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {!reminder.completed && (
                    <Switch
                      checked={reminder.enabled && globalNotifications}
                      onCheckedChange={(checked) =>
                        handleToggleReminder(reminder.id, checked)
                      }
                      disabled={!globalNotifications}
                      className="scale-90"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}

                  {reminder.completed && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteReminder(reminder.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* 시간 및 노트 정보 */}
              <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                <div
                  className={`flex items-center ${
                    isOverdue ? 'text-red-600 font-medium' : ''
                  }`}
                >
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  <span>{formatDate(reminder.reminderTime)}</span>
                  {isOverdue && (
                    <Badge
                      variant="destructive"
                      className="ml-2 text-xs px-1.5 py-0.5 h-5"
                    >
                      지연
                    </Badge>
                  )}
                </div>
                <div className="flex items-center text-sm text-gray-400 max-w-36 truncate">
                  <span>📝</span>
                  <span className="ml-1.5 truncate">{reminder.noteTitle}</span>
                </div>
              </div>

              {/* 노트 내용 프리뷰 - 완료 상태에 따른 애니메이션 */}
              <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  reminder.completed
                    ? 'max-h-0 opacity-0'
                    : 'max-h-6 opacity-60'
                }`}
              >
                {reminder.noteContent && (
                  <p className="text-xs text-gray-400 truncate">
                    {reminder.noteContent.length > 50
                      ? `${reminder.noteContent.substring(0, 50)}...`
                      : reminder.noteContent}
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
            <CalendarClock className="h-5 w-5 mr-2 text-blue-600" />
            <h1 className="text-lg font-bold">리마인더</h1>
          </div>

          {/* 완료된 항목 일괄 삭제 버튼 */}
          {activeFilter === 'completed' && filteredReminders.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleDeleteAllCompleted}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              모두 삭제
            </Button>
          )}
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
            <TabsTrigger value="overdue" className="text-xs">
              이전
            </TabsTrigger>
            <TabsTrigger value="recent" className="text-xs">
              최근
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="text-xs">
              예정
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs">
              완료
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 알림 설정 */}
        {activeFilter !== 'completed' && (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Label htmlFor="notifications" className="text-sm">
                전체 알림
              </Label>
              <Switch
                id="notifications"
                checked={globalNotifications}
                onCheckedChange={handleGlobalNotificationsToggle}
                className="scale-90"
              />
            </div>
            <Badge
              variant={globalNotifications ? 'default' : 'secondary'}
              className="text-xs px-2 py-0.5"
            >
              {globalNotifications ? '켜짐' : '꺼짐'}
            </Badge>
          </div>
        )}
      </div>

      {/* 메인 콘텐츠 */}
      <ScrollArea className="flex-1 p-4">
        {filteredReminders.length > 0 ? (
          <div>
            {activeFilter === 'recent' ? (
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
              renderReminderGroup(
                '예정된 항목',
                filteredReminders,
                <Calendar className="h-4 w-4 text-gray-600" />,
              )
            ) : activeFilter === 'overdue' ? (
              renderReminderGroup(
                '기한이 지난 항목',
                filteredReminders,
                <AlertCircle className="h-4 w-4 text-red-500" />,
              )
            ) : (
              renderReminderGroup(
                '완료된 항목',
                filteredReminders,
                <CheckCircle2 className="h-4 w-4 text-green-600" />,
              )
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <Bell className="h-12 w-12 mb-4 text-gray-300" />
            <h3 className="text-base font-medium text-gray-900 mb-2">
              {activeFilter === 'completed'
                ? '완료된 리마인더가 없습니다'
                : activeFilter === 'overdue'
                ? '기한이 지난 리마인더가 없습니다'
                : '리마인더가 없습니다'}
            </h3>
            <p className="text-sm text-gray-500 max-w-xs">
              에디터에서 리마인더를 추가하면 여기에 표시됩니다
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ReminderView;
