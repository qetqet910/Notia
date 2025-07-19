import React, { useState, useMemo } from 'react';
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
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Note, EditorReminder } from '@/types'; // 제공해주신 타입 임포트

// 확장된 이벤트 타입 정의
type CalendarEvent = EditorReminder & {
  note: Note;
};

interface CalendarProps {
  notes: Note[];
  onOpenNote: (noteId: string) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ notes, onOpenNote }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const today = new Date();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  // --- 데이터 처리 최적화 ---
  const { eventsByDate, holidays } = useMemo(() => {
    // 1. 이벤트(리마인더)를 날짜별로 그룹화
    const eventMap = new Map<string, CalendarEvent[]>();
    notes.forEach((note) => {
      (note.reminders || []).forEach((reminder: any) => {
        const dateString = format(
          new Date(reminder.reminder_time),
          'yyyy-MM-dd',
        );
        const enrichedReminder: CalendarEvent = { ...reminder, note };

        if (!eventMap.has(dateString)) {
          eventMap.set(dateString, []);
        }
        eventMap.get(dateString)!.push(enrichedReminder);
      });
    });

    // 2. 공휴일 정보 계산 (연도가 바뀔 때만 재계산)
    const year = currentDate.getFullYear();
    const holidayMap = new Map<string, string>();
    // 고정 공휴일
    holidayMap.set(`${year}-01-01`, '신정');
    holidayMap.set(`${year}-03-01`, '삼일절');
    holidayMap.set(`${year}-05-05`, '어린이날');
    holidayMap.set(`${year}-06-06`, '현충일');
    holidayMap.set(`${year}-08-15`, '광복절');
    holidayMap.set(`${year}-10-03`, '개천절');
    holidayMap.set(`${year}-10-09`, '한글날');
    holidayMap.set(`${year}-12-25`, '크리스마스');
    // 2025년 기준 동적 공휴일 (예시)
    if (year === 2025) {
      holidayMap.set('2025-01-28', '설날 연휴');
      holidayMap.set('2025-01-29', '설날');
      holidayMap.set('2025-01-30', '설날 연휴');
      holidayMap.set('2025-05-05', '부처님 오신 날'); // 어린이날과 겹침
      holidayMap.set('2025-10-05', '추석 연휴');
      holidayMap.set('2025-10-06', '추석');
      holidayMap.set('2025-10-07', '추석 연휴');
    }

    return { eventsByDate: eventMap, holidays: holidayMap };
  }, [notes, currentDate.getFullYear()]);

  // --- 핸들러 함수 ---
  const goToPreviousMonth = () =>
    setCurrentDate((prev) => new Date(prev.setMonth(prev.getMonth() - 1)));
  const goToNextMonth = () =>
    setCurrentDate((prev) => new Date(prev.setMonth(prev.getMonth() + 1)));
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    // 이미 선택된 날짜를 다시 클릭하면 선택 해제, 아니면 새로운 날짜 선택
    setSelectedDate((prev) => (prev && isSameDay(prev, date) ? null : date));
  };

  // --- 렌더링 로직 ---
  const renderCalendar = () => {
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const cells = [];
    let day = calendarStart;

    while (day <= calendarEnd) {
      for (let i = 0; i < 7; i++) {
        const cellDate = day;
        const dateString = format(cellDate, 'yyyy-MM-dd');

        const isCurrentMonth = isSameMonth(cellDate, monthStart);
        const isTodayDate = isSameDay(cellDate, today);
        const isSelectedDate =
          selectedDate && isSameDay(cellDate, selectedDate);
        const dayOfWeek = getDay(cellDate);
        const holidayName = holidays.get(dateString);
        const dayEvents = eventsByDate.get(dateString) || [];

        cells.push(
          <div
            key={dateString}
            className={`h-32 p-1.5 border border-border cursor-pointer hover:bg-accent transition-colors flex flex-col ${
              !isCurrentMonth ? 'text-muted-foreground bg-muted/30' : ''
            } ${isSelectedDate ? 'bg-accent' : ''}`}
            onClick={() => handleDateClick(cellDate)}
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
              {dayEvents.slice(0, holidayName ? 1 : 2).map((event: any) => (
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
  };

  const selectedDateEvents = selectedDate
    ? eventsByDate.get(format(selectedDate, 'yyyy-MM-dd')) || []
    : [];

  return (
    <div className="flex h-full">
      <div className="flex-1 p-4 overflow-auto custom-scrollbar">
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
        {renderCalendar()}
      </div>

      <aside
        className={`border-l border-border bg-muted/30 transition-all duration-300 ease-in-out overflow-y-auto custom-scrollbar ${
          selectedDate ? 'w-80 opacity-100 p-4' : 'w-0 opacity-0'
        }`}
      >
        {selectedDate && (
          <div className="w-full">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold">
                {format(selectedDate, 'M월 d일')}
              </h3>
              {holidays.get(format(selectedDate, 'yyyy-MM-dd')) && (
                <Badge variant="destructive">
                  {holidays.get(format(selectedDate, 'yyyy-MM-dd'))}
                </Badge>
              )}
            </div>

            {selectedDateEvents.length > 0 ? (
              <div className="space-y-3">
                {selectedDateEvents.map((event: any) => (
                  <div
                    key={event.id}
                    className={`p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors ${
                      event.completed
                        ? 'bg-muted/50 text-muted-foreground'
                        : 'bg-background'
                    }`}
                    onClick={() => onOpenNote(event.note.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge
                        variant={event.completed ? 'secondary' : 'default'}
                      >
                        {event.completed ? '완료' : '대기'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(event.reminder_time), 'p', {
                          locale: ko,
                        })}
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
                      <span className="truncate">{event.note.title}</span>
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
        )}
      </aside>
    </div>
  );
};
