import React, { useMemo, useCallback, useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useNotes } from '@/hooks/useNotes';
import { ProfileTab } from '@/components/features/dashboard/myPage/ProfileTab';
import { ActivityTab } from '@/components/features/dashboard/myPage/ActivityTab';
import { SettingsTab } from '@/components/features/dashboard/myPage/SettingsTab';
import { useThemeStore } from '@/stores/themeStore';
import { Note, Reminder, Achievement } from '@/types';
import {
  User,
  BarChart3,
  Settings,
  FileText,
  Bell,
  CheckCircle,
  Trophy,
} from 'lucide-react';

const TABS = [
  { id: 'profile', label: '프로필', icon: <User /> },
  { id: 'activity', label: '활동', icon: <BarChart3 /> },
  { id: 'settings', label: '설정', icon: <Settings /> },
];

export default function MyPage() {
  const { user } = useAuthStore();
  const { notes } = useNotes();
  const { isDarkMode, isDeepDarkMode, setTheme } = useThemeStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeTab = searchParams.get('tab') || 'profile';

  const setActiveTab = useCallback(
    (newTab: string) => {
      setSearchParams({ tab: newTab });
    },
    [setSearchParams],
  );

  useEffect(() => {
    const newTab = searchParams.get('tab');
    if (newTab && TABS.some((t) => t.id === newTab)) {
      // This effect is to sync state from URL, but we are already using searchParams directly.
      // It can be useful if you have a separate state `activeTab` and want to sync it.
    }
  }, [searchParams]);

  const handleKeyboardShortcuts = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      const pageShortcuts: { [key: string]: () => void } = {
        t: () => setTheme(isDarkMode || isDeepDarkMode ? 'light' : 'dark'),
        m: () => navigate('/dashboard/myPage?tab=profile'),
        ',': () => navigate('/dashboard/myPage?tab=activity'),
        '.': () => navigate('/dashboard/myPage?tab=settings'),
        '/': () => navigate('/dashboard/help?tab=overview'),
        '?': () => navigate('/dashboard/help?tab=overview'),
        escape: () => navigate('/dashboard'),
      };

      if (key === 'tab') {
        e.preventDefault();
        const currentTabIndex = TABS.findIndex((t) => t.id === activeTab);
        const nextTab = TABS[(currentTabIndex + 1) % TABS.length];
        setActiveTab(nextTab.id);
        return;
      }

      const handler = pageShortcuts[key];
      if (handler) {
        e.preventDefault();
        handler();
      }
    },
    [navigate, setTheme, isDarkMode, isDeepDarkMode, setActiveTab, activeTab],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () => {
      document.removeEventListener('keydown', handleKeyboardShortcuts);
    };
  }, [handleKeyboardShortcuts]);

  const stats = useMemo(() => {
    const totalNotes = notes.length;
    const allReminders = notes.flatMap((note: Note) => note.reminders || []);
    const totalReminders = allReminders.length;
    const completedReminders = allReminders.filter(
      (r: Reminder) => r.completed,
    ).length;
    const completionRate =
      totalReminders > 0 ? (completedReminders / totalReminders) * 100 : 0;
    const tags = new Set(notes.flatMap((note: Note) => note.tags || []));

    // Streak, todayCompleted, weeklyAverage calculation would be more complex
    // and require more detailed data. Using placeholders for now.
    return {
      totalNotes,
      totalReminders,
      completedReminders,
      completionRate,
      tagsUsed: tags.size,
      streak: 0, // Placeholder
      todayCompleted: 0, // Placeholder
      weeklyAverage: 0, // Placeholder
    };
  }, [notes]);

  const achievements: Achievement[] = useMemo(() => {
    const achievementList: Omit<Achievement, 'unlocked'>[] = [
      {
        id: 'note-1',
        title: '첫 노트 작성',
        description: '첫 번째 노트를 작성했습니다!',
        icon: <FileText />,
        color: 'bg-blue-500',
      },
      {
        id: 'note-10',
        title: '노트 열혈가',
        description: '10개의 노트를 작성했습니다.',
        icon: <FileText />,
        color: 'bg-blue-600',
      },
      {
        id: 'reminder-1',
        title: '첫 리마인더 완료',
        description: '첫 번째 리마인더를 완료했습니다!',
        icon: <Bell />,
        color: 'bg-yellow-500',
      },
      {
        id: 'reminder-20',
        title: '리마인더 정복자',
        description: '20개의 리마인더를 완료했습니다.',
        icon: <Bell />,
        color: 'bg-yellow-600',
      },
      {
        id: 'completion-50',
        title: '절반의 성공',
        description: '리마인더 완료율 50% 달성',
        icon: <CheckCircle />,
        color: 'bg-green-500',
      },
      {
        id: 'completion-100',
        title: '완벽주의자',
        description: '리마인더 완료율 100% 달성',
        icon: <Trophy />,
        color: 'bg-green-600',
      },
    ];

    return achievementList.map((ach) => {
      let unlocked = false;
      switch (ach.id) {
        case 'note-1':
          unlocked = stats.totalNotes >= 1;
          break;
        case 'note-10':
          unlocked = stats.totalNotes >= 10;
          break;
        case 'reminder-1':
          unlocked = stats.completedReminders >= 1;
          break;
        case 'reminder-20':
          unlocked = stats.completedReminders >= 20;
          break;
        case 'completion-50':
          unlocked = stats.completionRate >= 50;
          break;
        case 'completion-100':
          unlocked = stats.completionRate === 100;
          break;
      }
      return { ...ach, unlocked };
    });
  }, [stats]);

  const activityData = useMemo(() => {
    const data = new Map<string, number>();
    notes.forEach((note: Note) => {
      (note.reminders || []).forEach((r: Reminder) => {
        if (r.completed && r.updated_at) {
          const date = new Date(r.updated_at).toISOString().split('T')[0];
          data.set(date, (data.get(date) || 0) + 1);
        }
      });
    });

    const sortedData = Array.from(data.entries()).sort(
      ([dateA], [dateB]) =>
        new Date(dateA).getTime() - new Date(dateB).getTime(),
    );

    return sortedData.map(([date, count]) => ({
      date,
      count,
      level: Math.min(4, Math.ceil(count / 2)),
    }));
  }, [notes]);

  const renderContent = () => {
    switch (activeTab) {
      case 'activity':
        return <ActivityTab stats={stats} activityData={activityData} />;
      case 'settings':
        return <SettingsTab />;
      case 'profile':
      default:
        return <ProfileTab stats={stats} achievements={achievements} />;
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div
      className={`p-4 md:p-6 lg:p-8 bg-background text-foreground custom-scrollbar h-full overflow-y-auto theme-${
        isDarkMode ? (isDeepDarkMode ? 'deepdark' : 'dark') : 'light'
      }`}
    >
      <Toaster />
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">마이 페이지</h1>
          <p className="text-muted-foreground mt-2">
            프로필, 활동 및 설정을 관리하세요.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-1">
            <ul className="space-y-2 sticky top-8">
              {TABS.map(({ id, label, icon }) => (
                <li key={id}>
                  <button
                    onClick={() => setActiveTab(id)}
                    className={`w-full flex items-center p-2 rounded-md text-sm transition-colors ${
                      activeTab === id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    {React.cloneElement(icon, { className: 'h-4 w-4 mr-2' })}
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-4 space-y-6">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
}
