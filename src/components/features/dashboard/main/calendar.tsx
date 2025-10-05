import React, { useState, useMemo, useCallback } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  getDate,
  getDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import Clock from 'lucide-react/dist/esm/icons/clock';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Reminder } from '@/types';

type EnrichedReminder = Reminder & {
  noteId: string;
  noteTitle: string;
};

type CalendarEvent = EnrichedReminder;

interface CalendarProps {
  reminders: EnrichedReminder[];
  onOpenNote: (noteId: string) => void;
}

export const Calendar: React.FC<CalendarProps> = React.memo(
  ({ reminders = [], onOpenNote }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const today = new Date();

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const eventsByDate = useMemo(() => {
      const eventMap = new Map<string, CalendarEvent[]>();
      reminders.forEach((reminder) => {
        if (!reminder.reminder_time) {
          return;
        }

        const reminderDate = new Date(reminder.reminder_time);

        if (isNaN(reminderDate.getTime())) {
          console.warn('Invalid reminder_time:', reminder.reminder_time);
          return;
        }

        const dateString = format(reminderDate, 'yyyy-MM-dd');
        const calendarEvent: CalendarEvent = reminder;

        if (!eventMap.has(dateString)) {
          eventMap.set(dateString, []);
        }
        eventMap.get(dateString)!.push(calendarEvent);
      });
      return eventMap;
    }, [reminders]);

    const holidays = useMemo(() => {
      const year = currentDate.getFullYear();
      const holidayMap = new Map<string, string>();
      holidayMap.set(`${year}-01-01`, '신정');
      holidayMap.set(`${year}-03-01`, '삼일절');
      holidayMap.set(`${year}-05-05`, '어린이날');
      holidayMap.set(`${year}-06-06`, '현충일');
      holidayMap.set(`${year}-08-15`, '광복절');
      holidayMap.set(`${year}-10-03`, '개천절');
      holidayMap.set(`${year}-10-09`, '한글날');
      holidayMap.set(`${year}-12-25`, '크리스마스');
      if (year === 2025) {
        holidayMap.set('2025-01-28', '설날 연휴');
        holidayMap.set('2025-01-29', '설날');
        holidayMap.set('2025-01-30', '설날 연휴');
        holidayMap.set('2025-05-05', '부처님 오신 날');
        holidayMap.set('2025-10-05', '추석 연휴');
        holidayMap.set('2025-10-06', '추석');
        holidayMap.set('2025-10-07', '추석 연휴');
      }
      return holidayMap;
    }, [currentDate]);

    const goToPreviousMonth = useCallback(
      () => setCurrentDate((prev) => subMonths(prev, 1)),
      [],
    );
    const goToNextMonth = useCallback(
      () => setCurrentDate((prev) => addMonths(prev, 1)),
      [],
    );
    const goToToday = useCallback(() => {
      setCurrentDate(new Date());
      setSelectedDate(new Date());
    }, []);

    const handleDateClick = useCallback((date: Date) => {
      setSelectedDate((prev) => (prev && isSameDay(prev, date) ? null : date));
    }, []);

    const selectedDateEvents = useMemo(
      () =>
        selectedDate
          ? eventsByDate.get(format(selectedDate, 'yyyy-MM-dd')) || []
          : [],
      [selectedDate, eventsByDate],
    );

    return (
      <div className="h-full">
        <div className="p-4 overflow-auto custom-scrollbar h-full">
          <div className="flex items-center justify-between mt-4 mb-4 max-w-[1200px] mx-auto">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold">
                {format(currentDate, 'yyyy년 MMMM', { locale: ko })}
              </h2>
              <Button variant="outline" size="sm" onClick={goToToday}>
                오늘
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={goToNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <CalendarGrid
            calendarStart={calendarStart}
            calendarEnd={calendarEnd}
            monthStart={monthStart}
            today={today}
            selectedDate={selectedDate}
            holidays={holidays}
            eventsByDate={eventsByDate}
            onDateClick={handleDateClick}
          />
        </div>
        <Sheet
          open={selectedDate !== null}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setSelectedDate(null);
            }
          }}
        >
          <SheetContent className="w-[350px] sm:w-[400px] overflow-y-auto custom-scrollbar">
            <EventSidebarContent
              selectedDate={selectedDate}
              events={selectedDateEvents}
              holidays={holidays}
              onOpenNote={onOpenNote}
            />
          </SheetContent>
        </Sheet>
      </div>
    );
  },
);
Calendar.displayName = 'Calendar';

