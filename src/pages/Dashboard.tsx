import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Toaster } from '@/components/ui/toaster';
import { NoteList } from '@/components/features/dashboard/noteList';
import { Editor } from '@/components/features/dashboard/editor';
import { ReminderView } from '@/components/features/dashboard/reminder';
import { Calendar } from '@/components/features/dashboard/calendar';
import { TimelineView } from '@/components/features/dashboard/timelineView';
import { Search } from '@/components/features/dashboard/search';
import { UserProfile } from '@/components/features/dashboard/userProfile';
import { useAuthStore } from '@/stores/authStore';
import { useNotes } from '@/hooks/useNotes';
import { useSearch } from '@/hooks/useSearch';
import { supabase } from '@/services/supabaseClient';
import { TeamSpaceList } from '@/components/features/dashboard/teamSpace/teamSpaceList';
import {
  PlusCircle,
  Calendar as CalendarIcon,
  Clock,
  List,
  Search as SearchIcon,
  Menu,
} from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import logoImage from '@/assets/images/Logo.png';
import logoDarkImage from '@/assets/images/LogoDark.png';
import { Note, Reminder } from '@/types';

// 상수 분리
const NAV_ITEMS = [
  { id: 'notes', label: '노트', icon: List },
  { id: 'reminder', label: '리마인더', icon: Clock },
  { id: 'calendar', label: '캘린더', icon: CalendarIcon },
  { id: 'timeline', label: '타임라인', icon: List },
];

// 로딩 스피너 컴포넌트
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

