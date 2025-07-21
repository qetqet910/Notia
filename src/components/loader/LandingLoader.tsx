import { Skeleton } from '@/components/ui/skeleton';

const IconSkeleton = () => (
  <svg
    className="h-6 w-6 text-gray-300"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="12" r="10" />
  </svg>
);

export const DonwloadPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Skeleton className="h-8 w-24" />
          <div className="flex items-center space-x-4">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Skeleton className="h-12 w-1/2 mx-auto mb-4" />
          <Skeleton className="h-6 w-3/4 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center"
            >
              <div className="mx-auto mb-6">
                <IconSkeleton />
              </div>
              <Skeleton className="h-8 w-3/4 mx-auto mb-4" />
              <Skeleton className="h-5 w-full mx-auto mb-6" />
              <Skeleton className="h-12 w-32 mx-auto" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};