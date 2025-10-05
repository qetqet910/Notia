import React, { useCallback, useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { ProfileTab } from '@/components/features/dashboard/myPage/ProfileTab';
import { ActivityTab } from '@/components/features/dashboard/myPage/ActivityTab';
import { SettingsTab } from '@/components/features/dashboard/myPage/SettingsTab';
import { useThemeStore } from '@/stores/themeStore';
import User from 'lucide-react/dist/esm/icons/user';
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3';
import Settings from 'lucide-react/dist/esm/icons/settings';

const TABS = [
  { id: 'profile', label: '프로필', icon: <User /> },
  { id: 'activity', label: '활동', icon: <BarChart3 /> },
  { id: 'settings', label: '설정', icon: <Settings /> },
];

export default function MyPage() {
  const { user } = useAuthStore();
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

  const renderContent = () => {
    switch (activeTab) {
      case 'activity':
        return <ActivityTab />;
      case 'settings':
        return <SettingsTab />;
      case 'profile':
      default:
        return <ProfileTab />;
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div
      className={`p-4 md:p-6 lg:p-8 bg-background text-foreground no-scrollbar theme-${
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