// 빈 노트 상태 컴포넌트
const EmptyNoteState = ({
  handleCreateNote,
}: {
  handleCreateNote: () => void;
}) => (
  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
    <p>노트를 선택하거나 새로운 노트를 작성하세요</p>
    <Button variant="outline" className="mt-4" onClick={handleCreateNote}>
      <PlusCircle className="mr-2 h-4 w-4" />새 노트
    </Button>
  </div>
);

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('notes');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const { isDarkMode, isDeepDarkMode } = useThemeStore();
  const { notes, addNote, updateNote, updateNoteOnly, deleteNote } = useNotes();
  const { searchResults, setSearchQuery } = useSearch();
  const { session, isAuthenticated, isLoginLoading, checkSession } =
    useAuthStore();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  // 반응형 처리
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 인증 및 데이터 로딩 처리
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        const isAuth = await checkSession();
        if (!isAuth) {
          navigate('/login');
        }
      } catch (err) {
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, [navigate, checkSession]);

  // 로그인된 사용자의 리마인더 데이터 가져오기
  useEffect(() => {
    // 세션과 사용자 ID가 있을 때만 fetchReminders 호출
    if (session?.user?.id) {
      fetchReminders(session.user.id);
    }
  }, [session]); // session이 변경될 때마다 실행

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
    setIsEditing(false); // 항상 보기 모드로 시작
  };

  // Supabase에서 리마인더 가져오기
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
  }, []); // useCallback으로 감싸 불필요한 재선언 방지

  // 리마인더 완료 상태 업데이트
  const handleMarkCompleted = useCallback(
    async (reminderId: string, completed: boolean) => {
      const { error } = await supabase
        .from('reminders')
        .update({ completed, updated_at: new Date().toISOString() })
        .eq('id', reminderId);

      if (error) {
        console.error('Error updating reminder:', error);
      } else {
        setReminders((prev) =>
          prev.map((r) => (r.id === reminderId ? { ...r, completed } : r)),
        );
      }
    },
    [],
  );

  // 리마인더 활성화 상태 업데이트
  const handleToggleReminder = useCallback(
    async (reminderId: string, enabled: boolean) => {
      const { error } = await supabase
        .from('reminders')
        .update({ enabled, updated_at: new Date().toISOString() })
        .eq('id', reminderId);

      if (error) {
        console.error('Error toggling reminder:', error);
      } else {
        setReminders((prev) =>
          prev.map((r) => (r.id === reminderId ? { ...r, enabled } : r)),
        );
      }
    },
    [],
  );

  // 리마인더 삭제 업데이트
  const handleDeleteReminder = useCallback(
    async (reminderId: string) => {
      const reminderToDelete = reminders.find((r) => r.id === reminderId);
      if (!reminderToDelete) return;

      const targetNote = notes.find(
        (note) => note.id === reminderToDelete.note_id,
      );
      if (!targetNote) return;

      // 1. DB에서 리마인더 삭제
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', reminderId);

      if (error) {
        console.error('Error delete reminder:', error);
        return;
      }

      const updatedContent = targetNote.content.replace(
        `@${reminderToDelete.original_text}.`,
        '',
      );

      const updatedNote = {
        ...targetNote,
        content: updatedContent,
      };

      // 3. 리마인더 처리 없이 노트만 업데이트
      await updateNoteOnly(updatedNote);

      // 4. selectedNote가 업데이트된 노트와 같다면 상태도 업데이트
      if (selectedNote?.id === targetNote.id) {
        setSelectedNote(updatedNote);
      }

      // 5. 리마인더 목록에서 제거
      setReminders((prev) => prev.filter((r) => r.id !== reminderId));
    },
    [
      reminders,
      notes,
      updateNoteOnly,
      selectedNote,
      setSelectedNote,
      setReminders,
    ],
  );

  // 새 노트 생성
  const handleCreateNote = useCallback(async () => {
    const newNoteData = { title: '새로운 노트', content: '', tags: [] };
    const newNote = await addNote(newNoteData);
    if (newNote) {
      setSelectedNote(newNote);
      setActiveTab('notes');
      setIsEditing(true); // 새 노트는 바로 편집 모드로
    }
  }, [addNote]);

  const logoSrc = useMemo(
    () => (isDarkMode || isDeepDarkMode ? logoDarkImage : logoImage),
    [isDarkMode, isDeepDarkMode],
  );

  if (isLoginLoading || isLoading) {
    return <LoadingSpinner />;
  }

  // 메인 컨텐츠 렌더링 함수
  const renderMainContent = () => {
    switch (activeTab) {
      case 'notes':
        return (
          <div className="flex h-full">
            {/* ❗️ isEditing 상태에 따라 NoteList 너비가 조절됩니다. */}
            <div
              className={`h-full overflow-y-auto border-r border-border transition-all duration-300 ease-in-out ${
                isEditing ? 'w-0 opacity-0 md:w-0' : 'w-full md:w-1/3'
              }`}
            >
              <NoteList
                notes={notes}
                onSelectNote={handleSelectNote} // 변경된 핸들러 사용
                selectedNote={selectedNote}
              />
            </div>

            {/* ❗️ isEditing 상태에 따라 Editor 너비가 조절됩니다. */}
            <div
              className={`h-full transition-all duration-300 ease-in-out ${
                isEditing ? 'w-full' : 'hidden md:block w-2/3'
              }`}
            >
              {selectedNote ? (
                <Editor
                  key={selectedNote.id}
                  note={selectedNote}
                  onSave={updateNote}
                  onDelete={() => {
                    if (selectedNote) {
                      deleteNote(selectedNote.id);
                      setSelectedNote(null);
                      setIsEditing(false); // 노트 삭제 시 편집 모드 해제
                    }
                  }}
                  // ❗️ isEditing 상태와 핸들러를 props로 전달합니다.
                  isEditing={isEditing}
                  setIsEditing={setIsEditing}
                />
              ) : (
                <EmptyNoteState handleCreateNote={handleCreateNote} />
              )}
            </div>
          </div>
        );
      case 'reminder':
        return (
          <ReminderView
            notes={notes}
            reminders={reminders}
            onToggleReminder={handleToggleReminder}
            onMarkCompleted={handleMarkCompleted}
            onDeleteReminder={handleDeleteReminder}
            onOpenNote={(noteId) => {
              const noteToOpen =
                notes.find((note) => note.id === noteId) || null;
              setSelectedNote(noteToOpen);
              setActiveTab('notes');
            }}
          />
        );
      // case 'calendar':
      //   return (
      //     <Calendar
      //       plans={[]} // `plans` 상태 정의 필요
      //       onSelectDate={setSelectedDate}
      //       selectedDate={selectedDate}
      //     />
      //   );
      // case 'timeline':
      //   return <TimelineView plans={[]} notes={notes} />; // `plans` 상태 정의 필요
      case 'search':
        return (
          <Search
            onSearch={setSearchQuery}
            results={searchResults}
            onSelectNote={(note) => {
              setSelectedNote(note);
              setActiveTab('notes');
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      id="dashboard-container"
      className={`flex flex-col h-screen theme-${
        isDarkMode ? (isDeepDarkMode ? 'deepdark' : 'dark') : 'light'
      }`}
    >
      <div className="flex flex-col h-full bg-background text-foreground">
        <Toaster />
        <header className="flex justify-between items-center px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-primary">
              <img
                src={logoSrc}
                className="max-w-40 cursor-pointer"
                alt="로고"
              />
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveTab('search')}
            >
              <SearchIcon className="h-5 w-5" />
            </Button>
            {isMobile ? (
              <MobileNavigation
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                handleCreateNote={handleCreateNote}
              />
            ) : (
              <DesktopActions handleCreateNote={handleCreateNote} />
            )}
          </div>
        </header>
        <div className="flex flex-1 overflow-hidden">
          {!isMobile && !isEditing && (
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          )}
          <main className="flex-1 overflow-hidden">{renderMainContent()}</main>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) => {
  const { notes } = useNotes();
  const popularTags = useMemo(() => {
    const tagCount: Record<string, number> = {};
    notes.forEach((note) => {
      note.tags.forEach((tag) => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });
    return Object.entries(tagCount)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [notes]);

  return (
    <aside className="w-56 border-r border-border bg-muted p-4 hidden md:block overflow-y-auto">
      <nav className="flex flex-col gap-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={activeTab === item.id ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab(item.id)}
            >
              <Icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          );
        })}
      </nav>
      <div className="mt-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          팀 스페이스
        </h3>
        {/* <TeamSpaceList activeTab={activeTab} setActiveTab={setActiveTab} /> */}
      </div>
      {popularTags.length > 0 && (
        <div className="mt-6">
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
                  setActiveTab('notes');
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
    </aside>
  );
};

const MobileNavigation = ({
  activeTab,
  setActiveTab,
  handleCreateNote,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  handleCreateNote: () => void;
}) => (
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="ghost" size="icon">
        <Menu className="h-5 w-5" />
      </Button>
    </SheetTrigger>
    <SheetContent side="right" className="w-64 bg-background">
      <div className="flex flex-col gap-4 py-4 h-full">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleCreateNote}
        >
          <PlusCircle className="mr-2 h-4 w-4" />새 노트
        </Button>
        <Separator />
        <nav className="flex flex-col gap-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab(item.id)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>
        <div className="mt-auto">
          <UserProfile />
        </div>
      </div>
    </SheetContent>
  </Sheet>
);

const DesktopActions = ({
  handleCreateNote,
}: {
  handleCreateNote: () => void;
}) => (
  <div className="flex items-center gap-2">
    <Button variant="outline" size="sm" onClick={handleCreateNote}>
      <PlusCircle className="mr-2 h-4 w-4" />새 노트
    </Button>
    <UserProfile />
  </div>
);

export default Dashboard;
