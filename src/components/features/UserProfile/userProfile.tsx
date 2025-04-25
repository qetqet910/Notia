import { User, Settings, LogOut, Loader2 } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';

export function UserProfile() {
  const { user, userProfile, isLogoutLoading, isAuthenticated, signOut } =
    useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  // UserProfile.tsx - handleSignOut 함수 수정
  const handleSignOut = async () => {
    try {
      // 반환값 처리 추가
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

  // UserProfile.tsx에서 사용자 메타데이터 접근 방식 수정
  // 데이터 구조 로깅
  console.log('user:', user);
  console.log('userProfile:', userProfile);

  // raw_user_meta_data가 어떤 구조인지 확인
  // user_metadata에서 데이터를 확인하세요 (Supabase Auth 구조)
  const rawUserMetaData =
    userProfile?.raw_user_meta_data || user?.user_metadata;
  console.log('사용자 메타데이터:', rawUserMetaData);

  // 이미지 데이터에 보이는 구조대로 접근
  const displayName =
    rawUserMetaData?.full_name ||
    rawUserMetaData?.name ||
    user?.email?.split('@')[0] ||
    '사용자';
  const initials = displayName.substring(0, 1).toUpperCase();

  const avatarUrl = rawUserMetaData?.avatar_url;
  console.log('추출된 이름:', displayName);
  console.log('추출된 아바타 URL:', avatarUrl);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border border-[#e6f7f2]">
            <AvatarImage src={avatarUrl || ''} alt={displayName} />
            <AvatarFallback className="bg-[#e6f7f2] text-[#61C9A8]">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel>
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
          <span>프로필</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>설정</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <Button onClick={handleSignOut} disabled={isLogoutLoading}>
          {isLogoutLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>로그아웃 중...</span>
            </div>
          ) : (
            '로그아웃'
          )}
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
