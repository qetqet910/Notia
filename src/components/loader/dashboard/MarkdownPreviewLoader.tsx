import { Skeleton } from '@/components/ui/skeleton';

export const MarkdownPreviewLoader = () => {
  return (
    <div className="p-4 space-y-6 animate-in fade-in duration-500">
      {/* Title */}
      <Skeleton className="h-10 w-3/4 mb-6" />

      {/* Metadata Header Simulation (Tags/Reminders) */}
      <div className="flex gap-2 pb-4 border-b border-border/40">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      {/* Content Body */}
      <div className="space-y-3 pt-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[90%]" />
        <Skeleton className="h-4 w-[95%]" />
        <Skeleton className="h-4 w-[80%]" />
      </div>

      {/* Image/Code Block Simulation */}
      <Skeleton className="h-48 w-full rounded-lg my-4" />

      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[85%]" />
        <Skeleton className="h-4 w-[90%]" />
      </div>
    </div>
  );
};
