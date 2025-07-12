import { Skeleton } from '@/components/ui/skeleton';

export const MarkdownPreviewLoader = () => {
  return (
    <div className="p-4 space-y-4">
      {/* 제목 스켈레톤 */}
      <Skeleton className="h-8 w-3/4" />

      {/* 본문 스켈레톤 */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>

      {/* 코드 블록 또는 이미지 스켈레톤 */}
      <Skeleton className="h-32 w-full" />

      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
};
