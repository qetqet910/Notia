import { Skeleton } from "@/components/ui/skeleton";

export const NoteListLoader = () => {
  return (
    <div className="flex flex-col h-full">
      {/* 검색 바 스켈레톤 */}
      <div className="p-3 border-b pt-4">
        <Skeleton className="h-10 w-full" />
      </div>

      {/* 노트 아이템 스켈레톤 목록 */}
      <div className="flex-1 divide-y border-b">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="p-4 space-y-2">
            <div className="grid grid-cols-[minmax(0,1fr)]">
              <Skeleton className="h-5 w-3/4 mb-1" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-2">
              <div className="flex gap-1">
                <Skeleton className="h-5 w-12 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};