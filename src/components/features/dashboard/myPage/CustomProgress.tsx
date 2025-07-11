export const CustomProgress = ({ value }: { value: number }) => {
  const progress = Math.max(0, Math.min(100, value || 0));
  return (
    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
      <div
        className="bg-primary h-full rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};