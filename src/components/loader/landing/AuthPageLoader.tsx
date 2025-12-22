import { Skeleton } from '@/components/ui/skeleton';

export const TermsPageLoader = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="rounded-xl shadow w-full max-w-3xl">
        <div className="flex flex-col space-y-1.5 p-6">
          {/* Title Placeholder */}
          <Skeleton className="h-6 w-52" />
          {/* Subtitle Placeholder */}
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="p-6 pt-0">
          <div className="space-y-4">
            {/* Terms Content Placeholder 1 */}
            <div className="p-4 overflow-auto text-sm border rounded-md max-h-60">
              <div className="space-y-3">
                <Skeleton className="h-6 w-48" /> {/* Subheading */}
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
            {/* Terms Content Placeholder 2 */}
            <div className="p-4 overflow-auto text-sm border rounded-md max-h-60">
              <div className="space-y-3">
                <Skeleton className="h-6 w-48" /> {/* Subheading */}
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </div>
          {/* Checkboxes Placeholder */}
          <div className="flex flex-col space-y-2 mt-6 text-sm">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4 rounded-sm" /> {/* Checkbox */}
              <Skeleton className="h-4 w-64" /> {/* Text */}
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4 rounded-sm" /> {/* Checkbox */}
              <Skeleton className="h-4 w-64" /> {/* Text */}
            </div>
          </div>
          {/* Button Placeholder */}
          <Skeleton className="h-9 w-full mt-6" />
        </div>
      </div>
    </div>
  );
};

export const LoginPageLoader = () => {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-950">
      <div className="relative z-10 w-full max-w-[420px] mx-4">
        {/* Card Skeleton matching Liquid Glass style */}
        <div className="bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-white/40 dark:border-white/10 shadow-lg rounded-[32px] p-6 sm:p-8 pt-10 pb-8 space-y-8">
          
          {/* Header (Logo & Title) */}
          <div className="flex flex-col items-center space-y-4">
            <Skeleton className="w-32 h-10 rounded-lg bg-white/50 dark:bg-white/10" />
            <div className="space-y-2 flex flex-col items-center w-full">
              <Skeleton className="w-48 h-6 rounded bg-white/50 dark:bg-white/10" />
              <Skeleton className="w-64 h-4 rounded bg-white/50 dark:bg-white/10" />
            </div>
          </div>

          {/* Tabs */}
          <div className="h-11 w-full bg-black/5 dark:bg-white/5 p-1 rounded-2xl grid grid-cols-2 gap-2">
            <Skeleton className="h-full rounded-xl bg-white/60 dark:bg-white/20 shadow-sm" />
            <div /> 
          </div>

          {/* Form Content */}
          <div className="space-y-6">
            {/* Inputs Area */}
            <div className="space-y-4 bg-white/20 dark:bg-white/5 p-4 rounded-xl">
               <div className="flex justify-center gap-2 mb-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-8 rounded bg-white/50 dark:bg-white/10" />
                  ))}
                  <div className="w-2" />
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i+4} className="h-8 w-8 rounded bg-white/50 dark:bg-white/10" />
                  ))}
               </div>
               <Skeleton className="h-11 w-full rounded-md bg-primary/20" />
            </div>
            
            {/* Divider */}
            <div className="flex items-center gap-4 px-2">
              <Skeleton className="h-[2px] flex-1 bg-black/10 dark:bg-white/10" />
              <Skeleton className="w-8 h-3 bg-black/10 dark:bg-white/10 rounded-full" />
              <Skeleton className="h-[2px] flex-1 bg-black/10 dark:bg-white/10" />
            </div>

            {/* Social Buttons */}
            <div className="space-y-3">
              <Skeleton className="h-11 w-full rounded-md bg-white/40 dark:bg-white/10 border border-white/20" />
              <Skeleton className="h-11 w-full rounded-md bg-white/40 dark:bg-white/10 border border-white/20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
