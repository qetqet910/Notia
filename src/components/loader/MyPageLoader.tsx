import { Skeleton } from '@/components/ui/skeleton';

const DashboardHeaderLoader = () => (
  <header className="flex justify-between items-center px-4 py-3 border-b flex-shrink-0 h-[61px]">
    <div className="flex items-center gap-2">
      <Skeleton className="h-9 w-9" />
      <Skeleton className="h-8 w-36" />
    </div>
    <Skeleton className="h-9 w-9 rounded-full" />
  </header>
);

export const MyPageLoader = () => (
  <div className="flex flex-col h-screen">
    <DashboardHeaderLoader />
    <main className="flex-1 container mx-auto p-6 max-w-4xl">
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="p-4 border rounded-lg space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-5 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </main>
  </div>
);
