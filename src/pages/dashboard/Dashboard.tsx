import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  Suspense,
  lazy,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Toaster } from '@/components/ui/toaster';

import { GoalProgress } from '@/components/features/dashboard/goalProgress';
import { UserProfile } from '@/components/features/dashboard/userProfile';
import { useAuthStore } from '@/stores/authStore';
import { useNotes } from '@/hooks/useNotes';
// import { TeamSpaceList } from '@/components/features/dashboard/teamSpace/teamSpaceList';
import {
  PlusCircle,
  Calendar as CalendarIcon,
  Clock,
  List,
  Menu,
} from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import logoImage from '@/assets/images/Logo.png';
import logoDarkImage from '@/assets/images/LogoDark.png';
import { Note } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const NoteList = lazy(() =>
  import('@/components/features/dashboard/noteList').then((module) => ({
    default: module.NoteList,
  })),
);
const Editor = lazy(() =>
  import('@/components/features/dashboard/editor').then((module) => ({
    default: module.Editor,
  })),
);
const ReminderView = lazy(() =>
  import('@/components/features/dashboard/reminder').then((module) => ({
    default: module.ReminderView,
  })),
);
const Calendar = lazy(() =>
  import('@/components/features/dashboard/calendar').then((module) => ({
    default: module.Calendar,
  })),
);
const TimelineView = lazy(() =>
  import('@/components/features/dashboard/timelineView').then((module) => ({
    default: module.TimelineView,
  })),
);

