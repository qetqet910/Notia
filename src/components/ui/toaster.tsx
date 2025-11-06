import * as React from 'react';
import { useToast } from '@/hooks/useToast';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';
import { cn } from '@/utils/shadcnUtils';

export type ToasterProps = React.HTMLAttributes<HTMLDivElement>;

const Toaster = React.forwardRef<HTMLDivElement, ToasterProps>(
  ({ className, ...props }, ref) => {
    const { toasts } = useToast();

    return (
      <ToastProvider>
        <div ref={ref} className={cn('', className)} {...props}>
          {toasts.map(({ id, title, description, action, ...toastProps }) => (
            <Toast key={id} {...toastProps}>
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
              {action}
              <ToastClose />
            </Toast>
          ))}
        </div>
        <ToastViewport />
      </ToastProvider>
    );
  },
);
Toaster.displayName = 'Toaster';

export { Toaster };
