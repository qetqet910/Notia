import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserProfile } from '@/components/features/dashboard/userProfile';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/useToast';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { useNotes } from '@/hooks/useNotes';
import {
  User,
  Settings,
  Bell,
  Palette,
  FileText,
  Calendar,
  BarChart3,
  LogOut,
  ArrowLeft,
  Save,
  Camera,
  Shield,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react';
import logoImage from '@/assets/images/Logo.png';
import logoDarkImage from '@/assets/images/LogoDark.png';

export const MyPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userProfile, signOut } = useAuthStore();
  const { isDarkMode, isDeepDarkMode } = useThemeStore();
  const { notes } = useNotes();

  // 프로필 편집 상태
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(
    userProfile?.raw_user_meta_data?.name || '',
  );
  const [email, setEmail] = useState(user?.email || '');

  // 설정 상태
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [reminderNotifications, setReminderNotifications] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') ?? 'profile';

  const handleTabChange = (newTab: string) => {
    setSearchParams({ tab: newTab });
  };

  // 통계 데이터
  const [stats, setStats] = useState({
    totalNotes: 0,
    totalReminders: 0,
    completedReminders: 0,
    tagsUsed: 0,
  });

  useEffect(() => {
    // 통계 계산
    const totalReminders = notes.reduce(
      (acc, note) => acc + (note.reminders?.length || 0),
      0,
    );
    const completedReminders = notes.reduce(
      (acc, note) =>
        acc + (note.reminders?.filter((r) => r.completed).length || 0),
      0,
    );
    const allTags = new Set<string>();
    notes.forEach((note) => {
      note.tags.forEach((tag) => allTags.add(tag));
    });

    setStats({
      totalNotes: notes.length,
      totalReminders,
      completedReminders,
      tagsUsed: allTags.size,
    });
  }, [notes]);

  const handleSaveProfile = async () => {
    try {
      // 프로필 저장 로직 (Supabase 업데이트)
      // 실제 구현에서는 useAuthStore의 updateProfile 함수를 사용
      toast({
        title: '프로필 저장됨',
        description: '프로필 정보가 성공적으로 업데이트되었습니다.',
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: '저장 실패',
        description: '프로필 저장 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
      toast({
        title: '로그아웃 완료',
        description: '성공적으로 로그아웃되었습니다.',
      });
    } catch (error) {
      toast({
        title: '로그아웃 실패',
        description: '로그아웃 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleBackUrl = () => {
    navigate('/dashboard');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const logoSrc = useMemo(
    () => (isDarkMode || isDeepDarkMode ? logoDarkImage : logoImage),
    [isDarkMode, isDeepDarkMode],
  );

  return (
    <div
      id="myPage-container"
      className={`flex flex-col h-screen theme-${
        isDarkMode ? (isDeepDarkMode ? 'deepdark' : 'dark') : 'light'
      }`}
    >
      <div className="flex flex-col h-full bg-background text-foreground">
        <Toaster />

        {/* 헤더 */}
        <header className="flex justify-between items-center px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="mr-2"
              onClick={handleBackUrl}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-primary">
              <img
                src={logoSrc || '/placeholder.svg'}
                className="max-w-40 cursor-pointer"
                alt="로고"
                onClick={handleBackUrl}
              />
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <UserProfile />
          </div>
        </header>

        {/* 메인 콘텐츠 */}
        <ScrollArea className="flex-1">
          <div className="container mx-auto p-6 max-w-4xl">
            <Tabs
              value={tab}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile">프로필</TabsTrigger>
                <TabsTrigger value="settings">설정</TabsTrigger>
              </TabsList>

              {/* 프로필 탭 */}
              <TabsContent value="profile" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      프로필 정보
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* 아바타 섹션 */}
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage
                          src={
                            userProfile?.raw_user_meta_data?.avatar_url ||
                            '/placeholder.svg'
                          }
                        />
                        <AvatarFallback className="text-lg">
                          {getInitials(displayName || email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm">
                          <Camera className="h-4 w-4 mr-2" />
                          사진 변경
                        </Button>
                        <p className="text-sm text-muted-foreground">
                          JPG, PNG 파일만 업로드 가능합니다.
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* 프로필 정보 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="displayName">표시 이름</Label>
                        <Input
                          id="displayName"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          disabled={!isEditing}
                          placeholder="이름을 입력하세요"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">이메일</Label>
                        <Input
                          id="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={!isEditing}
                          type="email"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      {isEditing ? (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => setIsEditing(false)}
                          >
                            취소
                          </Button>
                          <Button onClick={handleSaveProfile}>
                            <Save className="h-4 w-4 mr-2" />
                            저장
                          </Button>
                        </>
                      ) : (
                        <Button onClick={() => setIsEditing(true)}>
                          <Settings className="h-4 w-4 mr-2" />
                          편집
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2" />
                      사용 통계
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                        <div className="text-2xl font-bold">
                          {stats.totalNotes}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          총 노트
                        </div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <Calendar className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <div className="text-2xl font-bold">
                          {stats.totalReminders}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          총 리마인더
                        </div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <Badge className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                        <div className="text-2xl font-bold">
                          {stats.completedReminders}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          완료된 리마인더
                        </div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <Settings className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                        <div className="text-2xl font-bold">
                          {stats.tagsUsed}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          사용된 태그
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 활동 요약 */}
                <Card>
                  <CardHeader>
                    <CardTitle>최근 활동</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">완료율</span>
                        <span className="text-sm font-medium">
                          {stats.totalReminders > 0
                            ? Math.round(
                                (stats.completedReminders /
                                  stats.totalReminders) *
                                  100,
                              )
                            : 0}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{
                            width: `${
                              stats.totalReminders > 0
                                ? (stats.completedReminders /
                                    stats.totalReminders) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 계정 탭 */}
              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Bell className="h-5 w-5 mr-2" />
                      알림 설정
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>푸시 알림</Label>
                        <p className="text-sm text-muted-foreground">
                          브라우저 알림을 받습니다
                        </p>
                      </div>
                      <Switch
                        checked={notifications}
                        onCheckedChange={setNotifications}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>리마인더 알림</Label>
                        <p className="text-sm text-muted-foreground">
                          리마인더 시간에 알림을 받습니다
                        </p>
                      </div>
                      <Switch
                        checked={reminderNotifications}
                        onCheckedChange={setReminderNotifications}
                      />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="h-5 w-5 mr-2" />
                      계정 관리
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>계정 ID</Label>
                      <Input value={user?.id || ''} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>가입일</Label>
                      <Input
                        value={
                          user?.created_at
                            ? new Date(user.created_at).toLocaleDateString(
                                'ko-KR',
                              )
                            : ''
                        }
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>마지막 로그인</Label>
                      <Input
                        value={
                          user?.last_sign_in_at
                            ? new Date(user.last_sign_in_at).toLocaleDateString(
                                'ko-KR',
                              )
                            : ''
                        }
                        disabled
                      />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-destructive">
                        위험 구역
                      </h3>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">
                            <LogOut className="h-4 w-4 mr-2" />
                            로그아웃
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              로그아웃 하시겠습니까?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              현재 세션에서 로그아웃됩니다. 저장되지 않은
                              변경사항은 손실될 수 있습니다.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction onClick={handleLogout}>
                              로그아웃
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default MyPage;
