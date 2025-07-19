import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserProfile } from '@/components/features/dashboard/userProfile';
import { Toaster } from '@/components/ui/toaster';
import { DashboardHeader } from '@/components/layout/dashboardHeader';
import { useToast } from '@/hooks/useToast';
import { useNotes } from '@/hooks/useNotes';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { supabase } from '@/services/supabaseClient';
import {
  User,
  Settings,
  FileText,
  BarChart3,
  ArrowLeft,
  Tag,
  CheckCircle,
  Star,
  Flame,
  Trophy,
} from 'lucide-react';

import logoImage from '@/assets/images/Logo.png';
import logoDarkImage from '@/assets/images/LogoDark.png';
import { Reminder, Note } from '@/types/index';
import { Achievement, ActivityData } from '@/types/index';
import { ActivityTab } from '@/components/features/dashboard/myPage/ActivityTab';
import { SettingsTab } from '@/components/features/dashboard/myPage/SettingsTab';
import { ProfileTab } from '@/components/features/dashboard/myPage/ProfileTab';

// --- Main MyPage Component ---
export const MyPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDarkMode, isDeepDarkMode, setTheme } = useThemeStore();
  const { notes } = useNotes() as { notes: Note[] };
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isToggleTheme, setisToggleTheme] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') ?? 'profile';
  const [isActiveTab, setIsActiveTab] = useState(0); // For Tab keyboard shortcut
  const activeTabs = useMemo(() => ['profile', 'activity', 'settings'], []);

  const { user, signOut, fetchUserProfile } = useAuthStore();

  const fetchReminders = useCallback(async (userId: string) => {
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
      fetchUserProfile(user.id);
    }
  }, [user?.id, fetchReminders, fetchUserProfile]);

  const SIMPLE_SHORTCUTS: { [key: string]: () => void } = useMemo(
    () => ({
      '/': () => navigate('/dashboard/help?tab=overview'),
      '?': () => navigate('/dashboard/help?tab=overview'),
      t: () => {
        setisToggleTheme((prev) => !prev);
        setTheme(isToggleTheme ? 'light' : 'dark'); // Corrected toggle logic
      },
      Tab: () => {
        setIsActiveTab((prev) => (prev + 1) % activeTabs.length);
        handleTabChange(activeTabs[(isActiveTab + 1) % activeTabs.length]); // Ensure tab change happens with updated isActiveTab
      },
      m: () => navigate('/dashboard/myPage?tab=profile'),
      ',': () => navigate('/dashboard/myPage?tab=activity'),
      '<': () => navigate('/dashboard/myPage?tab=activity'),
      '.': () => navigate('/dashboard/myPage?tab=settings'),
      '>': () => navigate('/dashboard/myPage?tab=settings'),
      Escape: () => navigate('/dashboard'),
      Backspace: () => navigate('/dashboard'),
    }),
    [
      navigate,
      setisToggleTheme,
      setTheme,
      isToggleTheme,
      isActiveTab,
      activeTabs,
    ],
  );

  const handleKeyboardShortcuts = useCallback(
    (e: KeyboardEvent) => {
      const isCtrlCmd = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement;

      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        if (!(isCtrlCmd && e.key === 's')) return;
      }

      const handler = SIMPLE_SHORTCUTS[e.key];

      if (handler) {
        e.preventDefault();
        handler();
      }
    },
    [SIMPLE_SHORTCUTS],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () =>
      document.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [handleKeyboardShortcuts]);

  const handleTabChange = useCallback(
    (newTab: string) => {
      setSearchParams({ tab: newTab });
      setIsActiveTab(activeTabs.indexOf(newTab)); // Keep isActiveTab in sync with URL tab
    },
    [setSearchParams, activeTabs],
  );

  useEffect(() => {
    // Initialize tab state from URL on first load
    const currentTab = searchParams.get('tab') ?? 'profile';
    setIsActiveTab(activeTabs.indexOf(currentTab));
  }, [searchParams, activeTabs]);

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

  const stats = useMemo(() => {
    const allReminders = reminders;
    const completedReminders = allReminders.filter((r) => r.completed);
    const today = new Date();
    const todayISO = today.toISOString().split('T')[0];

    const todayCompleted = completedReminders.filter((r) =>
      r.updated_at.startsWith(todayISO),
    ).length;

    // 연속 일수 (streak) 계산
    const completionDates = [
      ...new Set(completedReminders.map((r) => r.updated_at.split('T')[0])),
    ].sort();

    let currentStreak = 0;
    if (completionDates.length > 0) {
      let tempDate = new Date(today);
      // 오늘 완료했으면 오늘부터, 아니면 어제부터
      const lastCompletedDay = completionDates[completionDates.length - 1];
      if (lastCompletedDay === todayISO) {
        currentStreak = 1;
      } else {
        tempDate.setDate(today.getDate() - 1);
        const yesterdayISO = tempDate.toISOString().split('T')[0];
        if (lastCompletedDay === yesterdayISO) {
          currentStreak = 1;
        } else {
          currentStreak = 0; // 어제도 완료 안 했으면 0
        }
      }

      if (currentStreak > 0) {
        // 어제부터 역순으로 탐색하며 연속일수 계산
        let checkDate = new Date(today);
        if (lastCompletedDay === todayISO) {
          // 오늘 완료했으면 오늘부터 카운트
          checkDate.setDate(today.getDate());
        } else {
          // 어제 완료했으면 어제부터 카운트 (오늘을 건너뛰기 위함)
          checkDate.setDate(today.getDate() - 1);
        }

        for (let i = completionDates.length - 1; i >= 0; i--) {
          const dateStr = completionDates[i];
          const dateObj = new Date(dateStr);

          const dayDifference = Math.round(
            (checkDate.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24),
          );

          if (dayDifference === 0) {
            // 오늘/현재 날짜
            // 이미 카운트되었거나, 첫 시작점
          } else if (dayDifference === 1) {
            // 하루 전
            currentStreak++;
          } else {
            break; // 연속성 끊김
          }
          checkDate.setDate(checkDate.getDate() - 1); // 날짜를 하루씩 감소시키면서 확인
        }
      }
    }

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weeklyCompletedCount = completedReminders.filter(
      (r) => new Date(r.updated_at) >= sevenDaysAgo,
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
      streak: currentStreak, // 업데이트된 streak 사용
      weeklyAverage,
    };
  }, [notes, reminders]);

  const activityData = useMemo((): ActivityData[] => {
    const data: { [date: string]: number } = {};
    const completedReminders = reminders.filter((r) => r.completed);

    completedReminders.forEach((r) => {
      const date = r.updated_at.split('T')[0];
      data[date] = (data[date] || 0) + 1;
    });

    const activityList: ActivityData[] = [];
    const today = new Date();
    // 지난 365일간의 데이터를 생성 (오늘 포함)
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      const count = data[dateString] || 0;
      // 활동 레벨: 0개 = 0, 1-2개 = 1, 3-4개 = 2, 5-6개 = 3, 7개 이상 = 4
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

        <DashboardHeader />

        <ScrollArea className="flex-1 mt-14">
          <div className="container mx-auto p-6 max-w-4xl">
            <Tabs
              value={tab}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">
                  <User className="h-4 w-4 mr-2" />
                  프로필
                </TabsTrigger>
                <TabsTrigger value="activity">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  활동
                </TabsTrigger>
                <TabsTrigger value="settings">
                  <Settings className="h-4 w-4 mr-2" />
                  설정
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <ProfileTab stats={stats} achievements={achievements} />
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

export default MyPage;
