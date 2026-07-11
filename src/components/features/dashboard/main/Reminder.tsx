import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { format, isSameDay, addDays, startOfDay, subDays } from 'date-fns';
import Bell from 'lucide-react/dist/esm/icons/bell';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import CalendarClock from 'lucide-react/dist/esm/icons/calendar-clock';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

import { useAuthStore } from '@/stores/authStore';
import type { EnrichedReminder } from '@/utils/deriveAllReminders';

interface ReminderViewProps {
  reminders: EnrichedReminder[];
  onToggleComplete: (reminderId: string, completed: boolean) => void;
  onToggleEnable: (reminderId: string, enabled: boolean) => void;
  onDelete: (reminderId: string) => void;
  onOpenNote: (noteId: string) => void;
}

type FilterType = 'recent' | 'upcoming' | 'overdue' | 'completed';

export const ReminderView: React.FC<ReminderViewProps> = React.memo(
  ({ reminders, onToggleComplete, onToggleEnable, onDelete, onOpenNote }) => {
    const { user } = useAuthStore();
    const [activeFilter, setActiveFilter] = useState<FilterType>('recent');
    const [globalNotifications, setGlobalNotifications] = useState(true);

    useEffect(() => {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          setGlobalNotifications(permission === 'granted');
        });
      } else {
        setGlobalNotifications(Notification.permission === 'granted');
      }
    }, []);

    const filteredReminders = useMemo(() => {
      const now = new Date();
      const today = startOfDay(now);
      const threeDaysLater = startOfDay(addDays(now, 3));

      const filtered = reminders.filter((reminder) => {
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

      return filtered.sort(
        (a, b) =>
          new Date(a.reminder_time).getTime() -
          new Date(b.reminder_time).getTime(),
      );
    }, [reminders, activeFilter]);

    const groupedReminders = useMemo(() => {
      const groups: Record<string, EnrichedReminder[]> = {};
      if (activeFilter === 'recent') {
        groups.today = [];
        groups.tomorrow = [];
        groups.dayAfter = [];
        const today = startOfDay(new Date());
        const tomorrow = startOfDay(addDays(new Date(), 1));
        const dayAfter = startOfDay(addDays(new Date(), 2));
        filteredReminders.forEach((r) => {
          const reminderDate = startOfDay(new Date(r.reminder_time));
          if (isSameDay(reminderDate, today)) groups.today.push(r);
          else if (isSameDay(reminderDate, tomorrow)) groups.tomorrow.push(r);
          else if (isSameDay(reminderDate, dayAfter)) groups.dayAfter.push(r);
        });
      } else if (activeFilter === 'overdue') {
        groups.today = [];
        groups.yesterday = [];
        groups.dayBeforeYesterday = [];
        groups.older = [];
        const today = startOfDay(new Date());
        const yesterday = startOfDay(subDays(new Date(), 1));
        const dayBeforeYesterday = startOfDay(subDays(new Date(), 2));
        filteredReminders.forEach((r) => {
          const reminderDate = startOfDay(new Date(r.reminder_time));
          if (isSameDay(reminderDate, today)) groups.today.push(r);
          else if (isSameDay(reminderDate, yesterday)) groups.yesterday.push(r);
          else if (isSameDay(reminderDate, dayBeforeYesterday))
            groups.dayBeforeYesterday.push(r);
          else groups.older.push(r);
        });
      }
      return groups;
    }, [filteredReminders, activeFilter]);

    const handleToggleComplete = useCallback(
      (reminderId: string, completed: boolean) => {
        onToggleComplete(reminderId, completed);
      },
      [onToggleComplete],
    );

    const handleToggleEnable = useCallback(
      (reminderId: string, enabled: boolean) => {
        onToggleEnable(reminderId, enabled);
      },
      [onToggleEnable],
    );

    const handleDelete = useCallback(
      (reminderId: string) => {
        onDelete(reminderId);
      },
      [onDelete],
    );

    const handleDeleteAllCompleted = useCallback(async () => {
      const completedIds = reminders
        .filter((r) => r.completed)
        .map((r) => r.id);
      await Promise.all(completedIds.map((id) => handleDelete(id)));
    }, [reminders, handleDelete]);

    const handleGlobalNotificationsToggle = useCallback(
      (enabled: boolean) => {
        if (!user?.id) return;
        setGlobalNotifications(enabled);

        // 완료되지 않은 모든 리마인더의 enabled 플래그를 일괄 갱신한다.
        // 실제 알림 스케줄링은 이 플래그를 기준으로 처리되므로 여기서
        // 별도의 알림 생성/취소를 호출할 필요는 없다.
        reminders
          .filter((r) => !r.completed)
          .forEach((reminder) => onToggleEnable(reminder.id, enabled));
      },
      [user, reminders, onToggleEnable],
    );

    return (
      <div className="flex flex-col h-full bg-background text-foreground">
        <div className="border-b p-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <CalendarClock className="h-5 w-5 mr-2 text-primary" />
              <h1 className="text-lg font-bold">리마인더</h1>
            </div>
            {activeFilter === 'completed' && filteredReminders.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleDeleteAllCompleted}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                모두 삭제
              </Button>
            )}
          </div>
          <Tabs
            value={activeFilter}
            onValueChange={(v) => setActiveFilter(v as FilterType)}
            className="w-full"
          >
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

        <ScrollArea className="flex-1 p-4">
          {filteredReminders.length > 0 ? (
            <div>
              {activeFilter === 'recent' && (
                <>
                  <ReminderGroup
                    title="오늘"
                    reminders={groupedReminders.today}
                    icon={<Clock className="h-4 w-4 text-primary" />}
                    onOpenNote={onOpenNote}
                    onToggleComplete={handleToggleComplete}
                    onToggleEnable={handleToggleEnable}
                    onDelete={handleDelete}
                    globalNotifications={globalNotifications}
                  />
                  <ReminderGroup
                    title="내일"
                    reminders={groupedReminders.tomorrow}
                    icon={<Calendar className="h-4 w-4 text-green-600" />}
                    onOpenNote={onOpenNote}
                    onToggleComplete={handleToggleComplete}
                    onToggleEnable={handleToggleEnable}
                    onDelete={handleDelete}
                    globalNotifications={globalNotifications}
                  />
                  <ReminderGroup
                    title="모레"
                    reminders={groupedReminders.dayAfter}
                    icon={<Calendar className="h-4 w-4 text-purple-600" />}
                    onOpenNote={onOpenNote}
                    onToggleComplete={handleToggleComplete}
                    onToggleEnable={handleToggleEnable}
                    onDelete={handleDelete}
                    globalNotifications={globalNotifications}
                  />
                </>
              )}
              {activeFilter === 'overdue' && (
                <>
                  <ReminderGroup
                    title="오늘 (지연)"
                    reminders={groupedReminders.today}
                    icon={<AlertCircle className="h-4 w-4 text-red-500" />}
                    onOpenNote={onOpenNote}
                    onToggleComplete={handleToggleComplete}
                    onToggleEnable={handleToggleEnable}
                    onDelete={handleDelete}
                    globalNotifications={globalNotifications}
                  />
                  <ReminderGroup
                    title="어제"
                    reminders={groupedReminders.yesterday}
                    icon={<AlertCircle className="h-4 w-4 text-orange-500" />}
                    onOpenNote={onOpenNote}
                    onToggleComplete={handleToggleComplete}
                    onToggleEnable={handleToggleEnable}
                    onDelete={handleDelete}
                    globalNotifications={globalNotifications}
                  />
                  <ReminderGroup
                    title="엊그제"
                    reminders={groupedReminders.dayBeforeYesterday}
                    icon={<AlertCircle className="h-4 w-4 text-yellow-500" />}
                    onOpenNote={onOpenNote}
                    onToggleComplete={handleToggleComplete}
                    onToggleEnable={handleToggleEnable}
                    onDelete={handleDelete}
                    globalNotifications={globalNotifications}
                  />
                  <ReminderGroup
                    title="그 이전"
                    reminders={groupedReminders.older}
                    icon={<AlertCircle className="h-4 w-4 text-gray-500" />}
                    onOpenNote={onOpenNote}
                    onToggleComplete={handleToggleComplete}
                    onToggleEnable={handleToggleEnable}
                    onDelete={handleDelete}
                    globalNotifications={globalNotifications}
                  />
                </>
              )}
              {activeFilter === 'upcoming' && (
                <ReminderGroup
                  title="예정된 항목"
                  reminders={filteredReminders}
                  icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
                  onOpenNote={onOpenNote}
                  onToggleComplete={handleToggleComplete}
                  onToggleEnable={handleToggleEnable}
                  onDelete={handleDelete}
                  globalNotifications={globalNotifications}
                />
              )}
              {activeFilter === 'completed' && (
                <ReminderGroup
                  title="완료된 항목"
                  reminders={filteredReminders}
                  icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
                  onOpenNote={onOpenNote}
                  onToggleComplete={handleToggleComplete}
                  onToggleEnable={handleToggleEnable}
                  onDelete={handleDelete}
                  globalNotifications={globalNotifications}
                />
              )}
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
              <p className="text-sm">
                에디터에서 리마인더를 추가하면 여기에 표시됩니다.
              </p>
            </div>
          )}
        </ScrollArea>
      </div>
    );
  },
);
ReminderView.displayName = 'ReminderView';

