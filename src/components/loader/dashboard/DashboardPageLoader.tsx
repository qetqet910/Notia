import { Skeleton } from '@/components/ui/skeleton';
import { NoteListLoader } from '@/components/loader/dashboard/NoteListLoader';

const HeaderLoader = () => {
  return (
    <header className="flex justify-between items-center px-4 py-3 border-b bg-background flex-shrink-0 h-[57px]">
      <Skeleton className="h-6 w-32" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </header>
  );
};

const SidebarLoader = () => {
  return (
    <aside className="hidden lg:flex w-64 border-r bg-background/50 flex-col justify-between h-full p-3">
      {/* Navigation */}
      <div className="space-y-1">
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
      
      {/* Bottom Section */}
      <div className="space-y-4 pt-4 border-t mt-auto">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16 ml-2" />
          <Skeleton className="h-8 w-full rounded-md" />
          <Skeleton className="h-8 w-full rounded-md" />
        </div>
        <div className="flex items-center gap-3 pt-2">
           <Skeleton className="h-8 w-8 rounded-full" />
           <div className="space-y-1 flex-1">
             <Skeleton className="h-3 w-20" />
             <Skeleton className="h-3 w-12" />
           </div>
        </div>
      </div>
    </aside>
  );
};

export const DashboardPageLoader = () => {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <HeaderLoader />
      <div className="flex flex-1 overflow-hidden">
        <SidebarLoader />
        <div className="w-full lg:w-80 border-r bg-background">
          <NoteListLoader />
        </div>
        <main className="hidden lg:flex flex-1 flex-col bg-muted/10 justify-center items-center">
          <Skeleton className="h-5 w-72" />
          <Skeleton className="h-8 w-20 mt-4" />
        </main>
      </div>
    </div>
  );
};