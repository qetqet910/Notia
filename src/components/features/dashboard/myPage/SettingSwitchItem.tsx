import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export const SettingSwitchItem = ({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  icon,
}) => (
  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
    <div className="flex items-center space-x-3">
      {icon && (
        <span className="text-muted-foreground">
          {React.cloneElement(icon, { className: 'h-5 w-5' })}
        </span>
      )}
      <div className="space-y-0.5">
        <Label htmlFor={id} className="text-base font-medium">
          {label}
        </Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
    <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);
