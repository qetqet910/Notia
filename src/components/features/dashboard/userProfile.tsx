import {
  User,
  Settings,
  LogOut,
  Loader2,
  Monitor,
  Activity,
} from 'lucide-react';
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
  // userProfile을 사용하여 커스텀 users 테이블의 데이터를 가져옵니다.
  const { user, userProfile, isLogoutLoading, isAuthenticated, signOut } =
    useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setTheme } = useThemeStore();

  // 사용자 정보 상태 - userProfile의 변경에 따라 업데이트되도록 useEffect 사용
  const [displayName, setDisplayName] = useState('사용자');
  const [initials, setInitials] = useState('사');
  const [avatarUrl, setAvatarUrl] = useState('');

  // userProfile 또는 user가 변경될 때 사용자 정보 업데이트
  useEffect(() => {
    // userProfile이 우선순위를 가집니다. (커스텀 users 테이블 데이터)
    if (userProfile) {
      const name = userProfile.display_name || '사용자';
      setDisplayName(name);
      setInitials(name.substring(0, 1).toUpperCase());
      setAvatarUrl(userProfile.avatar_url || '');
    } else if (user?.user_metadata) {
      const metadata = user.user_metadata;
      const name = metadata?.name || '사용자';

      setDisplayName(name);
      setInitials(name.substring(0, 1).toUpperCase());
      setAvatarUrl(metadata?.avatar_url || '');
    } else {
      // 모든 정보가 없을 경우 기본값으로 초기화
      setDisplayName('사용자');
      setInitials('사');
      setAvatarUrl('');
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
        // result.error가 Error 객체가 아닐 수 있으므로 instanceof로 체크
        throw result.error instanceof Error
          ? result.error
          : new Error(result.error || '로그아웃 실패');
      }
    } catch (error) {
      console.error('로그아웃 오류:', error);
      toast({
        title: '로그아웃 실패',
        description:
          error instanceof Error
            ? error.message
            : '로그아웃 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      // 로그아웃 성공/실패 여부와 관계없이 항상 로그인 페이지로 이동
      // toast 메시지가 먼저 표시될 시간을 주기 위해 setTimeout 사용
      setTimeout(() => {
        navigate('/login');
      }, 100);
    }
  };

  // 인증되지 않은 경우 렌더링하지 않음
  if (!isAuthenticated) {
    return null;
  }

  // 이메일 표시 로직 최적화: userProfile의 email을 우선 사용
  // userProfile이 없거나 email이 'anon_'으로 시작하면 이메일을 표시하지 않음
  const displayEmail = userProfile?.email
    ? userProfile.email.startsWith('anon_')
      ? '' // 익명 사용자일 경우 이메일을 표시하지 않음
      : userProfile.email
    : user?.email // userProfile에 이메일이 없으면 auth.user의 이메일 사용 (Fallback)
    ? user.email.startsWith('anon_')
      ? '' // 익명 사용자일 경우 이메일을 표시하지 않음
      : user.email
    : ''; // 둘 다 없으면 빈 문자열

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
          className="cursor-pointer"
          onClick={() => navigate('/dashboard/myPage?tab=profile')}
        >
          <User className="mr-2 h-4 w-4" />
          <span>마이페이지</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => navigate('/dashboard/myPage?tab=activity')}
        >
          <Activity className="mr-2 h-4 w-4" />
          <span>활동</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => navigate('/dashboard/myPage?tab=settings')}
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>설정</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => navigate('/dashboard/help')}
        >
          <Monitor className="mr-2 h-4 w-4" />
          <span>도움말</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5">
          <p className="text-xs font-medium mb-1">테마</p>
          <ThemeToggle />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={handleSignOut}
          disabled={isLogoutLoading}
        >
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
