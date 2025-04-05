'use client';

import { useState } from 'react';
import { User, Settings, LogOut } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';

export function UserProfile() {
  const { user, userProfile, isAuthenticated, signOut } = useAuthStore();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // UserProfile.tsx - handleSignOut 함수 수정
  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true);

      // 로그아웃 함수 호출
      await signOut();

      toast({
        title: '로그아웃 성공',
        description: '성공적으로 로그아웃되었습니다.',
      });

      // 약간의 지연 후 리디렉션 (상태 업데이트를 위해)
      setTimeout(() => {
        // 로그아웃 후 로그인 페이지로 강제 리다이렉트
        window.location.href = '/login';
      }, 300);
    } catch (error) {
      console.error('로그아웃 오류:', error);
      toast({
        title: '로그아웃 실패',
        description: '로그아웃 중 오류가 발생했습니다.',
        variant: 'destructive',
      });

      // 오류 발생 시에도 로그인 페이지로 리다이렉트 시도
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const displayName =
    userProfile?.display_name || user?.email?.split('@')[0] || '사용자';
  const avatarUrl = userProfile?.avatar_url;
  const initials = displayName.substring(0, 2).toUpperCase();

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
        <DropdownMenuItem onClick={handleSignOut} disabled={isLoggingOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoggingOut ? '로그아웃 중...' : '로그아웃'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
