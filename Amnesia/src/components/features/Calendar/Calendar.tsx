import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';

interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  events: TimelineItem[];
}

export const Calendar: React.FC<CalendarProps> = ({ selectedDate, onDateSelect, events }) => {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const weeks = [];
  let week = [];

  days.forEach((day) => {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  });

  if (week.length > 0) {
    weeks.push(week);
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => onDateSelect(new Date(selectedDate.setMonth(selectedDate.getMonth() - 1)))}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold">
          {format(selectedDate, 'yyyy년 MM월', { locale: ko })}
        </h2>
        <button onClick={() => onDateSelect(new Date(selectedDate.setMonth(selectedDate.getMonth() + 1)))}>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['일', '월', '화', '수', '목', '금', '토'].map(day => (
          <div key={day} className="text-center text-sm font-medium py-2">
            {day}
          </div>
        ))}
        {weeks.flat().map((day, i) => {
          const dayEvents = events.filter(event => 
            format(new Date(event.startDate), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
          );
          
          return (
            <div
              key={i}
              className={`
                p-2 min-h-[80px] border rounded
                ${!isSameMonth(day, selectedDate) ? 'bg-gray-50 text-gray-400' : ''}
                ${isToday(day) ? 'bg-blue-50' : ''}
              `}
              onClick={() => onDateSelect(day)}
            >
              <div className="text-right text-sm">{format(day, 'd')}</div>
              {dayEvents.map(event => (
                <div
                  key={event.id}
                  className="text-xs p-1 mt-1 rounded bg-blue-100 truncate"
                  title={event.title}
                >
                  {event.title}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}; 