import React from 'react';
import { useGoalStats } from '@/hooks/useGoalStats';
import { CustomProgress } from '@/components/features/dashboard/myPage/CustomProgress';
import Target from 'lucide-react/dist/esm/icons/target';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';

export const GoalProgress = () => {
  const { weeklyNote, weeklyReminder } = useGoalStats();

  return (
    <div className="mt-6 p-3 bg-background rounded-lg border space-y-3">
      <div>
        <div className="text-xs text-right text-muted-foreground flex justify-between">
          <span className="flex mb-1">
            <Target className="h-3 w-3 mr-1.5" />
            주간 노트
          </span>
          <span className="font-bold text-primary flex">
            {weeklyNote.current} / {weeklyNote.goal} ⇣
          </span>
        </div>
        <CustomProgress value={weeklyNote.percentage} />
        <div className="text-xs text-right text-muted-foreground mt-3 flex justify-between">
          <span className="flex mb-1">
            <CheckCircle className="h-3 w-3 mr-1.5" />
            주간 리마인더
          </span>
          <span className="font-bold text-primary flex">
            {weeklyReminder.current} / {weeklyReminder.goal} ⇣
          </span>
        </div>
        <CustomProgress value={weeklyReminder.percentage} />
      </div>
    </div>
  );
};
