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

const FooterLoader = () => (
  <footer className="py-8 border-t">
    <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="flex gap-4 mt-4 md:mt-0">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-16" />
      </div>
    </div>
  </footer>
);

export const LandingPageLoader = () => (
  <div className="flex flex-col min-h-screen">
    <HeaderLoader />
    <main className="flex-1 container mx-auto p-6 space-y-12">
      <div className="text-center space-y-4 pt-16">
        <Skeleton className="h-12 w-3/4 mx-auto" />
        <Skeleton className="h-8 w-1/2 mx-auto" />
        <Skeleton className="h-12 w-48 mx-auto rounded-md mt-4" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    </main>
    <FooterLoader />
  </div>
);
