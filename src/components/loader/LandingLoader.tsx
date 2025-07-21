import { Skeleton } from '@/components/ui/skeleton'; // Skeleton 컴포넌트 임포트

export const DonwloadPage = () => {
  return (
    <div className="">
      <main className="max-w-4xl mx-auto px-4 py-12 mt-12">
        <div className="text-center mb-12">
          <Skeleton className="w-full aspect-[21/9] rounded-lg shadow-lg mb-8" />
          <Skeleton className="h-12 w-1/2 mx-auto mb-4" />
          <Skeleton className="h-6 w-3/4 mx-auto" />
        </div>
        <div className="mb-12">
          <div className="w-full">
            <div className="h-10 items-center justify-center rounded-md p-1 grid w-full grid-cols-2 md:grid-cols-4">
              <div className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 h-9">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5">
                    {/* SVG icon remains as it has its own animate-pulse */}
                    <div
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-monitor w-5 h-5 animate-pulse"
                    >
                      <rect width="20" height="14" x="2" y="3" rx="2" />
                      <line x1="8" x2="16" y1="21" y2="21" />
                      <line x1="12" x2="12" y1="17" y2="21" />
                    </div>
                  </div>
                  {/* Text Placeholder */}
                  <Skeleton className="hidden md:inline h-5 w-12" />
                </div>
              </div>
              {/* Tab 2 */}
              <div className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 h-9">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5">
                    {/* SVG icon remains */}
                    <div
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-monitor w-5 h-5 animate-pulse"
                    >
                      <rect width="20" height="14" x="2" y="3" rx="2" />
                      <line x1="8" x2="16" y1="21" y2="21" />
                      <line x1="12" x2="12" y1="17" y2="21" />
                    </div>
                  </div>
                  {/* Text Placeholder */}
                  <Skeleton className="hidden md:inline h-5 w-12" />
                </div>
              </div>
              {/* Tab 3 */}
              <div className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 h-9">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5">
                    {/* SVG icon remains */}
                    <div
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-smartphone w-5 h-5 animate-pulse"
                    >
                      <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
                      <path d="M12 18h.01" />
                    </div>
                  </div>
                  {/* Text Placeholder */}
                  <Skeleton className="hidden md:inline h-5 w-12" />
                </div>
              </div>
              {/* Tab 4 */}
              <div className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 h-9">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5">
                    {/* SVG icon remains */}
                    <div
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-chrome w-5 h-5 animate-pulse"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="4" />
                      <line x1="21.17" x2="12" y1="8" y2="8" />
                      <line x1="3.95" x2="8.54" y1="6.06" y2="14" />
                      <line x1="10.88" x2="15.46" y1="21.94" y2="14" />
                    </div>
                  </div>
                  {/* Text Placeholder */}
                  <Skeleton className="hidden md:inline h-5 w-12" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className="rounded-xl border shadow">
            <div className="p-6">
              <div className="flex flex-col md:flex-row items-start gap-8">
                <div className="flex-1">
                  {/* Card Title Placeholder */}
                  <Skeleton className="h-8 w-1/2 mb-2" />
                  {/* Card Subtitle Placeholder */}
                  <Skeleton className="h-5 w-3/4 mb-4" />
                  {/* Tags Placeholder */}
                  <div className="flex flex-wrap gap-3 mb-6">
                    <Skeleton className="h-6 w-32 rounded-md" />
                    <Skeleton className="h-6 w-32 rounded-md" />
                    <Skeleton className="h-5 w-20 rounded-md" />
                  </div>
                  {/* List Items Placeholder */}
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-4 h-4 rounded-full flex-shrink-0" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-4 h-4 rounded-full flex-shrink-0" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-4 h-4 rounded-full flex-shrink-0" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  {/* Action Button Placeholder */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <Skeleton className="h-10 px-8 w-full sm:w-32 rounded-md" />
                  </div>
                </div>
                {/* Side Image/Video Thumbnail Placeholder */}
                <div className="w-full md:w-36 flex-shrink-0">
                  <Skeleton className="w-full aspect-video rounded-md border shadow-sm" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="py-8">
        <div className="max-w-3xl mx-auto px-6">
          {/* Footer Text Placeholder */}
          <Skeleton className="h-4 w-1/2 mx-auto" />
        </div>
      </footer>
    </div>
  );
};
