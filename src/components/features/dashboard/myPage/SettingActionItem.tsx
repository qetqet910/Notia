import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface SettingActionItemProps {
  id: string;
  label: string;
  description: string;
  buttonText: string;
  onAction: () => void;
  icon: React.ReactElement;
  disabled?: boolean;
}

export const SettingActionItem: React.FC<SettingActionItemProps> = React.memo(
  ({ id, label, description, buttonText, onAction, icon, disabled }) => (
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
      <Button
        id={id}
        variant="outline"
        size="sm"
        onClick={onAction}
        disabled={disabled}
      >
        {buttonText}
      </Button>
    </div>
  ),
);

SettingActionItem.displayName = 'SettingActionItem';
