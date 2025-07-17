import { Skeleton } from '@/components/ui/skeleton';

const HeaderLoader = () => (
  <header className="flex justify-between items-center px-4 py-3 border-b flex-shrink-0 h-[61px]">
    <Skeleton className="h-8 w-36" />
    <div className="flex items-center gap-4">
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-9 w-24 rounded-md" />
    </div>
  </header>
);

export const NotFoundPageLoader = () => (
  <div className="flex flex-col min-h-screen">
    <HeaderLoader />
    <main className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
      <Skeleton className="h-16 w-48" />
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-12 w-32 rounded-md" />
    </main>
  </div>
);
