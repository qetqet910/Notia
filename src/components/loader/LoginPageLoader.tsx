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

export const LoginPageLoader = () => (
  <div className="flex flex-col min-h-screen">
    <HeaderLoader />
    <main className="flex-1 flex items-center justify-center">
      <div className="w-full max-w-sm p-8 space-y-6 border rounded-lg">
        <Skeleton className="h-8 w-32 mx-auto" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-12 w-full rounded-md" />
        <div className="flex justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
    </main>
    <FooterLoader />
  </div>
);
