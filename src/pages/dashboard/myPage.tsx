import React, { useState, useMemo, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useNotes } from '@/hooks/useNotes';
import { ProfileTab } from '@/components/features/dashboard/myPage/ProfileTab';
import { ActivityTab } from '@/components/features/dashboard/myPage/ActivityTab';
import { SettingsTab } from '@/components/features/dashboard/myPage/SettingsTab';
import { useThemeStore } from '@/stores/themeStore';
import { Note, Reminder } from '@/types';

const TABS = [
  { id: 'profile', label: '프로필' },
  { id: 'activity', label: '활동' },
  { id: 'settings', label: '설정' },
];

export default function MyPage() {
  const { user } = useAuthStore();
  const { notes } = useNotes();
  const { theme } = useThemeStore();
  const [activeTab, setActiveTab] = useState('profile');

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

    // Streak, today's completed, weekly average logic would be more complex
    // For now, placeholder values
    return {
      totalNotes,
      totalReminders,
      completedReminders,
      completionRate,
      tagsUsed: tags.size,
      streak: 0,
      todayCompleted: 0,
      weeklyAverage: 0,
    };
  }, [notes]);

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
    // This should be a full year of data, for now, just what we have
    return Array.from(data.entries()).map(([date, count]) => ({
      date,
      count,
      level: Math.min(4, count),
    }));
  }, [notes]);

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'activity':
        return <ActivityTab stats={stats} activityData={activityData} />;
      case 'settings':
        return <SettingsTab />;
      case 'profile':
      default:
        return <ProfileTab stats={stats} achievements={[]} />;
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div
      className={`min-h-screen ${
        theme === 'dark' ? 'dark' : ''
      } bg-background text-foreground`}
    >
      <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">마이 페이지</h1>
          <p className="text-muted-foreground mt-2">
            프로필, 활동 및 설정을 관리하세요.
          </p>
        </header>

        <div className="flex border-b mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div>{renderContent()}</div>
      </div>
    </div>
  );
}
