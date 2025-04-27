import { User, Settings, LogOut, Loader2, Monitor } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export function UserProfile() {
  const { user, userProfile, isLogoutLoading, isAuthenticated, signOut } =
    useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [theme, setTheme] = useState('dark');

  const handleSignOut = async () => {
    try {
      const result = await signOut();

      if (result.success) {
        toast({
          title: '로그아웃 성공',
          description: '성공적으로 로그아웃되었습니다.',
        });

        navigate('/login');
      } else {
        throw result.error || new Error('로그아웃 실패');
      }
    } catch (error) {
      console.error('로그아웃 오류:', error);
      toast({
        title: '로그아웃 실패',
        description: '로그아웃 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      navigate('/login');
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const rawUserMetaData =
    userProfile?.raw_user_meta_data || user?.user_metadata;
  const displayName =
    rawUserMetaData?.full_name ||
    rawUserMetaData?.name ||
    user?.email?.split('@')[0] ||
    '사용자';
  const initials = displayName.substring(0, 1).toUpperCase();
  const avatarUrl = rawUserMetaData?.avatar_url;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl || ''} alt={displayName} />
            <AvatarFallback className="bg-neutral-800 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email || '익명 사용자'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>Account preferences</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Feature previews</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Monitor className="mr-2 h-4 w-4" />
          <span>Command menu</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5">
          <p className="text-xs font-medium mb-1">Theme</p>
          <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
            <DropdownMenuRadioItem value="dark" className="text-sm">
              Dark
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="light" className="text-sm">
              Light
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="classic-dark" className="text-sm">
              Classic Dark
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system" className="text-sm">
              System
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} disabled={isLogoutLoading}>
          {isLogoutLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}