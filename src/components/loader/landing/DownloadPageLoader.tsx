import { Skeleton } from '@/components/ui/skeleton';

export const DownloadPageLoader = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <Skeleton className="h-8 w-24" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-10 w-24 rounded-md" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-32 pb-16 sm:pt-40 sm:pb-24">
        {/* Installation Guide Skeleton */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-3/4 sm:w-1/2 mx-auto mb-4" />
            <Skeleton className="h-5 w-full max-w-xl mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="relative flex flex-col items-center text-center"
              >
                <Skeleton className="w-12 h-12 rounded-full" />
                <Skeleton className="h-6 w-24 mt-4 mb-2" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
        </section>

        {/* Tabs Skeleton */}
        <div className="w-full">
          <div className="grid w-full grid-cols-2 md:grid-cols-4 h-10 gap-2 mb-6">
            <Skeleton className="h-full w-full" />
            <Skeleton className="h-full w-full" />
            <Skeleton className="h-full w-full" />
            <Skeleton className="h-full w-full" />
          </div>

          <div className="rounded-xl border bg-card text-card-foreground shadow p-6 sm:p-8">
            <div className="flex flex-col items-center text-center">
              <Skeleton className="w-10 h-10 rounded-full mb-4" />
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-5 w-full max-w-md mb-6" />

              <div className="flex flex-wrap justify-center gap-3 mb-6">
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-6 w-32" />
              </div>

              <div className="space-y-3 mb-8 w-full max-w-xs">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-5/6" />
                <Skeleton className="h-5 w-full" />
              </div>

              <Skeleton className="h-12 w-full max-w-xs" />
            </div>
          </div>
        </div>

        {/* Core Features Skeleton */}
        <section className="mt-24">
          <div className="text-center mb-12">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-5 w-64 mx-auto mt-2" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <Skeleton className="w-10 h-10 rounded-full" />
                <Skeleton className="h-6 w-32 mt-4 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6 mt-2" />
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default DownloadPageLoader;
