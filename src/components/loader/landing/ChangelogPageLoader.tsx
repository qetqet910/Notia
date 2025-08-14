import { Skeleton } from '@/components/ui/skeleton';

export const ChangelogPageLoader = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header Skeleton */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
        <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between items-center">
          <Skeleton className="h-8 w-24" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-10 w-24 rounded-md" />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 mt-16">
        {/* Page Title Skeleton */}
        <div className="text-center mb-8">
          <Skeleton className="h-10 w-48 mx-auto" />
          <Skeleton className="h-5 w-64 mx-auto mt-2" />
        </div>

        {/* Changelog Entries Skeleton */}
        <div className="space-y-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-md shadow-md p-6">
              {/* Version Skeleton */}
              <Skeleton className="h-6 w-32 mb-2" />
              {/* Date Skeleton */}
              <Skeleton className="h-4 w-24 mb-4" />
              
              {/* Features Skeleton */}
              <div className="mb-3">
                <Skeleton className="h-5 w-20 mb-2" />
                <div className="space-y-2 list-disc list-inside">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </div>

              {/* Fixes Skeleton */}
              <div>
                <Skeleton className="h-5 w-24 mb-2" />
                <div className="space-y-2 list-disc list-inside">
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
