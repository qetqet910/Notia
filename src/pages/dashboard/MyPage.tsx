import React, { useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
import { Toaster } from '@/components/ui/toaster';

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
        <Toaster />
      </TabErrorBoundary>
    );
  };

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">사용자 정보 확인 중...</div>
      </div>
    );
  }

  return (
    <div
      className="p-4 md:p-6 lg:p-8 bg-background text-foreground min-h-screen w-full"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="rounded-full hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">마이 페이지</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              프로필, 활동 및 설정을 관리하세요.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-1">
            <nav className="sticky top-8 space-y-1">
              {TABS.map(({ id, label, icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === id
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {React.cloneElement(icon, { className: 'h-4 w-4 mr-3 opacity-80' })}
                  {label}
                </button>
              ))}
            </nav>
          </div>
          <div className="md:col-span-4 space-y-6">
            <div className="bg-card rounded-xl border border-border/50 shadow-sm p-1 min-h-[500px]">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
