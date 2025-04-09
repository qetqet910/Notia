'use client';
import { useState } from 'react';
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
        // toast({
        //   title: '로그아웃 성공',
        //   description: '성공적으로 로그아웃되었습니다.',
        // });

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
