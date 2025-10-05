import * as React from 'react';
import Laptop from 'lucide-react/dist/esm/icons/laptop';
import Moon from 'lucide-react/dist/esm/icons/moon';
import MoonStar from 'lucide-react/dist/esm/icons/moon-star';
import Sun from 'lucide-react/dist/esm/icons/sun';

import { cn } from '@/utils/shadcnUtils';
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
            <span>라이트</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value="dark"
            className={cn(
              'flex items-center cursor-pointer',
              theme === 'dark' && 'font-medium',
            )}
          >
            <Moon className="mr-2 h-4 w-4" />
            <span>다크</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value="deepdark"
            className={cn(
              'flex items-center cursor-pointer',
              theme === 'deepdark' && 'font-medium',
            )}
          >
            <MoonStar className="mr-2 h-4 w-4" />
            <span>딥다크</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value="system"
            className={cn(
              'flex items-center cursor-pointer',
              theme === 'system' && 'font-medium',
            )}
          >
            <Laptop className="mr-2 h-4 w-4" />
            <span>시스템</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </div>
    );
  },
);
ThemeToggle.displayName = 'ThemeToggle';

export { ThemeToggle };
