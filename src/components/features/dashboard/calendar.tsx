import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Calendar = ({ reminders, notes, onOpenNote }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const today = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // 월의 첫날과 마지막날 계산
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // 이전 달 마지막 몇 일 계산
  const lastDayOfPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const monthNames = [
    '1월',
    '2월',
    '3월',
    '4월',
    '5월',
    '6월',
    '7월',
    '8월',
    '9월',
    '10월',
    '11월',
    '12월',
  ];

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  // 한국 공휴일 데이터
  const getKoreanHolidays = (year) => {
    const holidays = new Map();

    // 고정 공휴일
    holidays.set(`${year}-01-01`, '신정');
    holidays.set(`${year}-03-01`, '삼일절');
    holidays.set(`${year}-05-05`, '어린이날');
    holidays.set(`${year}-06-06`, '현충일');
    holidays.set(`${year}-08-15`, '광복절');
    holidays.set(`${year}-10-03`, '개천절');
    holidays.set(`${year}-10-09`, '한글날');
    holidays.set(`${year}-12-25`, '크리스마스');

    // 2025년 기준 음력 공휴일 (실제로는 동적 계산 필요)
    if (year === 2025) {
      holidays.set('2025-01-28', '설날 전날');
      holidays.set('2025-01-29', '설날');
      holidays.set('2025-01-30', '설날 다음날');
      holidays.set('2025-05-05', '부처님 오신 날');
      holidays.set('2025-10-05', '추석 전날');
      holidays.set('2025-10-06', '추석');
      holidays.set('2025-10-07', '추석 다음날');
    }

    return holidays;
  };

  const holidays = getKoreanHolidays(currentYear);

  // 날짜가 공휴일인지 확인
  const isHoliday = (date) => {
    const dateStr = `${date.getFullYear()}-${String(
      date.getMonth() + 1,
    ).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return holidays.has(dateStr);
  };

  // 공휴일 이름 가져오기
  const getHolidayName = (date) => {
    const dateStr = `${date.getFullYear()}-${String(
      date.getMonth() + 1,
    ).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return holidays.get(dateStr);
  };

  // 날짜별 리마인더 그룹화
  const getRemindersByDate = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    return reminders.filter((reminder) => {
      const reminderDate = new Date(reminder.reminder_time);
      return (
        reminderDate.getFullYear() === year &&
        reminderDate.getMonth() === month &&
        reminderDate.getDate() === day
      );
    });
  };

  // 선택된 날짜의 리마인더들
  const selectedDateReminders = selectedDate
    ? getRemindersByDate(selectedDate)
    : [];

  // 이전/다음 달로 이동
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // 오늘로 이동
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // 캘린더 셀 생성 (5줄)
  const renderCalendarCells = () => {
    const cells = [];

    // 이전 달의 마지막 며칠
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = lastDayOfPrevMonth - i;
      const dayOfWeek = (startingDayOfWeek - 1 - i + 7) % 7;

      cells.push(
        <div
          key={`prev-${day}`}
          className="h-24 p-1 text-muted-foreground bg-muted/30"
        >
          <div
            className={`text-sm ${
              dayOfWeek === 0
                ? 'text-red-400'
                : dayOfWeek === 6
                ? 'text-blue-400'
                : ''
            }`}
          >
            {day}
          </div>
        </div>,
      );
    }

    // 현재 달
    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(currentYear, currentMonth, day);
      const dayOfWeek = cellDate.getDay();
      const isToday = cellDate.toDateString() === today.toDateString();
      const isSelected =
        selectedDate && cellDate.toDateString() === selectedDate.toDateString();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHolidayDate = isHoliday(cellDate);
      const holidayName = getHolidayName(cellDate);
      const dayReminders = getRemindersByDate(cellDate);

      cells.push(
        <div
          key={day}
          className={`h-32 p-1 border border-border cursor-pointer hover:bg-accent transition-colors ${
            isToday ? 'bg-primary/10 border-primary' : ''
          } ${isSelected ? 'bg-accent' : ''}`}
          onClick={() =>
            setSelectedDate(
              selectedDate &&
                cellDate.toDateString() === selectedDate.toDateString()
                ? null
                : cellDate,
            )
          }
        >
          <div
            className={`text-sm font-medium ${
              isToday
                ? 'text-primary'
                : dayOfWeek === 0 || isHolidayDate
                ? 'text-red-500'
                : dayOfWeek === 6
                ? 'text-blue-500'
                : ''
            }`}
          >
            {day}
          </div>

          {/* 공휴일 표시 */}
          {isHolidayDate && (
            <div
              className="text-xs text-red-500 font-medium truncate"
              title={holidayName}
            >
              {holidayName.length > 6
                ? `${holidayName.substring(0, 6)}...`
                : holidayName}
            </div>
          )}

          <div className="mt-1 space-y-1">
            {dayReminders.slice(0, isHolidayDate ? 1 : 2).map((reminder) => (
              <div
                key={reminder.id}
                className={`text-xs p-1 rounded truncate ${
                  reminder.completed
                    ? 'bg-muted text-muted-foreground line-through'
                    : 'bg-primary/20 text-primary'
                }`}
                title={reminder.reminder_text}
              >
                <Clock className="w-3 h-3 inline mr-1" />
                {reminder.reminder_text.length > 15
                  ? `${reminder.reminder_text.substring(0, 15)}...`
                  : reminder.reminder_text}
              </div>
            ))}
            {dayReminders.length > (isHolidayDate ? 1 : 2) && (
              <div className="text-xs text-muted-foreground">
                +{dayReminders.length - (isHolidayDate ? 1 : 2)}개 더
              </div>
            )}
          </div>
        </div>,
      );
    }

    // 다음 달의 첫 며칠 (5줄로 제한)
    const totalCells = cells.length;
    const remainingCells = 35 - totalCells;
    for (let day = 1; day <= remainingCells; day++) {
      const nextMonthDate = new Date(currentYear, currentMonth + 1, day);
      const dayOfWeek = nextMonthDate.getDay();

      cells.push(
        <div
          key={`next-${day}`}
          className="h-24 p-1 text-muted-foreground bg-muted/30"
        >
          <div
            className={`text-sm ${
              dayOfWeek === 0
                ? 'text-red-400'
                : dayOfWeek === 6
                ? 'text-blue-400'
                : ''
            }`}
          >
            {day}
          </div>
        </div>,
      );
    }

    return cells.slice(0, 35);
  };

  return (
    <div className="flex h-full">
      {/* 캘린더 영역 */}
      <div className="flex-1 p-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between mt-4 mb-4 max-w-[1300px] mx-auto">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold">
              {currentYear}년 {monthNames[currentMonth]}
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

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 mb-2 max-w-[1300px] mx-auto">
          {dayNames.map((day, index) => (
            <div
              key={day}
              className={`p-2 text-center font-medium ${
                index === 0
                  ? 'text-red-500'
                  : index === 6
                  ? 'text-blue-500'
                  : 'text-muted-foreground'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 캘린더 그리드 */}
        <div className="grid grid-cols-7 border border-border max-w-[1300px] mx-auto">
          {renderCalendarCells()}
        </div>
      </div>

      {/* 사이드바 - 선택된 날짜의 상세 정보 */}
      <div
        className={`border-l border-border bg-muted/30 transition-all duration-300 ease-in-out overflow-x-hidden overflow-y-scroll custom-scrollbar ${
          selectedDate ? 'w-80 opacity-100' : 'w-0 opacity-0'
        }`}
      >
        {selectedDate && (
          <div className="p-4 w-80">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold">
                {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일
              </h3>
              {isHoliday(selectedDate) && (
                <Badge variant="destructive" className="text-xs">
                  {getHolidayName(selectedDate)}
                </Badge>
              )}
            </div>

            {selectedDateReminders.length > 0 ? (
              <div className="space-y-3">
                {selectedDateReminders.map((reminder) => {
                  const note = notes.find((n) => n.id === reminder.note_id);

                  return (
                    <div
                      key={reminder.id}
                      className={`p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors ${
                        reminder.completed
                          ? 'bg-muted/50 text-muted-foreground'
                          : 'bg-background'
                      }`}
                      onClick={() => note && onOpenNote(note.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Badge
                          variant={reminder.completed ? 'secondary' : 'default'}
                        >
                          {reminder.completed ? '완료' : '대기중'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(reminder.reminder_time).toLocaleTimeString(
                            'ko-KR',
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                            },
                          )}
                        </span>
                      </div>

                      <p
                        className={`text-sm mb-2 ${
                          reminder.completed ? 'line-through' : ''
                        }`}
                      >
                        {reminder.reminder_text}
                      </p>

                      {note && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <FileText className="w-3 h-3 mr-1" />
                          <span className="truncate">{note.title}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                이 날짜에는 리마인더가 없습니다.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
