import React from 'react';
import { Check, Link } from 'lucide-react';
import type { TimelineItem as TimelineItemType } from '../../../types/timeline';

interface TimelineItemProps {
  item: TimelineItemType;
  onComplete: (id: number) => void;
  onProgressUpdate: (id: number, progress: number) => void;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({
  item,
  onComplete,
  onProgressUpdate,
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">{item.title}</h3>
        <div className="flex items-center gap-2">
          {item.dependencies && item.dependencies.length > 0 && (
            <Link className="w-4 h-4 text-gray-400" />
          )}
          <button
            onClick={() => onComplete(item.id)}
            className={`p-1 rounded ${
              item.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100'
            }`}
          >
            <Check className="w-4 h-4" />
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-3">{item.content}</p>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${item.progress}%` }}
            />
          </div>
        </div>
        <span className="text-sm text-gray-500">{item.progress}%</span>
      </div>
      <div className="text-xs text-gray-500 mt-2">
        {item.startDate} {item.endDate ? `~ ${item.endDate}` : ''}
      </div>
    </div>
  );
}; 