const NAV_ITEMS = [
  { id: 'notes', label: '노트', icon: List },
  { id: 'reminder', label: '리마인더', icon: Clock },
  { id: 'calendar', label: '캘린더', icon: CalendarIcon },
  { id: 'timeline', label: '타임라인', icon: List },
];

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

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
  const navigate = useNavigate();
  const { session, checkSession } = useAuthStore();
  const {
    notes,
    loading: isNotesLoading,
    addNote,
    updateNote,
    deleteNote,
    updateReminderCompletion,
    updateReminderEnabled,
  } = useNotes();
  const { isDarkMode, isDeepDarkMode, setTheme } = useThemeStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('notes');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const editorRef = useRef<{ save: () => void } | null>(null);
  const newlyCreatedNoteId = useRef<string | null>(null);

  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isActiveTab, setIsActiveTab] = useState(0);
  const activeTabs = useMemo(
    () => ['notes', 'reminder', 'calendar', 'timeline'],
    [],
  );

  const allReminders = useMemo(() => {
    return notes.flatMap((note) =>
      (note.reminders || []).map((reminder: any) => ({
        id: reminder.id,
        note_id: note.id,
        owner_id: note.owner_id,
        reminder_text: reminder.text || reminder.reminder_text,
        reminder_time: (reminder.date
          ? new Date(reminder.date)
          : new Date(reminder.reminder_time)
        ).toISOString(),
        completed: reminder.completed,
        enabled: reminder.enabled ?? true,
        created_at: reminder.created_at || new Date().toISOString(),
        updated_at: reminder.updated_at || new Date().toISOString(),
        original_text: reminder.original_text,
        noteId: note.id,
        noteTitle: note.title,
        noteContent:
          note.content?.replace(/<[^>]*>/g, '').substring(0, 100) || '',
      })),
    );
  }, [notes]);

  // --- useEffects ---

  useEffect(() => {
    const initializeAuth = async () => {
      const isAuth = await checkSession();
      if (!isAuth) navigate('/login');
    };
    initializeAuth();
  }, [navigate, checkSession]);

  useEffect(() => {
    if (selectedNote && !notes.some((note) => note.id === selectedNote.id)) {
      setSelectedNote(null);
      setIsEditing(false);
    }
  }, [notes, selectedNote]);

  useEffect(() => {
    if (selectedNote && selectedNote.id === newlyCreatedNoteId.current) {
      setTimeout(() => {
        setIsEditing(true);
        newlyCreatedNoteId.current = null;
      }, 50); // 짧은 딜레이로 안정성 확보
    }
  }, [selectedNote]);

  // --- 핸들러 함수들 ---

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
    setIsEditing(false);
  };

  const handleEnterEditMode = useCallback(() => {
    setTimeout(() => setIsEditing(true), 0);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleCreateNote = useCallback(async () => {
    if (!session?.user?.id) return;
    const newNote = await addNote({
      title: '새로운 노트',
      content: '',
      tags: [],
    });
    if (newNote) {
      newlyCreatedNoteId.current = newNote.id;
      setSelectedNote(newNote);
      setActiveTab('notes');
    }
  }, [addNote, session?.user?.id]);

  const handleUpdateNote = useCallback(
    async (noteToUpdate: Note) => {
      await updateNote(noteToUpdate);
    },
    [updateNote],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedNote) return;
    await deleteNote(selectedNote.id);
    setIsDeleteDialogOpen(false);
  }, [deleteNote, selectedNote]);

  const handleDeleteReminder = useCallback(
    async (reminderId: string) => {
      const targetNote = notes.find((n) =>
        (n.reminders || []).some((r: any) => r.id === reminderId),
      );
      if (!targetNote) return;
      const updatedReminders = (targetNote.reminders || []).filter(
        (r: any) => r.id !== reminderId,
      );
      await updateNote({ ...targetNote, reminders: updatedReminders });
    },
    [notes, updateNote],
  );

  const handleKeyboardShortcuts = useCallback(
    (e: KeyboardEvent) => {
      const isCtrlCmd = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement;

      const isInputElement =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // 입력 필드에서는 Ctrl/Cmd+S를 제외한 대부분의 단축키를 무시
      if (isInputElement && !(isCtrlCmd && e.key.toLowerCase() === 's')) {
        // Tab 키는 항상 작동하도록 허용하지 않음 (필드 내 이동을 위해)
        if (e.key !== 'Tab') return;
      }

      const key = e.key === 'Tab' ? 'Tab' : e.key.toLowerCase();

      // 단축키 매핑 객체
      const shortcuts: { [key: string]: (isCtrlCmd?: boolean) => void } = {
        n: () => handleCreateNote(),
        s: (isCtrlCmd) => {
          if (isCtrlCmd && isEditing && editorRef.current)
            editorRef.current.save();
        },
        '/': () => navigate('/dashboard/help?tab=overview'),
        '?': () => navigate('/dashboard/help?tab=overview'),
        t: () => setTheme(isDarkMode || isDeepDarkMode ? 'light' : 'dark'),
        Tab: () => {
          // "Tab" 문자열은 소문자로 변환되지 않도록 위에서 처리
          setIsActiveTab((prev) => {
            const nextIndex = (prev + 1) % activeTabs.length;
            setActiveTab(activeTabs[nextIndex]);
            return nextIndex;
          });
        },
        b: () => setIsSidebarVisible((prev) => !prev),
        d: () => selectedNote && setIsDeleteDialogOpen(true),
        delete: () => selectedNote && setIsDeleteDialogOpen(true),
        m: () => navigate('/dashboard/myPage?tab=profile'),
        ',': () => navigate('/dashboard/myPage?tab=activity'),
        '.': () => navigate('/dashboard/myPage?tab=settings'),
      };

      const handler = shortcuts[key];
      if (handler) {
        e.preventDefault();
        handler(isCtrlCmd);
      }
    },
    [
      handleCreateNote,
      navigate,
      isEditing,
      setTheme,
      isDarkMode,
      isDeepDarkMode,
      activeTabs,
      selectedNote,
    ],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () =>
      document.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [handleKeyboardShortcuts]);

  const logoSrc = useMemo(
    () => (isDarkMode || isDeepDarkMode ? logoDarkImage : logoImage),
    [isDarkMode, isDeepDarkMode],
  );

  if (isNotesLoading) return <LoadingSpinner />;

  // --- 메인 렌더링 ---
  const renderMainContent = () => {
    const filteredNotes = selectedTag
      ? notes.filter((note) => (note.tags || []).includes(selectedTag))
      : notes;
    switch (activeTab) {
      case 'notes':
        return (
          <div className="flex h-full">
            <AlertDialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>정말로 삭제하시겠습니까?</AlertDialogTitle>
                  <AlertDialogDescription>
                    이 작업은 되돌릴 수 없습니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmDelete}>
                    삭제
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div
              className={`h-full overflow-y-auto border-r custom-scrollbar transition-all duration-300 ease-in-out ${
                isEditing ? 'w-0 opacity-0' : 'w-full md:w-1/3'
              }`}
            >
              {selectedTag && (
                <div className="p-3 bg-muted border-b">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      #{selectedTag} 필터링 중
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTag(null)}
                      className="h-6 w-6 p-0"
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              )}
              <NoteList
                notes={filteredNotes}
                onSelectNote={handleSelectNote}
                selectedNote={selectedNote}
              />
            </div>

            <div
              className={`h-full transition-all duration-300 ease-in-out ${
                isEditing ? 'w-full' : 'hidden md:block w-2/3'
              }`}
            >
              {selectedNote ? (
                <Editor
                  key={selectedNote.id}
                  note={selectedNote}
                  onSave={handleUpdateNote}
                  onDeleteRequest={() => setIsDeleteDialogOpen(true)}
                  isEditing={isEditing}
                  onEnterEditMode={handleEnterEditMode}
                  onCancelEdit={handleCancelEdit}
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
            reminders={allReminders}
            // ✅ props를 새로운 함수로 교체합니다.
            onToggleComplete={updateReminderCompletion}
            onToggleEnable={updateReminderEnabled}
            onDelete={handleDeleteReminder} // 삭제는 기존 로직 유지
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
            notes={notes} // 캘린더는 노트와 리마인더 둘 다 필요
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
            notes={notes} // 타임라인도 노트와 리마인더 둘 다 필요
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
          <div
            className={`transition-all duration-300 ease-in-out h-full ${
              !isMobile && !isEditing && isSidebarVisible
                ? 'w-56'
                : 'w-0 opacity-0'
            }`}
          >
            <Sidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onTagSelect={setSelectedTag}
            />
          </div>
          <Suspense fallback={<LoadingSpinner />}>
            <main className="flex-1 overflow-hidden">
              {renderMainContent()}
            </main>
          </Suspense>
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
      (note.tags || []).forEach((tag) => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });
    return Object.entries(tagCount)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [notes]);

  return (
    <aside className="w-56 border-r border-border bg-muted p-4 hidden md:flex overflow-y-auto justify-between flex-col h-full">
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
      <div>
        {/* TODO: 팀 스페이스 구현 */}
        {/* <div className="mt-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            팀 스페이스
          </h3>
          <TeamSpaceList activeTab={activeTab} setActiveTab={setActiveTab} />
        </div> */}
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
        <GoalProgress />
      </div>
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
