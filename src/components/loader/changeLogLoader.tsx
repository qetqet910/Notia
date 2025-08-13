import { Skeleton } from '@/components/ui/skeleton';

export const LandingPageLoader = () => {
  return (
    <div className="min-h-screen bg-white text-gray-800 overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Skeleton className="h-8 w-24" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-10 w-24 rounded-md" />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center px-6 lg:px-12">
        <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-transparent blur-3xl"></div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center w-full">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <Skeleton className="h-12 w-3/4 mb-4" />
            <Skeleton className="h-16 w-full mb-6" />
            <Skeleton className="h-8 w-1/2 mb-8" />
            <Skeleton className="h-12 w-48 rounded-lg" />
          </div>
          <div className="hidden md:flex items-center justify-center">
            <Skeleton className="w-[400px] h-[400px] rounded-full" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 dot-pattern">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-8 rounded-2xl h-full border bg-white">
                <div className="flex flex-col items-center">
                  <Skeleton className="w-16 h-16 rounded-full mb-6" />
                  <Skeleton className="h-6 w-3/4 mb-3" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};