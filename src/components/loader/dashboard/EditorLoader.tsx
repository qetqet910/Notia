import { Skeleton } from '@/components/ui/skeleton';

export const EditorLoader = () => {
  return (
    <div className="flex flex-col h-full bg-background animate-in fade-in duration-500">
      {/* Header Toolbar */}
      <div className="flex justify-between items-center p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-24" /> {/* "미리보기" text */}
          <Skeleton className="h-8 w-8 rounded-full" /> {/* Help Icon */}
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16 rounded-md" /> {/* Delete Button */}
          <Skeleton className="h-8 w-16 rounded-md" /> {/* Edit Button */}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Note Title */}
        <Skeleton className="h-10 w-1/2 mb-6 mt-2" />

        {/* Metadata Section (Tags & Reminders) */}
        <div className="border-y border-border/50 py-4 mb-6 space-y-4">
          {/* Tags Row */}
          <div className="flex items-center gap-3">
             <Skeleton className="h-4 w-4" /> {/* Tag Icon */}
             <div className="flex gap-2 overflow-hidden">
               <Skeleton className="h-6 w-16 rounded-full" />
               <Skeleton className="h-6 w-20 rounded-full" />
               <Skeleton className="h-6 w-14 rounded-full" />
             </div>
          </div>
          
          {/* Reminders Row */}
          <div className="flex items-center gap-3">
             <Skeleton className="h-4 w-4" /> {/* Calendar Icon */}
             <div className="flex gap-3 overflow-hidden w-full">
               <Skeleton className="h-10 w-48 rounded-lg flex-shrink-0" />
               <Skeleton className="h-10 w-40 rounded-lg flex-shrink-0" />
             </div>
          </div>
        </div>

        {/* Markdown Content Body */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="h-4 w-[95%]" />
          <Skeleton className="h-4 w-[80%]" />
          <Skeleton className="h-40 w-full rounded-lg my-4" /> {/* Image/Code Placeholder */}
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[85%]" />
        </div>
      </div>
    </div>
  );
};