const ReminderGroup = React.memo<{
  title: string;
  reminders: EnrichedReminder[];
  icon?: React.ReactNode;
  onOpenNote: (noteId: string) => void;
  onToggleComplete: (reminderId: string, completed: boolean) => void;
  onToggleEnable: (reminderId: string, enabled: boolean) => void;
  onDelete: (reminderId: string) => void;
  globalNotifications: boolean;
}>(({ title, reminders, icon, ...props }) => {
  if (reminders.length === 0) return null;
  return (
    <div className="mb-6">
      <div className="flex items-center mb-3 px-1">
        {icon}
        <h3 className="text-sm font-medium ml-2 text-muted-foreground">
          {title}
        </h3>
        <Badge variant="secondary" className="ml-2 text-xs px-1.5 py-0.5">
          {reminders.length}
        </Badge>
      </div>
      <div className="space-y-2">
        {reminders.map((reminder) => (
          <ReminderCard key={reminder.id} reminder={reminder} {...props} />
        ))}
      </div>
    </div>
  );
});
ReminderGroup.displayName = 'ReminderGroup';

const ReminderCard = React.memo<{
  reminder: EnrichedReminder;
  onOpenNote: (noteId: string) => void;
  onToggleComplete: (reminderId: string, completed: boolean) => void;
  onToggleEnable: (reminderId: string, enabled: boolean) => void;
  onDelete: (reminderId: string) => void;
  globalNotifications: boolean;
}>(
  ({
    reminder,
    onOpenNote,
    onToggleComplete,
    onToggleEnable,
    onDelete,
    globalNotifications,
  }) => {
    const reminderTime = reminder.reminder_time
      ? new Date(reminder.reminder_time)
      : null;
    const isValidDate = reminderTime && !isNaN(reminderTime.getTime());
    const isOverdue =
      isValidDate && !reminder.completed && reminderTime < new Date();

    const handleCardClick = useCallback(
      () => onOpenNote(reminder.noteId),
      [onOpenNote, reminder.noteId],
    );
    const handleToggleCompleteClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleComplete(reminder.id, !reminder.completed);
      },
      [onToggleComplete, reminder.id, reminder.completed],
    );
    const handleToggleEnableClick = useCallback(
      (e: React.MouseEvent) => e.stopPropagation(),
      [],
    );
    const handleDeleteClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(reminder.id);
      },
      [onDelete, reminder.id],
    );

    const formattedTime = isValidDate
      ? format(reminderTime, 'yyyy.MM.dd p')
      : '시간 정보 없음';

    return (
      <Card
        onClick={handleCardClick}
        className={`group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 border-l-4 cursor-pointer ${
          isOverdue
            ? 'border-l-destructive'
            : reminder.completed
            ? 'border-l-green-500'
            : 'border-l-primary'
        } ${reminder.completed ? 'opacity-70 bg-muted/50' : ''}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-6 w-6 rounded-full flex-shrink-0 hover:bg-transparent"
              onClick={handleToggleCompleteClick}
            >
              <div
                className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  reminder.completed
                    ? 'border-green-500 bg-green-500'
                    : 'border-border group-hover:border-primary'
                }`}
              >
                {reminder.completed && (
                  <CheckCircle2 className="h-3 w-3 text-white" />
                )}
              </div>
            </Button>
            <div className="flex-1 min-w-0 overflow-hidden grid grid-cols-[minmax(0,1fr)]">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3
                  className={`font-medium text-base leading-snug truncate ${
                    reminder.completed
                      ? 'line-through text-muted-foreground'
                      : 'text-foreground'
                  }`}
                  title={reminder.reminder_text}
                >
                  {reminder.reminder_text}
                </h3>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {!reminder.completed && (
                    <>
                      {reminder.enabled && globalNotifications && (
                        <Bell className="h-4 w-4 text-primary" />
                      )}
                      <Switch
                        checked={reminder.enabled && globalNotifications}
                        onCheckedChange={(checked) =>
                          onToggleEnable(reminder.id, checked)
                        }
                        disabled={!globalNotifications}
                        className="scale-90"
                        onClick={handleToggleEnableClick}
                      />
                    </>
                  )}
                  {reminder.completed && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={handleDeleteClick}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                <div
                  className={`flex items-center ${
                    isOverdue ? 'text-destructive font-medium' : ''
                  }`}
                >
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  <span>{formattedTime}</span>
                  {isOverdue && (
                    <Badge
                      variant="destructive"
                      className="ml-2 text-xs px-1.5 py-0.5 h-5"
                    >
                      지연
                    </Badge>
                  )}
                </div>
                <div
                  className="flex items-center text-sm text-muted-foreground truncate"
                  title={reminder.noteTitle}
                >
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
  },
);
ReminderCard.displayName = 'ReminderCard';
