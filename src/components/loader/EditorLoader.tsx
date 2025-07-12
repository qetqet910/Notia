import { Skeleton } from '@/components/ui/skeleton';

export const EditorLoader = () => {
  return (
    <div className="p-6 space-y-8 animate-pulse">
      {/* 상단 버튼 스켈레톤 */}
      <div className="flex justify-end gap-2">
        <Skeleton className="h-9 w-20 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>

      {/* 제목 스켈레톤 */}
      <Skeleton className="h-8 w-1/3" />

      {/* 태그 섹션 스켈레톤 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-sm" />
          <Skeleton className="h-4 w-10" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>
      </div>

      {/* 리마인더 섹션 스켈레톤 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-sm" />
          <Skeleton className="h-4 w-14" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-12 flex-1 rounded-lg" />
          <Skeleton className="h-12 flex-1 rounded-lg" />
          <Skeleton className="h-12 flex-1 rounded-lg" />
        </div>
      </div>

      {/* 본문 스켈레톤 */}
      <div className="border-t pt-8 space-y-4">
        <Skeleton className="h-6 w-2/5" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <Skeleton className="h-32 w-full mt-4" />
      </div>
    </div>
  );
};
