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
    <div className="flex flex-col lg:flex-row min-h-screen overflow-hidden bg-background">
      <div className=""></div> {/* This div seems empty, keeping as is */}
      <div className="w-full lg:w-1/2 p-4 md:p-8 flex items-start lg:mt-32 lg:mb-16 justify-center lg:justify-end lg:pr-24">
        <div>
          <div className="rounded-xl border relative w-full max-w-md shadow-lg border-border bg-card overflow-visible">
            <div className="p-6 pt-8 pb-6">
              <div className="flex justify-center items-center mb-6">
                <div className="w-1/2 flex justify-center">
                  {/* Logo Placeholder */}
                  <Skeleton className="w-32 h-8" />
                </div>
              </div>
              <div className="space-y-4">
                {/* Tab Navigation Placeholder */}
                <div className="h-10 items-center justify-center rounded-md bg-muted p-1 grid grid-cols-2 gap-4">
                  <div className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all bg-background shadow-sm">
                    <Skeleton className="w-12 h-6" />
                  </div>
                  <div className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all">
                    <Skeleton className="w-12 h-6" />
                  </div>
                </div>
                <div className="relative min-h-[280px]">
                  <div className="space-y-4">
                    <form className="space-y-4 mb-6">
                      <div className="space-y-4">
                        <div className="min-h-[120px]">
                          <div className="space-y-4">
                            <div className="bg-secondary/50 p-4 rounded-lg">
                              <div className="space-y-4 w-full max-w-md mx-auto">
                                {/* OTP / Code Input Placeholder */}
                                <div className="flex items-center gap-2">
                                  <div className="flex flex-col w-full justify-center gap-1 sm:gap-2">
                                    <div className="flex justify-center gap-0.5 sm:gap-1">
                                      <div className="flex items-center gap-0.5 sm:gap-1">
                                        <Skeleton className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-md" />
                                        <Skeleton className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-md" />
                                        <Skeleton className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-md" />
                                        <Skeleton className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-md" />
                                      </div>
                                      <div className="sm:mt-0.5 md:mt-1">
                                        <Skeleton className="w-3 h-0.5" />
                                      </div>
                                      <div className="flex items-center gap-0.5 sm:gap-1">
                                        <Skeleton className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-md" />
                                        <Skeleton className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-md" />
                                        <Skeleton className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-md" />
                                        <Skeleton className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-md" />
                                      </div>
                                    </div>
                                    <div className="flex justify-center gap-0.5 sm:gap-1">
                                      <div className="flex items-center gap-0.5 sm:gap-1">
                                        <Skeleton className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-md" />
                                        <Skeleton className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-md" />
                                        <Skeleton className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-md" />
                                        <Skeleton className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-md" />
                                      </div>
                                      <div className="sm:mt-0.5 md:mt-1">
                                        <Skeleton className="w-3 h-0.5" />
                                      </div>
                                      <div className="flex items-center gap-0.5 sm:gap-1">
                                        <Skeleton className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-md" />
                                        <Skeleton className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-md" />
                                        <Skeleton className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-md" />
                                        <Skeleton className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-md" />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <Skeleton className="h-5 mx-auto w-48" />{' '}
                                {/* Prompt text */}
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Submit Button Placeholder */}
                        <div>
                          <Skeleton className="w-full h-11" />
                        </div>
                      </div>
                    </form>
                    {/* Divider Placeholder */}
                    <div className="relative my-4">
                      <Skeleton className="h-[1px] w-full" />
                      <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background px-2">
                        <Skeleton className="w-16 h-5" />
                      </span>
                    </div>
                    {/* Social Login Buttons Placeholder */}
                    <div className="space-y-2">
                      <div>
                        <Skeleton className="w-full h-11 mb-2 rounded-md" />
                      </div>
                      <div>
                        <Skeleton className="w-full h-11 mb-2 rounded-md" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
