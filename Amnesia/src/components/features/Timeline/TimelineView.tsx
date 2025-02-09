import React, { useState } from 'react';
import { Calendar } from '../Calendar/Calendar';
import { TimelineItem } from './TimelineItem';
import type { TimelineViewType, TimelineItem as TimelineItemType } from '../../../types/timeline';

export const TimelineView: React.FC = () => {
  const [viewType, setViewType] = useState<TimelineViewType>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [items, setItems] = useState<TimelineItemType[]>([]);

  const handleComplete = (id: number) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const handleProgressUpdate = (id: number, progress: number) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, progress } : item
    ));
  };

  const viewOptions: TimelineViewType[] = ['day', 'week', 'month', 'year'];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-x-2">
          {viewOptions.map(option => (
            <button
              key={option}
              onClick={() => setViewType(option)}
              className={`px-4 py-2 rounded ${
                viewType === option
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <Calendar
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        events={items}
      />

      <div className="space-y-4">
        {items.map(item => (
          <TimelineItem
            key={item.id}
            item={item}
            onComplete={handleComplete}
            onProgressUpdate={handleProgressUpdate}
          />
        ))}
      </div>
    </div>
  );
}; 