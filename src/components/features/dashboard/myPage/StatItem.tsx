import React from 'react';

interface StatItemProps {
  icon: React.ReactElement;
  value: string | number;
  label: string;
  color?: string;
}

export const StatItem: React.FC<StatItemProps> = React.memo(
  ({ icon, value, label, color = 'text-foreground' }) => (
    <div className="text-center p-2">
      {icon && (
        <div
          className={`h-8 w-8 mx-auto mb-2 ${color} flex justify-center items-center`}
        >
          {icon}
        </div>
      )}
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  ),
);

StatItem.displayName = 'StatItem';