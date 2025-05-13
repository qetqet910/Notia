import * as React from 'react';
import { Laptop, Moon, MoonStar, Sun } from 'lucide-react';

import { cn } from '@/utils/utils';
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { useThemeStore } from '@/stores/themeStore';

export interface ThemeToggleProps
  extends React.HTMLAttributes<HTMLDivElement> {}

const ThemeToggle = React.forwardRef<HTMLDivElement, ThemeToggleProps>(
  ({ className, ...props }, ref) => {
    const { theme, setTheme } = useThemeStore();

    return (
      <div ref={ref} className={cn('', className)} {...props}>
        <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
          <DropdownMenuRadioItem
            value="light"
            className={cn(
              'flex items-center cursor-pointer',
              theme === 'light' && 'font-medium',
            )}
          >
            <Sun className="mr-2 h-4 w-4" />
            <span>Light</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value="dark"
            className={cn(
              'flex items-center cursor-pointer',
              theme === 'dark' && 'font-medium',
            )}
          >
            <MoonStar className="mr-2 h-4 w-4" />
            <span>Dark</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value="deepdark"
            className={cn(
              'flex items-center cursor-pointer',
              theme === 'deepdark' && 'font-medium',
            )}
          >
            <Moon className="mr-2 h-4 w-4" />
            <span>Deep Dark</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value="system"
            className={cn(
              'flex items-center cursor-pointer',
              theme === 'system' && 'font-medium',
            )}
          >
            <Laptop className="mr-2 h-4 w-4" />
            <span>System</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </div>
    );
  },
);
ThemeToggle.displayName = 'ThemeToggle';

export { ThemeToggle };
