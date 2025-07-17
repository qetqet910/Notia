import { Skeleton } from '@/components/ui/skeleton';

export const CalendarLoader = () => (
  <div className="flex h-full">
    <div className="flex-1 p-4">
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px border-l border-t">
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={i}
            className="h-32 bg-background border-r border-b p-2 space-y-2"
          >
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
          </div>
        ))}
      </div>
    </div>
    <div className="w-80 border-l p-4 space-y-4">
      <Skeleton className="h-7 w-32" />
      <div className="space-y-3">
        <div className="p-3 border rounded-lg space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <div className="p-3 border rounded-lg space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  </div>
);
