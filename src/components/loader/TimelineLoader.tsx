import { Skeleton } from '@/components/ui/skeleton';

export const TimelineLoader = () => (
  <div className="p-6 h-full">
    <div className="flex justify-between items-center mb-6">
      <Skeleton className="h-8 w-36" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
    <div className="grid grid-cols-3 gap-4 mb-6">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
    <div className="space-y-4">
      <Skeleton className="h-6 w-48" />
      <div className="ml-6 pl-4 border-l-2 space-y-4">
        <div className="p-4 border rounded-lg space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
        </div>
        <div className="p-4 border rounded-lg space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
    </div>
  </div>
);
