// src/components/features/Timeline/TimelineItem.tsx
import React from 'react';
import { Card } from '../../../components/ui/card';
import { CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface TimelineItemProps {
  id: string;
  title: string;
  date: Date;
  content?: string;
  completed: boolean;
  onClick: (id: string) => void;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({
  id,
  title,
  date,
  content,
  completed,
  onClick
}) => {
  return (
    <div className="timeline-item flex gap-4 mb-6">
      <div className="timeline-indicator flex flex-col items-center">
        <div className={`timeline-dot rounded-full p-2 ${completed ? 'bg-green-100' : 'bg-blue-100'}`}>
          {completed ? 
            <CheckCircle className="h-4 w-4 text-green-500" /> : 
            <Clock className="h-4 w-4 text-blue-500" />
          }
        </div>
        <div className="timeline-line h-full w-px bg-muted" />
      </div>
      
      <div className="timeline-content flex-1">
        <div className="timeline-date text-sm text-muted-foreground mb-1">
          {format(date, 'PPP')}
        </div>
        
        <Card className="p-4" onClick={() => onClick(id)}>
          <h3 className={`font-medium ${completed ? 'line-through text-muted-foreground' : ''}`}>
            {title}
          </h3>
          
          {content && (
            <p className="text-sm text-muted-foreground mt-2">
              {content.substring(0, 120)}
              {content.length > 120 && '...'}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};