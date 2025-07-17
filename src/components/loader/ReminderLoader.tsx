import { Skeleton } from '@/components/ui/skeleton';

const ReminderCardLoader = () => (
  <div className="flex items-start gap-3 p-4 border rounded-lg">
    <Skeleton className="h-5 w-5 rounded-full mt-1" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-5 w-3/4" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      <Skeleton className="h-3 w-full" />
    </div>
  </div>
);

export const ReminderLoader = () => (
  <div className="p-4 h-full">
    <div className="flex justify-between items-center mb-4">
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-9 w-24" />
    </div>
    <div className="grid grid-cols-4 gap-2 mb-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="space-y-4">
      <ReminderCardLoader />
      <ReminderCardLoader />
      <ReminderCardLoader />
    </div>
  </div>
);