const CalendarGrid = React.memo<{
  calendarStart: Date;
  calendarEnd: Date;
  monthStart: Date;
  today: Date;
  selectedDate: Date | null;
  holidays: Map<string, string>;
  eventsByDate: Map<string, CalendarEvent[]>;
  onDateClick: (date: Date) => void;
}>(
  ({
    calendarStart,
    calendarEnd,
    monthStart,
    today,
    selectedDate,
    holidays,
    eventsByDate,
    onDateClick,
  }) => {
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const cells = [];
    let day = calendarStart;

    while (day <= calendarEnd) {
      const cellDate = day;
      const dateString = format(cellDate, 'yyyy-MM-dd');
      const isCurrentMonth = isSameMonth(cellDate, monthStart);
      const isTodayDate = isSameDay(cellDate, today);
      const isSelectedDate = selectedDate && isSameDay(cellDate, selectedDate);
      const dayOfWeek = getDay(cellDate);
      const holidayName = holidays.get(dateString);
      const dayEvents = eventsByDate.get(dateString) || [];

      cells.push(
        <div
          key={dateString}
          className={`h-24 md:h-32 p-1.5 border border-border cursor-pointer hover:bg-accent transition-colors flex flex-col ${
            !isCurrentMonth ? 'text-muted-foreground bg-muted/30' : ''
          } ${isSelectedDate ? 'bg-accent' : ''}`}
          onClick={() => onDateClick(cellDate)}
        >
          <div
            className={`text-sm font-medium ${
              isTodayDate
                ? 'text-primary'
                : dayOfWeek === 0 || holidayName
                ? 'text-red-500'
                : dayOfWeek === 6
                ? 'text-blue-500'
                : ''
            }`}
          >
            {getDate(cellDate)}
          </div>
          {holidayName && isCurrentMonth && (
            <div
              className="text-xs text-red-500 font-medium truncate"
              title={holidayName}
            >
              {holidayName}
            </div>
          )}
          <div className="mt-1 space-y-1 overflow-hidden">
            {dayEvents.slice(0, holidayName ? 1 : 2).map((event) => (
              <div
                key={event.id}
                className={`text-xs p-1 rounded truncate ${
                  event.completed
                    ? 'bg-muted text-muted-foreground line-through'
                    : 'bg-primary/20 text-muted-foreground'
                }`}
                title={event.reminder_text}
              >
                <Clock className="w-3 h-3 inline mr-1" />
                {event.reminder_text}
              </div>
            ))}
            {dayEvents.length > (holidayName ? 1 : 2) && (
              <div className="text-xs text-muted-foreground mt-0.5">
                +{dayEvents.length - (holidayName ? 1 : 2)}개 더
              </div>
            )}
          </div>
        </div>,
      );
      day = addDays(day, 1);
    }

    return (
      <>
        <div className="grid grid-cols-7 mb-2 max-w-[1200px] mx-auto">
          {dayNames.map((dayName, index) => (
            <div
              key={dayName}
              className={`p-2 text-center font-medium ${
                index === 0
                  ? 'text-red-500'
                  : index === 6
                  ? 'text-blue-500'
                  : 'text-muted-foreground'
              }`}
            >
              {dayName}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 border border-border max-w-[1200px] mx-auto">
          {cells}
        </div>
      </>
    );
  },
);
CalendarGrid.displayName = 'CalendarGrid';

const EventSidebarContent = React.memo<{
  selectedDate: Date | null;
  events: CalendarEvent[];
  holidays: Map<string, string>;
  onOpenNote: (noteId: string) => void;
}>(({ selectedDate, events, holidays, onOpenNote }) => {
  if (!selectedDate) {
    return null;
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          {format(selectedDate, 'M월 d일')}
          {holidays.get(format(selectedDate, 'yyyy-MM-dd')) && (
            <Badge variant="destructive">
              {holidays.get(format(selectedDate, 'yyyy-MM-dd'))}
            </Badge>
          )}
        </SheetTitle>
        <SheetDescription>
          선택된 날짜의 리마인더 목록입니다. 클릭하여 해당 노트로 이동할 수
          있습니다.
        </SheetDescription>
      </SheetHeader>
      <div className="py-4">
        {events.length > 0 ? (
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                className={`p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors ${
                  event.completed
                    ? 'bg-muted/50 text-muted-foreground'
                    : 'bg-background'
                }`}
                onClick={() => onOpenNote(event.noteId)}
              >
                <div className="flex items-start justify-between mb-2">
                  <Badge variant={event.completed ? 'secondary' : 'default'}>
                    {event.completed ? '완료' : '대기'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(event.reminder_time), 'p', { locale: ko })}
                  </span>
                </div>
                <p
                  className={`text-sm mb-2 ${
                    event.completed ? 'line-through' : ''
                  }`}
                >
                  {event.reminder_text}
                </p>
                <div className="flex items-center text-xs text-muted-foreground">
                  <FileText className="w-3 h-3 mr-1" />
                  <span className="truncate">{event.noteTitle}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            이 날짜에는 이벤트가 없습니다.
          </p>
        )}
      </div>
    </>
  );
});
EventSidebarContent.displayName = 'EventSidebarContent';