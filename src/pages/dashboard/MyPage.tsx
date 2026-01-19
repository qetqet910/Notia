import React, { useCallback } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { ProfileTab } from '@/components/features/dashboard/myPage/ProfileTab';
import { ActivityTab } from '@/components/features/dashboard/myPage/ActivityTab';
import { SettingsTab } from "@/components/features/dashboard/myPage/SettingsTab";
import { TabErrorBoundary } from '@/components/providers/TabErrorBoundary';
import { usePageShortcuts } from '@/hooks/usePageShortcuts';
import User from 'lucide-react/dist/esm/icons/user';
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3';
import Settings from 'lucide-react/dist/esm/icons/settings';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const TABS = [
  { id: 'profile', label: '프로필', icon: <User /> },
  { id: 'activity', label: '활동', icon: <BarChart3 /> },
  { id: 'settings', label: '설정', icon: <Settings /> },
];

export default function MyPage() {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeTab = searchParams.get('tab') || 'profile';

  const setActiveTab = useCallback(
    (newTab: string) => {
      setSearchParams({ tab: newTab });
    },
    [setSearchParams],
  );

  usePageShortcuts({
    activeTab,
    setActiveTab,
    tabs: TABS.map((t) => t.id),
  });

  const renderContent = () => {
    let content;
    switch (activeTab) {
      case 'activity':
        content = <ActivityTab />;
        break;
      case 'settings':
        content = <SettingsTab />;
        break;
      case 'profile':
      default:
        content = <ProfileTab />;
        break;
    }

    return (
      <TabErrorBoundary key={activeTab}>
        {content}
      </TabErrorBoundary>
    );
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div
      className={`p-4 md:p-6 lg:p-8 bg-background text-foreground min-h-screen w-full`}
    >
      <Toaster />
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="rounded-full"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">마이 페이지</h1>
            <p className="text-muted-foreground mt-1">
              프로필, 활동 및 설정을 관리하세요.
            </p>
          </div>
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
