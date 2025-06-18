import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Toaster } from '@/components/ui/toaster';
import { NoteList } from '@/components/features/dashboard/noteList';
import { Editor } from '@/components/features/dashboard/editor';
import { ReminderView } from '@/components/features/dashboard/reminder';
import Calendar from '@/components/features/dashboard/calendar';
import TimelineView from '@/components/features/dashboard/timelineView';
import { UserProfile } from '@/components/features/dashboard/userProfile';
import { useAuthStore } from '@/stores/authStore';
import { useNotes } from '@/hooks/useNotes';
import { supabase } from '@/services/supabaseClient';
import { TeamSpaceList } from '@/components/features/dashboard/teamSpace/teamSpaceList';
import {
  PlusCircle,
  Calendar as CalendarIcon,
  Clock,
  List,
  Search as SearchIcon,
  Menu,
  Trash2,
} from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import logoImage from '@/assets/images/Logo.png';
import logoDarkImage from '@/assets/images/LogoDark.png';
import { Note, Reminder } from '@/types';
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

async function checkNotificationPermission() {
  if ('Notification' in window) {
    if (Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (error) {
        console.error('Notification permission request failed:', error);
      }
    } else if (Notification.permission === 'denied') {
      console.warn('Notification permission denied');
    }
  } else {
    console.warn('This browser does not support notifications');
  }
}

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('notes');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const { isDarkMode, isDeepDarkMode, toggleTheme, setTheme } = useThemeStore();
  const { notes, addNote, updateNote, updateNoteOnly, deleteNote } = useNotes();
  const { session, isAuthenticated, isLoginLoading, checkSession } =
    useAuthStore();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const editorRef = useRef<{ save: () => void } | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isToggleTheme, setisToggleTheme] = useState(false);

  const [isActiveTab, setIsActiveTab] = useState(0);
  const activeTabs = ['notes', 'reminder', 'calendar', 'timeline'];

  checkNotificationPermission();

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

  // 새 노트 생성
  const handleCreateNote = useCallback(async () => {
    const newNoteData = {
      title: '새로운 노트',
      content: '',
      tags: [],
      owner_id: session?.user?.id || '',
      is_public: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const newNote = await addNote(newNoteData);
    if (newNote) {
      setSelectedNote(newNote);
      setActiveTab('notes');
      setIsEditing(true); // 새 노트는 바로 편집 모드로
    }
  }, [addNote]);

  const SIMPLE_SHORTCUTS = {
    n: () => handleCreateNote(),
    s: (isCtrlCmd: boolean) => {
      if (isCtrlCmd && isEditing && editorRef.current) {
        editorRef.current.save();
      }
    },
    '/': () => navigate('/dashboard/help?tab=overview'),
    '?': () => navigate('/dashboard/help?tab=overview'),
    t: () => {
      setisToggleTheme((prev) => !prev);
      setTheme(isToggleTheme ? 'dark' : 'light');
    },
    Tab: () => {
      setIsActiveTab((prev) => {
        const nextIndex = (prev + 1) % activeTabs.length;
        setActiveTab(activeTabs[nextIndex]);
        return nextIndex;
      });
    },
    b: () => setIsSidebarVisible((prev) => !prev),
    d: () => selectedNote && setIsDeleteDialogOpen(true),
    Delete: () => selectedNote && setIsDeleteDialogOpen(true),
    m: () => navigate('/dashboard/myPage?tab=profile'),
    ',': () => navigate('/dashboard/myPage?tab=activity'),
    '<': () => navigate('/dashboard/myPage?tab=activity'),
    '.': () => navigate('/dashboard/myPage?tab=settings'),
    '>': () => navigate('/dashboard/myPage?tab=settings'),
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
      handleCreateNote,
      navigate,
      isEditing,
      editorRef,
      setisToggleTheme,
      setTheme,
      isToggleTheme,
      setIsActiveTab,
      setActiveTab,
      activeTabs,
      setIsSidebarVisible,
      selectedNote,
      setIsDeleteDialogOpen,
    ],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () =>
      document.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [handleKeyboardShortcuts]);

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
      const reminderToUpdate = reminders.find((r) => r.id === reminderId);
      if (!reminderToUpdate) return;

      const targetNote = notes.find(
        (note) => note.id === reminderToUpdate.note_id,
      );
      if (!targetNote) return;

      // 1. DB에서 리마인더 상태 업데이트
      const { error } = await supabase
        .from('reminders')
        .update({ completed, updated_at: new Date().toISOString() })
        .eq('id', reminderId);

      if (error) {
        console.error('Error updating reminder:', error);
        return;
      }

      // 2. 노트 내용에서 ~~ 토글
      let updatedContent;
      const originalText = reminderToUpdate.original_text;

      if (completed) {
        // 완료: ~~ 추가
        updatedContent = targetNote.content.replace(
          originalText,
          `~~${originalText}~~`,
        );
      } else {
        // 미완료: ~~ 제거
        updatedContent = targetNote.content.replace(
          `~~${originalText}~~`,
          originalText,
        );
      }

      const updatedNote = {
        ...targetNote,
        content: updatedContent,
      };

      // 3. 노트 업데이트
      await updateNoteOnly(updatedNote);

      // 4. selectedNote 상태 업데이트
      if (selectedNote?.id === targetNote.id) {
        setSelectedNote(updatedNote);
      }

      // 5. 리마인더 상태 업데이트
      setReminders((prev) =>
        prev.map((r) => (r.id === reminderId ? { ...r, completed } : r)),
      );
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
        `~~${reminderToDelete.original_text}~~`,
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

  const logoSrc = useMemo(
    () => (isDarkMode || isDeepDarkMode ? logoDarkImage : logoImage),
    [isDarkMode, isDeepDarkMode],
  );

  if (isLoginLoading || isLoading) {
    return <LoadingSpinner />;
  }

  // 메인 컨텐츠 렌더링 함수
  const renderMainContent = () => {
    const filteredNotes = selectedTag
      ? notes.filter((note) => note.tags.includes(selectedTag))
      : notes;

    switch (activeTab) {
      case 'notes':
        return (
          <div className="flex h-full custom-scrollbar">
            <AlertDialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>정말로 삭제하시겠습니까?</AlertDialogTitle>
                  <AlertDialogDescription>
                    이 작업은 되돌릴 수 없습니다. 노트가 영구적으로 삭제됩니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    onClick={() => setIsDeleteDialogOpen(false)}
                  >
                    취소
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      if (selectedNote) {
                        deleteNote(selectedNote.id);
                        setSelectedNote(null);
                        setIsEditing(false);
                      }
                      setIsDeleteDialogOpen(false);
                    }}
                  >
                    삭제
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div
              className={`h-full overflow-y-auto border-r border-border transition-all duration-300 ease-in-out ${
                isEditing ? 'w-0 opacity-0 md:w-0' : 'w-full md:w-1/3'
              }`}
            >
              {selectedTag && (
                <div className="p-3 bg-muted border-b animate-in slide-in-from-top-2 duration-300 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-top-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      #{selectedTag} 필터링 중
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // 애니메이션과 함께 제거
                        const element =
                          document.querySelector('[data-tag-filter]');
                        if (element) {
                          element.classList.add(
                            'animate-out',
                            'slide-out-to-top-2',
                            'duration-300',
                          );
                          setTimeout(() => setSelectedTag(null), 300);
                        } else {
                          setSelectedTag(null);
                        }
                      }}
                      className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive transition-all duration-200 hover:scale-105"
                      data-tag-filter
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              )}
              <NoteList
                notes={filteredNotes}
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
                  ref={editorRef}
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
      case 'calendar':
        return (
          <Calendar
            reminders={reminders}
            notes={notes}
            onOpenNote={(noteId) => {
              const noteToOpen =
                notes.find((note) => note.id === noteId) || null;
              setSelectedNote(noteToOpen);
              setActiveTab('notes');
            }}
          />
        );
      case 'timeline':
        return (
          <TimelineView
            notes={notes}
            reminders={reminders}
            onOpenNote={(noteId) => {
              const noteToOpen =
                notes.find((note) => note.id === noteId) || null;
              setSelectedNote(noteToOpen);
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
            {/* <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveTab('search')}
            >
              <SearchIcon className="h-5 w-5" />
            </Button> */}
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
          {!isMobile && !isEditing && isSidebarVisible && (
            <Sidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onTagSelect={setSelectedTag}
            />
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
  onTagSelect,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onTagSelect: (tag: string) => void;
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
                  onTagSelect(tag);
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
