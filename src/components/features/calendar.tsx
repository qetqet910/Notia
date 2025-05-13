import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface Plan {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
}

interface CalendarProps {
  plans: Plan[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ plans, selectedDate, onSelectDate }) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());

  // Helper to get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Get first day of the month
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Get number of days in the month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Switch to previous month
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  // Switch to next month
  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Check if a date has plans
  const getDatePlans = (date: Date) => {
    return plans.filter(plan => {
      const planStart = new Date(plan.startDate);
      const planEnd = new Date(plan.endDate);
      return (
        date.getDate() === planStart.getDate() &&
        date.getMonth() === planStart.getMonth() &&
        date.getFullYear() === planStart.getFullYear()
      );
    });
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }).format(date);
  };

  // Render calendar
  const renderCalendar = () => {
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const days = [];

    // Day names
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    // Render day names
    const dayNamesRow = (
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayNames.map((day, index) => (
          <div
            key={`day-name-${index}`}
            className={`text-center text-sm font-medium p-2 ${
              index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : ''
            }`}
          >
            {day}
          </div>
        ))}
      </div>
    );

    let rows = [];
    let cells = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Cells for days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = date.toDateString() === selectedDate.toDateString();
      const dayPlans = getDatePlans(date);
      
      cells.push(
        <div
          key={`day-${day}`}
          className={`p-1 text-center cursor-pointer transition-colors min-h-16
            ${isToday ? 'bg-blue-100' : ''}
            ${isSelected ? 'bg-primary/20 font-bold' : ''}
            hover:bg-muted`}
          onClick={() => onSelectDate(date)}
        >
          <div className={`text-sm mb-1 ${
            date.getDay() === 0 ? 'text-red-500' : date.getDay() === 6 ? 'text-blue-500' : ''
          }`}>
            {day}
          </div>
          {dayPlans.length > 0 && (
            <div className="flex flex-col gap-1">
              {dayPlans.slice(0, 2).map(plan => (
                <div
                  key={plan.id}
                  className={`text-xs p-1 rounded truncate ${getPriorityColor(plan.priority)} text-white`}
                >
                  {plan.title}
                </div>
              ))}
              {dayPlans.length > 2 && (
                <div className="text-xs text-center">+ {dayPlans.length - 2} 더</div>
              )}
            </div>
          )}
        </div>
      );

      // Start new row after every 7 cells
      if ((firstDay + day) % 7 === 0) {
        rows.push(
          <div key={`row-${day}`} className="grid grid-cols-7 gap-1">
            {cells}
          </div>
        );
        cells = [];
      }
    }

    // Add remaining cells to last row
    if (cells.length > 0) {
      rows.push(
        <div key="last-row" className="grid grid-cols-7 gap-1">
          {cells}
        </div>
      );
    }

    return (
      <div>
        {dayNamesRow}
        <div className="space-y-1">{rows}</div>
      </div>
    );
  };

  // Get selected date plans
  const selectedDatePlans = getDatePlans(selectedDate);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">캘린더</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="font-medium">
              {`${currentYear}년 ${currentMonth + 1}월`}
            </div>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div>{renderCalendar()}</div>
      </div>
      <div className="p-4">
        <div className="flex items-center mb-2">
          <CalendarIcon className="h-4 w-4 mr-2" />
          <h3 className="font-medium">{formatDate(selectedDate)}</h3>
        </div>
        <ScrollArea className="h-48">
          {selectedDatePlans.length === 0 ? (
            <div className="text-center text-muted-foreground p-4">
              일정이 없습니다
            </div>
          ) : (
            <div className="space-y-2">
              {selectedDatePlans.map(plan => (
                <Card key={plan.id}>
                  <CardContent className="p-3">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${getPriorityColor(plan.priority)}`}></div>
                      <div className="font-medium">{plan.title}</div>
                    </div>
                    {plan.description && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {plan.description}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};