import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
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
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import { useNotes } from '@/hooks/useNotes';
import { sendReminderNotification } from '@/utils/notification';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { supabase } from '@/services/supabaseClient';
import {
  User,
  Settings,
  Bell,
  FileText,
  Calendar,
  BarChart3,
  LogOut,
  ArrowLeft,
  Save,
  Camera,
  Shield,
  Tag,
  Award,
  Target,
  TrendingUp,
  CheckCircle,
  Star,
  Flame,
  Trophy,
  Mail,
  Loader2,
  Package,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import logoImage from '@/assets/images/Logo.png';
import logoDarkImage from '@/assets/images/LogoDark.png';

// --- 데이터 타입 정의 ---
interface Reminder {
  id: string;
  note_id: string;
  owner_id: string;
  reminder_text: string;
  reminder_time: string; // 'timestamptz'는 string으로 받습니다.
  completed: boolean;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  original_text?: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  reminders?: Reminder[];
  createdAt: string; // ISO 8601 형식
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  unlocked: boolean;
  unlockedAt?: Date;
}

interface ActivityData {
  date: string;
  count: number;
  level: number;
}

interface UserProfileData {
  id: number; // Or string, depending on your 'int4' mapping
  user_id: string; // uuid
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface ProfileTabProps {
  user: any; // Or your specific AuthUser type
  userProfile: UserProfileData | null;
  stats: any;
  achievements: any;
}

// --- Progress 컴포넌트 대체 ---
const CustomProgress = ({ value }: { value: number }) => {
  const progress = Math.max(0, Math.min(100, value || 0));
  return (
    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
      <div
        className="bg-primary h-full rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export const MyPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDarkMode, isDeepDarkMode, setTheme } = useThemeStore();
  const { notes } = useNotes() as { notes: Note[] }; // 실제 Note 타입 적용
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isToggleTheme, setisToggleTheme] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') ?? 'profile';
  const [isActiveTab, setIsActiveTab] = useState(0);
  const activeTabs = ['profile', 'activity', 'settings'];

  const { user, signOut, userProfile } = useAuthStore(); // userProfile might be from authStore, but we want it from the DB
  const [userProfileData, setUserProfileData] =
    useState<UserProfileData | null>(null); // New state for DB profile

  const fetchUserProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('user_profile')
      .select('*')
      .eq('user_id', userId)
      .single(); // Use .single() as each user has one profile
    if (error) {
      console.error('Error fetching user profile:', error);
      // Handle case where profile might not exist (e.g., first login)
      if (error.code === 'PGRST116') {
        // No rows found (specific to Supabase single())
        console.log('No user profile found, user might be new.');
        setUserProfileData(null); // Or initialize with default values if needed
      }
    } else if (data) {
      setUserProfileData(data);
    }
  }, []);

  const fetchReminders = useCallback(async (userId: string) => {
    // 실제 Supabase 연동 코드 예시
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('owner_id', userId)
      .order('reminder_time', { ascending: true });
    if (error) {
      console.error('Error fetching reminders:', error);
    } else if (data) {
      setReminders(data);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchReminders(user.id);
      fetchUserProfile(user.id); // Fetch user profile
    }
  }, [user?.id, fetchReminders, fetchUserProfile]);

  const SIMPLE_SHORTCUTS = {
    '/': () => navigate('/dashboard/help?tab=overview'),
    '?': () => navigate('/dashboard/help?tab=overview'),
    t: () => {
      setisToggleTheme((prev) => !prev);
      setTheme(isToggleTheme ? 'dark' : 'light');
    },
    Tab: () => {
      setIsActiveTab((prev) => (prev + 1) % activeTabs.length);
      handleTabChange(activeTabs[isActiveTab]);
    },
    b: () => setIsSidebarVisible((prev) => !prev),
    m: () => navigate('/dashboard/myPage?tab=profile'),
    ',': () => navigate('/dashboard/myPage?tab=activity'),
    '<': () => navigate('/dashboard/myPage?tab=activity'),
    '.': () => navigate('/dashboard/myPage?tab=settings'),
    '>': () => navigate('/dashboard/myPage?tab=settings'),
    Escape: () => navigate('/dashboard'),
    Backspace: () => navigate('/dashboard'),
  };

  const handleKeyboardShortcuts = useCallback(
    (e: KeyboardEvent) => {
      const isCtrlCmd = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement;

      // 입력 필드 체크
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        if (!(isCtrlCmd && e.key === 's')) return;
      }

      const handler = SIMPLE_SHORTCUTS[e.key as keyof typeof SIMPLE_SHORTCUTS];

      if (handler) {
        e.preventDefault();
        handler(isCtrlCmd);
      }
    },
    [
      navigate,
      setisToggleTheme,
      setTheme,
      isToggleTheme,
      setIsActiveTab,
      activeTabs,
    ],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () =>
      document.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [handleKeyboardShortcuts]);

  const handleTabChange = useCallback(
    (newTab: string) => {
      setSearchParams({ tab: newTab });
    },
    [setSearchParams],
  );

  const handleBackUrl = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  const handleLogout = useCallback(async () => {
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
  }, [signOut, navigate, toast]);

  const logoSrc = useMemo(
    () => (isDarkMode || isDeepDarkMode ? logoDarkImage : logoImage),
    [isDarkMode, isDeepDarkMode],
  );

  // --- 통계 및 활동 데이터 계산 로직 (useMemo로 최적화) ---
  const stats = useMemo(() => {
    const allReminders = reminders;
    const completedReminders = allReminders.filter((r) => r.completed);
    const today = new Date().toISOString().split('T')[0];

    const todayCompleted = completedReminders.filter((r) =>
      r.updated_at.startsWith(today),
    ).length;

    const completionDates = [
      ...new Set(completedReminders.map((r) => r.updated_at.split('T')[0])),
    ].sort();

    let streak = 0;
    if (completionDates.length > 0) {
      const todayDate = new Date();
      const yesterdayDate = new Date(todayDate);
      yesterdayDate.setDate(todayDate.getDate() - 1);

      const lastCompletionDateStr = completionDates[completionDates.length - 1];
      const lastCompletionDate = new Date(lastCompletionDateStr);

      if (
        lastCompletionDateStr === todayDate.toISOString().split('T')[0] ||
        lastCompletionDateStr === yesterdayDate.toISOString().split('T')[0]
      ) {
        streak = 1;
        for (let i = completionDates.length - 1; i > 0; i--) {
          const current = new Date(completionDates[i]);
          const previous = new Date(completionDates[i - 1]);
          const diffTime = current.getTime() - previous.getTime();
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            streak++;
          } else {
            break;
          }
        }
      }
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weeklyCompletedCount = completedReminders.filter(
      (r) => new Date(r.completedAt!) >= sevenDaysAgo,
    ).length;
    const weeklyAverage = Math.round(weeklyCompletedCount / 7);

    const allTags = new Set<string>();
    notes.forEach((note) => {
      note.tags.forEach((tag) => allTags.add(tag));
    });

    return {
      totalNotes: notes.length,
      totalReminders: allReminders.length,
      completedReminders: completedReminders.length,
      tagsUsed: allTags.size,
      completionRate:
        allReminders.length > 0
          ? (completedReminders.length / allReminders.length) * 100
          : 0,
      todayCompleted,
      streak,
      weeklyAverage,
    };
  }, [notes, reminders]);

  const activityData = useMemo((): ActivityData[] => {
    const data: { [date: string]: number } = {};
    const completedReminders = reminders.filter((r) => r.completed);

    completedReminders.forEach((r) => {
      const date = r.updated_at.split('T')[0]; // `updated_at`을 사용
      data[date] = (data[date] || 0) + 1;
    });

    const activityList: ActivityData[] = [];
    const today = new Date();
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      const count = data[dateString] || 0;
      const level = count === 0 ? 0 : Math.min(Math.ceil(count / 2), 4);

      activityList.push({ date: dateString, count, level });
    }
    return activityList;
  }, [reminders]);

  const achievements = useMemo((): Achievement[] => {
    return [
      {
        id: 'first_note',
        title: '첫 걸음',
        description: '첫 번째 노트를 작성했습니다',
        icon: <FileText className="h-4 w-4" />,
        color: 'bg-blue-500',
        unlocked: stats.totalNotes > 0,
      },
      {
        id: 'note_master',
        title: '노트 마스터',
        description: '노트 100개를 작성했습니다',
        icon: <Trophy className="h-4 w-4" />,
        color: 'bg-yellow-500',
        unlocked: stats.totalNotes >= 100,
      },
      {
        id: 'reminder_pro',
        title: '리마인더 프로',
        description: '리마인더 50개를 완료했습니다',
        icon: <CheckCircle className="h-4 w-4" />,
        color: 'bg-green-500',
        unlocked: stats.completedReminders >= 50,
      },
      {
        id: 'streak_week',
        title: '일주일 연속',
        description: '7일 연속 활동했습니다',
        icon: <Flame className="h-4 w-4" />,
        color: 'bg-orange-500',
        unlocked: stats.streak >= 7,
      },
      {
        id: 'perfectionist',
        title: '완벽주의자',
        description: '완료율 95% 이상 달성',
        icon: <Star className="h-4 w-4" />,
        color: 'bg-purple-500',
        unlocked: stats.completionRate >= 95,
      },
      {
        id: 'tag_organizer',
        title: '정리의 달인',
        description: '태그 20개 이상 사용',
        icon: <Tag className="h-4 w-4" />,
        color: 'bg-pink-500',
        unlocked: stats.tagsUsed >= 20,
      },
    ];
  }, [stats]);

  return (
    <div
      id="myPage-container"
      className={`flex flex-col h-screen theme-${
        isDarkMode ? (isDeepDarkMode ? 'deepdark' : 'dark') : 'light'
      }`}
    >
      <div className="flex flex-col h-full bg-background text-foreground">
        <Toaster />

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
                src={logoSrc}
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

        <ScrollArea className="flex-1">
          <div className="container mx-auto p-6 max-w-4xl">
            <Tabs
              value={tab}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">프로필</TabsTrigger>
                <TabsTrigger value="activity">활동</TabsTrigger>
                <TabsTrigger value="settings">설정</TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <ProfileTab
                  user={user}
                  userProfile={userProfileData}
                  stats={stats}
                  achievements={achievements}
                />
              </TabsContent>
              <TabsContent value="activity">
                <ActivityTab
                  stats={stats}
                  activityData={activityData}
                  reminders={reminders}
                />
              </TabsContent>
              <TabsContent value="settings">
                <SettingsTab user={user} handleLogout={handleLogout} />
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

// 프로필 탭
const ProfileTab: React.FC<ProfileTabProps> = ({
  user,
  userProfile,
  stats,
  achievements,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState(
    userProfile?.display_name || user?.email || '',
  );
  const [email, setEmail] = useState(userProfile?.email || user?.email || ''); // Use userProfile.email if available, else user.email
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatar_url || ''); // New state for avatar URL
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update displayName and email when userProfile changes
  useEffect(() => {
    setDisplayName(userProfile?.display_name || user?.email || '');
    setEmail(userProfile?.email || user?.email || '');
    setAvatarUrl(userProfile?.avatar_url || '');
  }, [userProfile, user?.email]);

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const handleSaveProfile = useCallback(async () => {
    setIsSaving(true);
    try {
      if (!user?.id) {
        toast({
          title: '저장 실패',
          description: '사용자 정보를 찾을 수 없습니다.',
          variant: 'destructive',
        });
        return;
      }

      // Check if a profile already exists for this user_id
      const { data: existingProfile, error: fetchError } = await supabase
        .from('user_profile')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 means no rows found
        throw fetchError;
      }

      let updateError = null;
      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('user_profile')
          .update({
            display_name: displayName,
            email: email, // If you allow email update in user_profile
            avatar_url: avatarUrl, // Include avatarUrl in the update
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
        updateError = error;
      } else {
        // Insert new profile if it doesn't exist
        const { error } = await supabase.from('user_profile').insert({
          user_id: user.id,
          display_name: displayName,
          email: email,
          avatar_url: avatarUrl,
        });
        updateError = error;
      }

      if (updateError) {
        throw updateError;
      }

      toast({
        title: '프로필 저장됨',
        description: '프로필 정보가 성공적으로 업데이트되었습니다.',
      });
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error saving profile:', error.message);
      toast({
        title: '저장 실패',
        description: `프로필 저장 중 오류가 발생했습니다: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [displayName, email, avatarUrl, user?.id, toast]);

  const handleAvatarChange = () => fileInputRef.current?.click();

  const onAvatarFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) {
      toast({
        title: '파일 선택 실패',
        description: '파일을 선택하거나 사용자 정보를 찾을 수 없습니다.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true); // Indicate saving because upload is part of saving profile
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`; // Use user ID for unique filename
      const filePath = `public/${fileName}`; // Or simply `fileName` if your bucket is public

      const { error: uploadError } = await supabase.storage
        .from('avatars') // Replace 'avatars' with your actual Supabase Storage bucket name
        .upload(filePath, file, {
          upsert: true, // Overwrite if file with same name exists
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL of the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (publicUrlData) {
        setAvatarUrl(publicUrlData.publicUrl); // Update the avatarUrl state
        toast({
          title: '사진 업로드 완료',
          description:
            '새로운 아바타가 성공적으로 업로드되었습니다. 저장을 눌러 적용하세요.',
        });
      } else {
        throw new Error('Public URL not found after upload.');
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error.message);
      toast({
        title: '사진 업로드 실패',
        description: `아바타 업로드 중 오류가 발생했습니다: ${error.message}`,
        variant: 'destructive',
      });
      setAvatarUrl(userProfile?.avatar_url || ''); // Revert to previous avatar if upload fails
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex justify-between items-center flex-row">
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            프로필 정보
          </CardTitle>
          <div className="flex justify-end space-x-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  취소
                </Button>
                <Button onClick={handleSaveProfile} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
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
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={avatarUrl || ''} // Use the avatarUrl state
              />
              <AvatarFallback className="text-lg">
                {getInitials(displayName || email)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              {isEditing && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onAvatarFileChange}
                    accept="image/png, image/jpeg"
                    style={{ display: 'none' }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAvatarChange}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    사진 변경
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    JPG, PNG 파일. 2MB 이하.
                  </p>
                </>
              )}
              <div className="flex items-center gap-2 pt-2">
                <Badge variant="secondary" className="text-sm">
                  <Award className="h-3 w-3 mr-1" />
                  Level {Math.floor(stats.totalNotes / 10) + 1}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  {stats.completedReminders} 포인트
                </Badge>
              </div>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">표시 이름</Label>
              {isEditing ? (
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="이름을 입력하세요"
                />
              ) : (
                <p className="text-lg font-medium pt-1">
                  {displayName || '이름 없음'}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              {isEditing ? (
                <Input id="email" value={email} disabled type="email" />
              ) : (
                <p className="text-lg font-medium pt-1">{email}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="h-5 w-5 mr-2" />
            업적
          </CardTitle>
        </CardHeader>
        <CardContent>
          {achievements.filter((a) => a.unlocked).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {achievements.map((ach) => (
                <div
                  key={ach.id}
                  className={`p-3 rounded-lg border transition-all ${
                    ach.unlocked
                      ? 'bg-muted/50 border-primary/20'
                      : 'bg-muted/20 border-muted opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`p-1 rounded ${
                        ach.unlocked
                          ? ach.color + ' text-white'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {ach.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{ach.title}</h4>
                    </div>
                    {ach.unlocked && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {ach.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="mx-auto h-12 w-12" />
              <p className="mt-4">아직 달성한 업적이 없습니다.</p>
              <p>노트 작성과 리마인더 완료를 통해 업적을 달성해보세요!</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            빠른 통계
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatItem
              value={stats.streak}
              label="연속 일수"
              color="text-blue-500"
            />
            <StatItem
              value={stats.todayCompleted}
              label="오늘 완료"
              color="text-green-500"
            />
            <StatItem
              value={`${Math.round(stats.completionRate)}%`}
              label="완료율"
              color="text-purple-500"
            />
            <StatItem
              value={stats.weeklyAverage}
              label="주간 평균"
              color="text-orange-500"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// 활동 탭
const ActivityTab = ({
  stats,
  activityData,
  reminders,
}: {
  stats: any;
  activityData: ActivityData[];
  reminders: Reminder[];
}) => {
  const completionRates = useMemo(() => {
    if (!reminders || reminders.length === 0) {
      return { weekly: 0, monthly: 0 };
    }

    const now = new Date();
    // 이번 주의 시작(월요일)을 계산합니다.
    const weekStart = new Date(now);
    weekStart.setDate(
      now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1),
    );
    weekStart.setHours(0, 0, 0, 0);

    // 이번 달의 시작(1일)을 계산합니다.
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const weeklyReminders = reminders.filter(
      (r) => r.reminder_time && new Date(r.reminder_time) >= weekStart,
    );
    const monthlyReminders = reminders.filter(
      (r) => r.reminder_time && new Date(r.reminder_time) >= monthStart,
    );

    const weeklyCompleted = weeklyReminders.filter((r) => r.completed).length;
    const monthlyCompleted = monthlyReminders.filter((r) => r.completed).length;

    const weeklyRate =
      weeklyReminders.length > 0
        ? (weeklyCompleted / weeklyReminders.length) * 100
        : 0;
    const monthlyRate =
      monthlyReminders.length > 0
        ? (monthlyCompleted / monthlyReminders.length) * 100
        : 0;

    return {
      weekly: Math.round(weeklyRate),
      monthly: Math.round(monthlyRate),
    };
  }, [reminders]);

  const getLevelColor = (level: number) => {
    const colors = [
      'bg-muted',
      'bg-green-200',
      'bg-green-300',
      'bg-green-400',
      'bg-green-500',
    ];
    return colors[level] || 'bg-muted';
  };

  const renderActivityHeatmap = () => {
    if (activityData.every((d) => d.count === 0)) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="mx-auto h-12 w-12" />
          <p className="mt-4">활동 기록이 없습니다.</p>
          <p>리마인더를 완료하여 활동 기록을 남겨보세요.</p>
        </div>
      );
    }

    const weeks: ActivityData[][] = [];
    let currentWeek: ActivityData[] = Array(7).fill(null);
    activityData.forEach((day) => {
      const dayIndex = new Date(day.date).getDay();
      currentWeek[dayIndex] = day;
      if (dayIndex === 6) {
        // Sunday
        weeks.push(currentWeek);
        currentWeek = Array(7).fill(null);
      }
    });
    if (currentWeek.some((d) => d !== null)) weeks.push(currentWeek);

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>지난 1년간 {stats.completedReminders}개의 리마인더 완료</span>
          <div className="flex items-center gap-1 text-xs">
            적음{' '}
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`w-2.5 h-2.5 rounded-sm ${getLevelColor(level)}`}
              />
            ))}{' '}
            많음
          </div>
        </div>
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) =>
                  day ? (
                    <div
                      key={day.date}
                      className={`w-3.5 h-3.5 rounded-sm ${getLevelColor(
                        day.level,
                      )} hover:ring-2 hover:ring-primary cursor-pointer transition-all`}
                      title={`${day.date}: ${day.count}개 완료`}
                    />
                  ) : (
                    <div
                      key={dayIndex}
                      className="w-3.5 h-3.5 rounded-sm bg-transparent"
                    />
                  ),
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            활동 히트맵
          </CardTitle>
        </CardHeader>
        <CardContent className="custom-scrollbar">
          {renderActivityHeatmap()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            상세 통계
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatItem
              icon={<FileText />}
              value={stats.totalNotes}
              label="총 노트"
            />
            <StatItem
              icon={<Calendar />}
              value={stats.totalReminders}
              label="총 리마인더"
            />
            <StatItem
              icon={<CheckCircle />}
              value={stats.completedReminders}
              label="완료된 리마인더"
            />
            <StatItem
              icon={<Tag />}
              value={stats.tagsUsed}
              label="사용된 태그"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>완료율 분석</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">이번 주 완료율</span>
                {/* ✅ 정의된 completionRates 변수를 여기서 사용합니다. */}
                <span className="text-sm font-bold">
                  {completionRates.weekly}%
                </span>
              </div>
              <CustomProgress value={completionRates.weekly} />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">이번 달 완료율</span>
                <span className="text-sm font-bold">
                  {completionRates.monthly}%
                </span>
              </div>
              <CustomProgress value={completionRates.monthly} />
            </div>
            <Separator />
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">전체 완료율</span>
                <span className="text-sm font-bold">
                  {Math.round(stats.completionRate)}%
                </span>
              </div>
              <CustomProgress value={stats.completionRate} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// 설정 탭
const SettingsTab = ({ user, handleLogout }) => {
  const { toast } = useToast();
  // 알림 설정 상태
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [reminderNotifications, setReminderNotifications] = useState(true);
  const [achievementNotifications, setAchievementNotifications] =
    useState(true);

  // 목표 설정 상태
  const [dailyGoal, setDailyGoal] = useState('5');
  const [weeklyGoal, setWeeklyGoal] = useState('10');
  const [isSavingGoals, setIsSavingGoals] = useState(false);

  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const { permission, requestPermission } = useNotificationPermission();

  const handleReminderToggle = async (checked: boolean) => {
    if (checked) {
      if (permission === 'default') {
        const result = await requestPermission();
        if (result === 'denied') {
          setReminderNotifications(false);
          return;
        }
      } else if (permission === 'denied') {
        setShowPermissionDialog(true);
        setReminderNotifications(false);
        return;
      }
    }

    setReminderNotifications(checked);
  };

  const handleTestNotification = useCallback(() => {
    toast({
      title: '🔔 테스트 알림',
      description:
        '알림이 이렇게 표시됩니다. 브라우저 밖 알림도 표시되는지 확인해주세요. 만약, 보이지 않느다면 알림 설정을 허용해주세요.',
      duration: 5000,
    });

    sendReminderNotification(
      'TEST ALARM',
      '테스트 알림입니다. 리마인더가 성공적으로 작동합니다.',
    );
  }, [toast]);

  const handleSaveGoals = useCallback(async () => {
    setIsSavingGoals(true);
    try {
      // TODO: 목표 저장 API 연동
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast({
        title: '목표 저장됨',
        description: '새로운 목표가 성공적으로 저장되었습니다.',
      });
    } catch (error) {
      toast({
        title: '저장 실패',
        description: '목표 저장 중 오류 발생',
        variant: 'destructive',
      });
    } finally {
      setIsSavingGoals(false);
    }
  }, [dailyGoal, weeklyGoal, toast]);

  const handleExportData = () => {
    // TODO: 데이터 내보내기 로직 구현 (JSON, CSV 등)
    toast({
      title: '기능 준비 중',
      description: '데이터 내보내기 기능은 현재 준비 중입니다.',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            알림 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/*           
          <SettingSwitchItem
            id="email-noti"
            label="이메일 알림"
            description="중요한 알림을 이메일로 받습니다"
            checked={emailNotifications}
            onCheckedChange={setEmailNotifications}
            icon={<Mail />}
          /> */}
          <Dialog
            open={showPermissionDialog}
            onOpenChange={setShowPermissionDialog}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>알림 권한 설정</DialogTitle>
                <DialogDescription>
                  브라우저에서 알림이 차단되어 있습니다. 리마인더 알림을
                  받으려면 브라우저 설정을 변경해주세요.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm">
                  <p className="font-medium mb-2">설정 방법:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Chrome: 주소창 왼쪽 자물쇠 → 알림 허용</li>
                    <li>• Firefox: 주소창 왼쪽 방패 → 알림 허용</li>
                    <li>• Safari: Safari 메뉴 → 설정 → 웹사이트 → 알림</li>
                  </ul>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowPermissionDialog(false)}
                  >
                    닫기
                  </Button>
                  <Button
                    onClick={() => {
                      setShowPermissionDialog(false);
                      window.location.reload(); // 설정 후 새로고침
                    }}
                  >
                    설정 완료
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <SettingSwitchItem
            id="reminder-noti"
            label="리마인더 알림"
            description={
              permission === 'denied'
                ? '브라우저 알림이 차단되어 있습니다'
                : '리마인더 시간에 알림을 받습니다'
            }
            checked={reminderNotifications && permission === 'granted'}
            onCheckedChange={handleReminderToggle}
            icon={<Calendar />}
          />
          <SettingSwitchItem
            id="achievement-noti"
            label="업적 알림"
            description="새로운 업적 달성 시 알림을 받습니다"
            checked={achievementNotifications}
            onCheckedChange={setAchievementNotifications}
            icon={<Trophy />}
          />
          <Separator />
          <div className="pt-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleTestNotification}
            >
              <Bell className="h-4 w-4 mr-2" />
              테스트 알림 보내기
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            목표 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dailyGoal">일일 목표 (리마인더 완료 수)</Label>
            <Input
              id="dailyGoal"
              type="number"
              placeholder="5"
              min="1"
              max="50"
              value={dailyGoal}
              onChange={(e) => setDailyGoal(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weeklyGoal">주간 목표 (노트 작성 수)</Label>
            <Input
              id="weeklyGoal"
              type="number"
              placeholder="10"
              min="1"
              max="100"
              value={weeklyGoal}
              onChange={(e) => setWeeklyGoal(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            onClick={handleSaveGoals}
            disabled={isSavingGoals}
          >
            {isSavingGoals ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            목표 저장
          </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>가입일</Label>
              <Input
                value={
                  user?.created_at
                    ? new Date(user.created_at).toLocaleDateString('ko-KR')
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
                    ? new Date(user.last_sign_in_at).toLocaleString('ko-KR')
                    : ''
                }
                disabled
              />
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-destructive">위험 구역</h3>
            <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg space-y-4">
              <p className="text-sm text-destructive">
                이 작업들은 되돌릴 수 없으니 신중하게 진행해주세요.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleExportData}>
                  <Package className="h-4 w-4 mr-2" />
                  데이터 내보내기
                </Button>
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
                        현재 세션에서 로그아웃됩니다. 저장되지 않은 변경사항은
                        손실될 수 있습니다.
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
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="flex-1">
                      계정 삭제
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-destructive">
                        정말로 계정을 삭제하시겠습니까?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        이 작업은 되돌릴 수 없습니다. 회원님의 모든 노트와 활동
                        기록이 영구적으로 삭제됩니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        삭제하기
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// --- 재사용 가능한 작은 컴포넌트들 ---
const StatItem = ({ icon, value, label, color = 'text-foreground' }) => (
  <div className="text-center p-2">
    {icon && <div className={`h-8 w-8 mx-auto mb-2 ${color}`}>{icon}</div>}
    <div className={`text-2xl font-bold ${color}`}>{value}</div>
    <div className="text-sm text-muted-foreground">{label}</div>
  </div>
);

const SettingSwitchItem = ({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  icon,
}) => (
  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
    <div className="flex items-center space-x-3">
      {icon && (
        <span className="text-muted-foreground">
          {React.cloneElement(icon, { className: 'h-5 w-5' })}
        </span>
      )}
      <div className="space-y-0.5">
        <Label htmlFor={id} className="text-base font-medium">
          {label}
        </Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
    <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);
