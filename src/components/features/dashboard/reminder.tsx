import React, { useState, useEffect, useMemo } from 'react';
import { format, isSameDay, addDays, startOfDay, subDays } from 'date-fns';
import {
  Bell,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  Trash2,
  AlertCircle,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

import { useThemeStore } from '@/stores/themeStore';
import { useNoteStore } from '@/stores/dataStore';
import { useAuthStore } from '@/stores/authStore'; // useAuthStore 임포트
import { Note, Reminder } from '@/types';
import {
  createReminderNotifications,
  cancelReminderNotifications,
  deleteReminderNotifications,
} from '@/utils/supabaseNotifications'; // 새로 만든 유틸 함수 임포트

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
  reminders: Reminder[];
  onToggleReminder: (reminderId: string, enabled: boolean) => void;
  onMarkCompleted: (reminderId: string, completed: boolean) => void;
  onDeleteReminder: (reminderId: string) => void;
  onOpenNote: (noteId: string) => void;
}

export const ReminderView: React.FC<ReminderViewProps> = ({
  // notes,
  reminders,
  onToggleReminder,
  onMarkCompleted,
  onDeleteReminder,
  onOpenNote,
}) => {
  const { isDarkMode, isDeepDarkMode } = useThemeStore();
  const { user } = useAuthStore(); // user 정보 가져오기
  const [activeFilter, setActiveFilter] = useState<
    'recent' | 'upcoming' | 'overdue' | 'completed'
  >('recent');
  const [internalReminders, setInternalReminders] = useState<
    InternalReminder[]
  >([]);
  const [globalNotifications, setGlobalNotifications] = useState(true);
  const notes = useNoteStore((state) => state.notes);

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

  useEffect(() => {
    // 알림 권한 요청
    if (Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        setGlobalNotifications(permission === 'granted');
      });
    } else {
      setGlobalNotifications(Notification.permission === 'granted');
    }
  }, []);

  // 필터링된 리마인더
  const filteredReminders = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = startOfDay(addDays(now, 1));
    const dayAfterTomorrow = startOfDay(addDays(now, 2));
    const threeDaysLater = startOfDay(addDays(now, 3));

    let filtered = internalReminders.filter((reminder) => {
      const reminderDate = startOfDay(reminder.reminderTime);

      switch (activeFilter) {
        case 'recent':
          return (
            !reminder.completed &&
            reminderDate >= today &&
            reminderDate < threeDaysLater &&
            reminder.reminderTime >= now // 현재 시간 이후만
          );
        case 'upcoming':
          return !reminder.completed && reminderDate >= threeDaysLater;
        case 'overdue':
          return !reminder.completed && reminder.reminderTime < now; // 시간까지 비교
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
    if (activeFilter !== 'recent')
      return { today: [], tomorrow: [], dayAfter: [], overdue: [] };

    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = startOfDay(addDays(now, 1));
    const dayAfter = startOfDay(addDays(now, 2));

    const todayReminders: InternalReminder[] = [];
    const tomorrowReminders: InternalReminder[] = [];
    const dayAfterReminders: InternalReminder[] = [];
    const overdueReminders: InternalReminder[] = [];

    filteredReminders.forEach((reminder) => {
      const reminderDate = startOfDay(reminder.reminderTime);
      const isOverdue = reminder.reminderTime < now;

      if (isOverdue) {
        overdueReminders.push(reminder);
      } else if (isSameDay(reminderDate, today)) {
        todayReminders.push(reminder);
      } else if (isSameDay(reminderDate, tomorrow)) {
        tomorrowReminders.push(reminder);
      } else if (isSameDay(reminderDate, dayAfter)) {
        dayAfterReminders.push(reminder);
      }
    });

    return {
      today: todayReminders,
      tomorrow: tomorrowReminders,
      dayAfter: dayAfterReminders,
      overdue: overdueReminders,
    };
  }, [filteredReminders, activeFilter]);

  const groupedOverdueReminders = useMemo(() => {
    if (activeFilter !== 'overdue')
      return { today: [], yesterday: [], dayBeforeYesterday: [], older: [] };

    const now = new Date();
    const today = startOfDay(now);
    const yesterday = startOfDay(subDays(now, 1));
    const dayBeforeYesterday = startOfDay(subDays(now, 2));

    const todayOverdue: InternalReminder[] = [];
    const yesterdayOverdue: InternalReminder[] = [];
    const dayBeforeYesterdayOverdue: InternalReminder[] = [];
    const olderOverdue: InternalReminder[] = [];

    filteredReminders.forEach((reminder) => {
      const reminderDate = startOfDay(reminder.reminderTime);

      if (isSameDay(reminderDate, today)) {
        todayOverdue.push(reminder);
      } else if (isSameDay(reminderDate, yesterday)) {
        yesterdayOverdue.push(reminder);
      } else if (isSameDay(reminderDate, dayBeforeYesterday)) {
        dayBeforeYesterdayOverdue.push(reminder);
      } else {
        olderOverdue.push(reminder);
      }
    });

    return {
      today: todayOverdue,
      yesterday: yesterdayOverdue,
      dayBeforeYesterday: dayBeforeYesterdayOverdue,
      older: olderOverdue,
    };
  }, [filteredReminders, activeFilter]);

  // 리마인더 완료 상태 토글
  const handleMarkCompleted = async (
    reminderId: string,
    completed: boolean,
  ) => {
    try {
      if (completed) {
        // 완료시 남은 알림 취소
        await cancelReminderNotifications(reminderId);
      }

      onMarkCompleted(reminderId, completed);
    } catch (error) {
      console.error('완료 처리 오류:', error);
    }
    setInternalReminders((prev) =>
      prev.map((reminder) =>
        reminder.id === reminderId ? { ...reminder, completed } : reminder,
      ),
    );
  };

  // 리마인더 알림 상태 토글
  const handleToggleReminder = async (
    reminderId: string,
    enabled: boolean,
    noteTitle: string,
  ) => {
    const reminder = internalReminders.find((r) => r.id === reminderId);
    if (!reminder || !user?.id) return; // user.id가 없으면 반환

    try {
      if (enabled && globalNotifications) {
        // 알림 스케줄 생성
        await createReminderNotifications(
          user.id, // Supabase user ID 사용
          reminder.noteId,
          reminder.id,
          reminder.reminderText,
          noteTitle,
          new Date(reminder.reminderTime),
        );
      } else {
        // 알림 스케줄 취소
        await cancelReminderNotifications(reminder.id);
      }

      onToggleReminder(reminder.id, enabled); // 부모 컴포넌트의 상태 업데이트 호출
    } catch (error) {
      console.error('알림 설정 오류:', error);
    }

    setInternalReminders((prev) =>
      prev.map((r) => (r.id === reminderId ? { ...r, enabled } : r)),
    );
  };

  // 완료된 모든 리마인더 삭제
  const handleDeleteAllCompleted = async () => {
    const completedIds = internalReminders
      .filter((r) => r.completed)
      .map((r) => r.id);

    for (const id of completedIds) {
      await deleteReminderNotifications(id); // DB에서도 알림 삭제
      await onDeleteReminder(id);
    }
  };

  // 리마인더 삭제
  const handleDeleteReminder = async (reminderId: string) => {
    try {
      // 관련 알림 모두 삭제
      await deleteReminderNotifications(reminderId);
      await onDeleteReminder(reminderId);
    } catch (error) {
      console.error('삭제 오류:', error);
    }

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
    const isOverdue = !reminder.completed && reminder.reminderTime < now; // 현재 시간보다 과거면 지연

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

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3
                  className={`font-medium text-base leading-snug ${
                    reminder.completed ? 'line-through text-gray-500' : ''
                  }`}
                >
                  {reminder.reminderText}
                </h3>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {!reminder.completed && (
                    <>
                      {reminder.enabled && globalNotifications && (
                        <Bell className="h-4 w-4 text-blue-500" />
                      )}
                      <Switch
                        checked={reminder.enabled && globalNotifications}
                        onCheckedChange={(checked) =>
                          handleToggleReminder(
                            reminder.id,
                            checked,
                            reminder.noteTitle,
                          )
                        }
                        disabled={!globalNotifications}
                        className="scale-90"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </>
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

              <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                <div
                  className={`flex items-center ${
                    isOverdue ? 'text-red-600 font-medium' : ''
                  }`}
                >
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  <span>
                    {format(reminder.reminderTime, 'yyyy.MM.dd p')}
                  </span>{' '}
                  {/* 날짜 형식 변경 */}
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
  const handleGlobalNotificationsToggle = async (enabled: boolean) => {
    setGlobalNotifications(enabled);

    // 전역 알림이 꺼지면 모든 활성화된 리마인더의 알림도 취소
    // 전역 알림이 켜지면 모든 활성화된 리마인더의 알림을 다시 스케줄
    if (!user?.id) {
      console.warn('사용자 ID가 없어 전역 알림 토글에 실패했습니다.');
      return;
    }

    for (const reminder of internalReminders) {
      if (!reminder.completed) {
        if (enabled) {
          await createReminderNotifications(
            user.id,
            reminder.noteId,
            reminder.id,
            reminder.reminderText,
            reminder.noteTitle,
            new Date(reminder.reminderTime),
          );
        } else {
          await cancelReminderNotifications(reminder.id);
        }
      }
    }

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
              지연
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
                {renderReminderGroup(
                  '모레',
                  groupedRecentReminders.dayAfter,
                  <Calendar className="h-4 w-4 text-purple-600" />,
                )}
              </>
            ) : activeFilter === 'upcoming' ? (
              renderReminderGroup(
                '예정된 항목',
                filteredReminders,
                <Calendar className="h-4 w-4 text-gray-600" />,
              )
            ) : activeFilter === 'overdue' ? (
              <>
                {renderReminderGroup(
                  '오늘 (지연)',
                  groupedOverdueReminders.today,
                  <AlertCircle className="h-4 w-4 text-red-500" />,
                )}
                {renderReminderGroup(
                  '어제',
                  groupedOverdueReminders.yesterday,
                  <AlertCircle className="h-4 w-4 text-orange-500" />,
                )}
                {renderReminderGroup(
                  '엊그제',
                  groupedOverdueReminders.dayBeforeYesterday,
                  <AlertCircle className="h-4 w-4 text-yellow-500" />,
                )}
                {renderReminderGroup(
                  '그 이전',
                  groupedOverdueReminders.older,
                  <AlertCircle className="h-4 w-4 text-gray-500" />,
                )}
              </>
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
