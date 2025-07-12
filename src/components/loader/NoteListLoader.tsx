import { Skeleton } from "@/components/ui/skeleton";

export const NoteListLoader = () => {
  return (
    <div className="flex flex-col h-full">
      {/* 검색 바 스켈레톤 */}
      <div className="p-4 border-b">
        <Skeleton className="h-10 w-full" />
      </div>

      {/* 노트 아이템 스켈레톤 목록 */}
      <div className="flex-1 divide-y">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="p-4 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <div className="flex justify-between items-center pt-1">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};