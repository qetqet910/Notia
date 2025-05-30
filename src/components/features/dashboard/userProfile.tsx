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
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import { useState, useEffect } from 'react';
import { ThemeToggle } from '@/components/ui/themeToggle';
import { useThemeStore } from '@/stores/themeStore';

export function UserProfile() {
  const { user, userProfile, isLogoutLoading, isAuthenticated, signOut } =
    useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setTheme } = useThemeStore();

  // 사용자 정보 상태 - 의존성 배열에 따라 업데이트되도록 useEffect 사용
  const [displayName, setDisplayName] = useState('사용자');
  const [initials, setInitials] = useState('사');
  const [avatarUrl, setAvatarUrl] = useState('');

  // 사용자 정보 업데이트 효과
  useEffect(() => {
    if (userProfile?.raw_user_meta_data || user?.user_metadata) {
      const metadata = userProfile?.raw_user_meta_data || user?.user_metadata;
      const name = metadata?.name || '사용자';

      setDisplayName(name);
      setInitials(name.substring(0, 1).toUpperCase());
      setAvatarUrl(metadata?.avatar_url || '');
    }
  }, [userProfile, user]); // 의존성 배열에 userProfile과 user 추가

  const handleSignOut = async () => {
    try {
      const result = await signOut();

      if (result.success) {
        toast({
          title: '로그아웃 성공',
          description: '성공적으로 로그아웃되었습니다.',
        });
        setTheme('system');
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

  // 인증되지 않은 경우 렌더링하지 않음
  if (!isAuthenticated) {
    return null;
  }

  // 이메일 표시 로직 최적화
  const displayEmail = user?.email
    ? user.email.startsWith('anon_')
      ? '익명 사용자'
      : user.email
    : '';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} alt={displayName} />
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
              {displayEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => navigate('/dashboard/myPage?tab=profile')}
        >
          <User className="mr-2 h-4 w-4" />
          <span>마이페이지</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate('/dashboard/myPage?tab=settings')}
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>설정</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/dashboard/help')}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>도움말</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5">
          <p className="text-xs font-medium mb-1">테마</p>
          <ThemeToggle />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} disabled={isLogoutLoading}>
          {isLogoutLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          <span>로그아웃</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
