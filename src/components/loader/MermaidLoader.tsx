import { Skeleton } from '@/components/ui/skeleton';

export const MermaidLoader = () => {
  return (
    <div className="flex flex-col h-full mb-5 mt-5">
      <Skeleton className="h-96 w-full" />
    </div>
  );
};
