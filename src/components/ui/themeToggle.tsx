import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { useThemeStore } from '@/stores/themeStore';
import { Laptop, Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();

  return (
    <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
      <DropdownMenuRadioItem value="light" onClick={() => setTheme('light')}>
        <Sun className="mr-2 h-4 w-4" />
        <span>Light</span>
      </DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="dark" onClick={() => setTheme('dark')}>
        <Moon className="mr-2 h-4 w-4" />
        <span>Dark</span>
      </DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="deepdark" onClick={() => setTheme('deepdark')}>
        <Moon className="mr-2 h-4 w-4" />
        <span>Deep Dark</span>
      </DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="system" onClick={() => setTheme('system')}>
        <Laptop className="mr-2 h-4 w-4" />
        <span>System</span>
      </DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>
  );
}
