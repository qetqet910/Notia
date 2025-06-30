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
import { useAuthStore } from '@/stores/authStore';
import { Reminder } from '@/types';
import {
  createReminderNotifications,
  cancelReminderNotifications,
  deleteReminderNotifications,
} from '@/utils/supabaseNotifications';

// 확장된 리마인더 타입 정의
type EnrichedReminder = Reminder & {
  noteId: string;
  noteTitle: string;
  noteContent: string;
};

interface ReminderViewProps {
  reminders: EnrichedReminder[];
  onToggleComplete: (reminderId: string, completed: boolean) => void;
  onToggleEnable: (reminderId: string, enabled: boolean) => void;
  onDelete: (reminderId: string) => void;
  onOpenNote: (noteId: string) => void;
}

export const ReminderView: React.FC<ReminderViewProps> = ({
  reminders,
  onToggleComplete,
  onToggleEnable,
  onDelete,
  onOpenNote,
}) => {
  const { isDarkMode, isDeepDarkMode } = useThemeStore();
  const { user } = useAuthStore();
  const [activeFilter, setActiveFilter] = useState<'recent' | 'upcoming' | 'overdue' | 'completed'>('recent');
  const [globalNotifications, setGlobalNotifications] = useState(true);

  // 브라우저 알림 권한 상태 확인
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        setGlobalNotifications(permission === 'granted');
      });
    } else {
      setGlobalNotifications(Notification.permission === 'granted');
    }
  }, []);

  // 필터링된 리마인더 (내부 상태 대신 prop을 직접 사용)
  const filteredReminders = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    const threeDaysLater = startOfDay(addDays(now, 3));

    let filtered = reminders.filter((reminder) => {
      const reminderDate = startOfDay(new Date(reminder.reminder_time));
      const reminderTime = new Date(reminder.reminder_time);

      switch (activeFilter) {
        case 'recent':
          return (
            !reminder.completed &&
            reminderDate >= today &&
            reminderDate < threeDaysLater &&
            reminderTime >= now
          );
        case 'upcoming':
          return !reminder.completed && reminderDate >= threeDaysLater;
        case 'overdue':
          return !reminder.completed && reminderTime < now;
        case 'completed':
          return reminder.completed;
        default:
          return true;
      }
    });

    filtered.sort(
      (a, b) => new Date(a.reminder_time).getTime() - new Date(b.reminder_time).getTime(),
    );

    return filtered;
  }, [reminders, activeFilter]);


  // 그룹화 로직 (내부 상태 대신 prop을 직접 사용)
  const { groupedRecentReminders, groupedOverdueReminders } = useMemo(() => {
    const now = new Date();
    
    // Recent 그룹
    const today = startOfDay(now);
    const tomorrow = startOfDay(addDays(now, 1));
    const dayAfter = startOfDay(addDays(now, 2));
    const recentGroups = { today: [] as EnrichedReminder[], tomorrow: [] as EnrichedReminder[], dayAfter: [] as EnrichedReminder[] };

    // Overdue 그룹
    const yesterday = startOfDay(subDays(now, 1));
    const dayBeforeYesterday = startOfDay(subDays(now, 2));
    const overdueGroups = { today: [] as EnrichedReminder[], yesterday: [] as EnrichedReminder[], dayBeforeYesterday: [] as EnrichedReminder[], older: [] as EnrichedReminder[] };

    if (activeFilter === 'recent') {
        filteredReminders.forEach((r) => {
            const reminderDate = startOfDay(new Date(r.reminder_time));
            if (isSameDay(reminderDate, today)) recentGroups.today.push(r);
            else if (isSameDay(reminderDate, tomorrow)) recentGroups.tomorrow.push(r);
            else if (isSameDay(reminderDate, dayAfter)) recentGroups.dayAfter.push(r);
        });
    } else if (activeFilter === 'overdue') {
        filteredReminders.forEach((r) => {
            const reminderDate = startOfDay(new Date(r.reminder_time));
            if (isSameDay(reminderDate, today)) overdueGroups.today.push(r);
            else if (isSameDay(reminderDate, yesterday)) overdueGroups.yesterday.push(r);
            else if (isSameDay(reminderDate, dayBeforeYesterday)) overdueGroups.dayBeforeYesterday.push(r);
            else overdueGroups.older.push(r);
        });
    }

    return { groupedRecentReminders: recentGroups, groupedOverdueReminders: overdueGroups };
}, [filteredReminders, activeFilter]);


  // --- 핸들러 함수들 ---

  const handleToggleComplete = async (reminderId: string, completed: boolean) => {
    onToggleComplete(reminderId, completed); // DB 상태 변경 요청

    if (completed) {
      await cancelReminderNotifications(reminderId); // OS 알림 취소
    }
    // 다시 활성화 시 알림 재설정은 handleToggleEnable에서 처리
  };

  const handleToggleEnable = async (reminderId: string, enabled: boolean) => {
    const reminder = reminders.find((r) => r.id === reminderId);
    if (!reminder || !user?.id) return;

    onToggleEnable(reminderId, enabled); // DB 상태 변경 요청

    // OS 알림 스케줄링/취소
    try {
      if (enabled && globalNotifications) {
        await createReminderNotifications(
          user.id,
          reminder.noteId,
          reminder.id,
          reminder.reminder_text,
          reminder.noteTitle,
          new Date(reminder.reminder_time),
        );
      } else {
        await cancelReminderNotifications(reminder.id);
      }
    } catch (error) {
      console.error('알림 설정 오류:', error);
    }
  };

  const handleDelete = async (reminderId: string) => {
    onDelete(reminderId); // DB 상태 변경 요청
    await deleteReminderNotifications(reminderId); // OS 알림 삭제
  };

  const handleDeleteAllCompleted = async () => {
    const completedIds = reminders.filter((r) => r.completed).map((r) => r.id);
    for (const id of completedIds) {
      await handleDelete(id);
    }
  };
  
  // 전역 알림 토글 처리
  const handleGlobalNotificationsToggle = async (enabled: boolean) => {
    if (!user?.id) return;
    setGlobalNotifications(enabled);
    
    for (const reminder of reminders) {
        if(reminder.enabled && !reminder.completed) {
            if (enabled) {
                await createReminderNotifications(user.id, reminder.noteId, reminder.id, reminder.reminder_text, reminder.noteTitle, new Date(reminder.reminder_time));
            } else {
                await cancelReminderNotifications(reminder.id);
            }
        }
    }
  };


  // --- 렌더링 함수 ---

  const renderReminderGroup = (
    title: string,
    groupReminders: EnrichedReminder[],
    icon?: React.ReactNode,
  ) => {
    if (groupReminders.length === 0) return null;
    return (
      <div className="mb-6">
        <div className="flex items-center mb-3 px-1">
          {icon}
          <h3 className="text-sm font-medium ml-2 text-muted-foreground">{title}</h3>
          <Badge variant="secondary" className="ml-2 text-xs px-1.5 py-0.5">
            {groupReminders.length}
          </Badge>
        </div>
        <div className="space-y-2">
          {groupReminders.map((reminder) => renderReminderCard(reminder))}
        </div>
      </div>
    );
  };

  const renderReminderCard = (reminder: EnrichedReminder) => {
    const reminderTime = new Date(reminder.reminder_time);
    const isOverdue = !reminder.completed && reminderTime < new Date();

    return (
      <Card
        key={reminder.id}
        onClick={() => onOpenNote(reminder.noteId)}
        className={`group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 border-l-4 cursor-pointer ${
          isOverdue ? 'border-l-destructive' : reminder.completed ? 'border-l-green-500' : 'border-l-primary'
        } ${reminder.completed ? 'opacity-70 bg-muted/50' : ''}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-6 w-6 rounded-full flex-shrink-0 hover:bg-transparent"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleComplete(reminder.id, !reminder.completed);
              }}
            >
              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  reminder.completed ? 'border-green-500 bg-green-500' : 'border-border group-hover:border-primary'
              }`}>
                {reminder.completed && <CheckCircle2 className="h-3 w-3 text-white" />}
              </div>
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className={`font-medium text-base leading-snug ${reminder.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {reminder.reminder_text}
                </h3>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {!reminder.completed && (
                    <>
                      {reminder.enabled && globalNotifications && <Bell className="h-4 w-4 text-primary" />}
                      <Switch
                        checked={reminder.enabled && globalNotifications}
                        onCheckedChange={(checked) => handleToggleEnable(reminder.id, checked)}
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
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(reminder.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                <div className={`flex items-center ${isOverdue ? 'text-destructive font-medium' : ''}`}>
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  <span>{format(reminderTime, 'yyyy.MM.dd p')}</span>
                  {isOverdue && <Badge variant="destructive" className="ml-2 text-xs px-1.5 py-0.5 h-5">지연</Badge>}
                </div>
                <div className="flex items-center text-sm text-muted-foreground max-w-36 truncate" title={reminder.noteTitle}>
                  <span>📝</span>
                  <span className="ml-1.5 truncate">{reminder.noteTitle}</span>
                </div>
              </div>

              {!reminder.completed && reminder.noteContent && (
                  <p className="text-xs text-muted-foreground/80 truncate mt-1">
                    {reminder.noteContent}
                  </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`flex flex-col h-full bg-background text-foreground`}>
      <div className="border-b p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <CalendarClock className="h-5 w-5 mr-2 text-primary" />
            <h1 className="text-lg font-bold">리마인더</h1>
          </div>
          {activeFilter === 'completed' && filteredReminders.length > 0 && (
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleDeleteAllCompleted}>
              <Trash2 className="h-4 w-4 mr-1" />
              모두 삭제
            </Button>
          )}
        </div>
        <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overdue">지연</TabsTrigger>
            <TabsTrigger value="recent">최근</TabsTrigger>
            <TabsTrigger value="upcoming">예정</TabsTrigger>
            <TabsTrigger value="completed">완료</TabsTrigger>
          </TabsList>
        </Tabs>
        {activeFilter !== 'completed' && (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Label htmlFor="notifications" className="text-sm">전체 알림</Label>
              <Switch id="notifications" checked={globalNotifications} onCheckedChange={handleGlobalNotificationsToggle} className="scale-90" />
            </div>
            <Badge variant={globalNotifications ? 'default' : 'secondary'} className="text-xs px-2 py-0.5">
              {globalNotifications ? '켜짐' : '꺼짐'}
            </Badge>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 p-4">
        {filteredReminders.length > 0 ? (
          <div>
            {activeFilter === 'recent' && (
              <>
                {renderReminderGroup('오늘', groupedRecentReminders.today, <Clock className="h-4 w-4 text-primary" />)}
                {renderReminderGroup('내일', groupedRecentReminders.tomorrow, <Calendar className="h-4 w-4 text-green-600" />)}
                {renderReminderGroup('모레', groupedRecentReminders.dayAfter, <Calendar className="h-4 w-4 text-purple-600" />)}
              </>
            )}
            {activeFilter === 'overdue' && (
                 <>
                 {renderReminderGroup('오늘 (지연)', groupedOverdueReminders.today, <AlertCircle className="h-4 w-4 text-red-500" />)}
                 {renderReminderGroup('어제', groupedOverdueReminders.yesterday, <AlertCircle className="h-4 w-4 text-orange-500" />)}
                 {renderReminderGroup('엊그제', groupedOverdueReminders.dayBeforeYesterday, <AlertCircle className="h-4 w-4 text-yellow-500" />)}
                 {renderReminderGroup('그 이전', groupedOverdueReminders.older, <AlertCircle className="h-4 w-4 text-gray-500" />)}
               </>
            )}
            {activeFilter === 'upcoming' && renderReminderGroup('예정된 항목', filteredReminders, <Calendar className="h-4 w-4 text-muted-foreground" />)}
            {activeFilter === 'completed' && renderReminderGroup('완료된 항목', filteredReminders, <CheckCircle2 className="h-4 w-4 text-green-600" />)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 text-muted-foreground">
            <Bell className="h-12 w-12 mb-4" />
            <h3 className="text-base font-medium mb-2">
              {
                {
                  completed: '완료된 리마인더가 없습니다',
                  overdue: '기한이 지난 리마인더가 없습니다',
                  recent: '최근 리마인더가 없습니다',
                  upcoming: '예정된 리마인더가 없습니다',
                }[activeFilter]
              }
            </h3>
            <p className="text-sm">에디터에서 리마인더를 추가하면 여기에 표시됩니다.</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};