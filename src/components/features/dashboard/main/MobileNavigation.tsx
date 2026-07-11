import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GoalProgress } from '@/components/features/dashboard/GoalProgress';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { NAV_ITEMS } from '@/constants/dashboardNav';
import PlusCircle from 'lucide-react/dist/esm/icons/plus-circle';
import Menu from 'lucide-react/dist/esm/icons/menu';
import User from 'lucide-react/dist/esm/icons/user';
import Activity from 'lucide-react/dist/esm/icons/activity';
import Settings from 'lucide-react/dist/esm/icons/settings';
import Monitor from 'lucide-react/dist/esm/icons/monitor';
import LogOut from 'lucide-react/dist/esm/icons/log-out';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';

export const MobileNavigation = ({
  activeTab,
  setActiveTab,
  handleCreateNote,
  popularTags,
  onTagSelect,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  handleCreateNote: () => void;
  popularTags: { tag: string; count: number }[];
  onTagSelect: (tag: string) => void;
}) => {
  const navigate = useNavigate();
  const { userProfile, user, signOut, isLogoutLoading } = useAuthStore();
  const { toast } = useToast();
  const { setTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);

  const displayName =
    userProfile?.display_name || user?.user_metadata?.name || '사용자';
  const displayEmail =
    userProfile?.email && !userProfile.email.startsWith('anon_')
      ? userProfile.email
      : user?.email && !user.email.startsWith('anon_')
      ? user.email
      : '';
  const avatarUrl =
    userProfile?.avatar_url || user?.user_metadata?.avatar_url || '';
  const initials = displayName?.substring(0, 1).toUpperCase() || '사';

  const handleSignOut = async () => {
    try {
      const result = await signOut();
      if (result.success) {
        toast({
          title: '로그아웃 성공',
          description: '성공적으로 로그아웃되었습니다.',
        });
        setTheme('light');
        navigate('/');
      } else {
        throw result.error || new Error('로그아웃 실패');
      }
    } catch (error) {
      toast({
        title: '로그아웃 실패',
        description:
          error instanceof Error
            ? error.message
            : '로그아웃 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <Button
        variant="ghost"
        onClick={() => {
          handleCreateNote();
          setIsOpen(false);
        }}
      >
        <PlusCircle />
      </Button>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72 bg-background p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>모바일 메뉴</SheetTitle>
          <SheetDescription>
            노트, 리마인더, 캘린더, 타임라인 등 주요 기능으로 이동할 수 있는
            메뉴입니다.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-semibold">{displayName}</span>
                  <span className="text-sm text-muted-foreground">
                    {displayEmail}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-4">
              <Button
                variant="outline"
                className="w-full justify-start mb-4"
                onClick={() => {
                  handleCreateNote();
                  setIsOpen(false);
                }}
              >
                <PlusCircle className="mr-2 h-4 w-4" />새 노트
              </Button>
              <nav className="flex flex-col gap-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant={activeTab === item.id ? 'secondary' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsOpen(false);
                      }}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Button>
                  );
                })}
              </nav>
              <Separator className="my-4" />
              <nav className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() =>
                    handleNavigation('/dashboard/myPage?tab=profile')
                  }
                >
                  <User className="mr-2 h-4 w-4" />
                  마이페이지
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() =>
                    handleNavigation('/dashboard/myPage?tab=activity')
                  }
                >
                  <Activity className="mr-2 h-4 w-4" />
                  활동
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() =>
                    handleNavigation('/dashboard/myPage?tab=settings')
                  }
                >
                  <Settings className="mr-2 h-4 w-4" />
                  설정
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleNavigation('/dashboard/help')}
                >
                  <Monitor className="mr-2 h-4 w-4" />
                  도움말
                </Button>
              </nav>
            </div>
          </div>
          <div className="p-4 border-t">
            {popularTags.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  인기 태그
                </h3>
                <div className="flex flex-col gap-1">
                  {popularTags.map(({ tag, count }) => (
                    <Button
                      key={tag}
                      variant="ghost"
                      size="sm"
                      className="justify-between text-xs"
                      onClick={() => {
                        onTagSelect(tag);
                        setIsOpen(false);
                      }}
                    >
                      <span>#{tag}</span>
                      <span className="bg-muted-foreground/20 rounded-full px-2 py-0.5 text-xs">
                        {count}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
            <div className="mb-4">
              <GoalProgress />
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleSignOut}
              disabled={isLogoutLoading}
            >
              {isLogoutLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              로그아웃
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
