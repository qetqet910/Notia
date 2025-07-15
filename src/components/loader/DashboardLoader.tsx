import { Skeleton } from '@/components/ui/skeleton';
import { NoteListLoader } from '@/components/loader/NoteListLoader';
import { Loader2 } from 'lucide-react';

const HeaderLoader = () => {
  return (
    <header className="flex justify-between items-center px-4 py-3 border-b flex-shrink-0 h-[61px]">
      <Skeleton className="h-8 w-36" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-24 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </header>
  );
};

const SidebarLoader = () => {
  return (
    <aside className="w-56 border-r p-4 flex flex-col justify-between h-full">
      {/* 상단 네비게이션 */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
      {/* 하단 태그 및 목표 */}
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
        </div>
      </div>
    </aside>
  );
};

const EmptyEditorLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <Skeleton className="h-5 w-64" />
      <Skeleton className="h-9 w-28 rounded-md" />
    </div>
  );
};

export const DashboardLoader = () => {
  return (
    <div className="flex flex-col h-screen">
      <HeaderLoader />
      <div className="flex flex-1 overflow-hidden">
        <SidebarLoader />
        <div className="w-1/3 border-r">
          <NoteListLoader />
        </div>
        <main className="flex-1">
          <EmptyEditorLoader />
        </main>
      </div>
    </div>
  );
};

export const MainSectionLoader = () => {
  return (
    <div className="flex flex-col h-screen justify-center items-center">
      <Loader2 className="h-48 w-48 animate-spin text-primary" />
    </div>
  );
};
