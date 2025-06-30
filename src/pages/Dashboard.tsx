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
import { Calendar } from '@/components/features/dashboard/calendar';
import { TimelineView } from '@/components/features/dashboard/timelineView';
import { UserProfile } from '@/components/features/dashboard/userProfile';
import { useAuthStore } from '@/stores/authStore';
import { useNotes } from '@/hooks/useNotes';
import { TeamSpaceList } from '@/components/features/dashboard/teamSpace/teamSpaceList';
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

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { session, isAuthenticated, isLoginLoading, checkSession } =
    useAuthStore();
  const {
    notes,
    loading: isNotesLoading,
    addNote,
    updateNote,
    deleteNote,
    toggleReminderComplete,
  } = useNotes();
  const { isDarkMode, isDeepDarkMode, setTheme } = useThemeStore();

  // --- UI 상태 관리 ---
  const [activeTab, setActiveTab] = useState('notes');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const editorRef = useRef<{ save: () => void } | null>(null);

  // --- 데이터 파생 (Derived State) ---
  const allReminders = useMemo(() => {
    return notes.flatMap((note) =>
      (note.reminders || []).map((reminder) => ({
        ...reminder,
        noteId: note.id,
        noteTitle: note.title,
        noteOwnerId: note.owner_id,
      })),
    );
  }, [notes]);

  // --- useEffects ---

  // 반응형 처리
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 인증 상태 확인
  useEffect(() => {
    const initializeAuth = async () => {
      setIsAuthLoading(true);
      try {
        const isAuth = await checkSession();
        if (!isAuth) {
          navigate('/login');
        }
      } catch (err) {
        navigate('/login');
      } finally {
        setIsAuthLoading(false);
      }
    };
    initializeAuth();
  }, [navigate, checkSession]);

  // 선택된 노트가 notes 배열에서 삭제되면 선택 해제
  useEffect(() => {
    if (selectedNote && !notes.find((n) => n.id === selectedNote.id)) {
      setSelectedNote(null);
      setIsEditing(false);
    }
  }, [notes, selectedNote]);

  // --- 핸들러 함수 ---

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
    setIsEditing(false); // 항상 보기 모드로 시작
  };

  const handleCreateNote = useCallback(async () => {
    if (!session?.user?.id) return;

    const newNoteData = {
      title: '새로운 노트',
      content: '',
      tags: [],
      owner_id: session.user.id,
      is_public: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      reminders: [],
    };
    // addNote는 이제 Note | null 타입을 반환하므로 타입 단언이 필요 없습니다.
    const newNote = await addNote(newNoteData);
    if (newNote) {
      // dataStore가 상태를 업데이트하고 useNotes 훅이 최신 노트를 받으면,
      // 아래 로직은 해당 노트를 선택하게 됩니다.
      // 실시간 반영이므로 즉시 리스트에 나타납니다.
      setSelectedNote(newNote);
      setActiveTab('notes');
      setIsEditing(true); // 새 노트는 바로 편집 모드로
    }
  }, [addNote, session?.user?.id]);

  const handleDeleteNote = useCallback(
    async (noteId: string) => {
      await deleteNote(noteId);
      setSelectedNote(null);
      setIsEditing(false);
      setIsDeleteDialogOpen(false);
    },
    [deleteNote],
  );

  const handleUpdateNote = useCallback(
    async (noteToUpdate: Note) => {
      const success = await updateNote(noteToUpdate);
      // 성공 여부에 따라 추가 작업 (e.g., toast)
      return success;
    },
    [updateNote],
  );

  const handleToggleReminderComplete = useCallback(
    async (reminderId: string, completed: boolean) => {
      // useNotes에 있는 전용 함수 사용
      await toggleReminderComplete(reminderId, completed);
      // 상태는 dataStore의 실시간 구독에 의해 자동으로 업데이트됩니다.
    },
    [toggleReminderComplete],
  );

  const handleToggleReminderEnable = useCallback(
    async (reminderId: string, enabled: boolean) => {
      const targetNote = notes.find((n) =>
        (n.reminders || []).some((r) => r.id === reminderId),
      );
      if (!targetNote) return;

      const updatedReminders = (targetNote.reminders || []).map((r) =>
        r.id === reminderId ? { ...r, enabled } : r,
      );

      await updateNote({ ...targetNote, reminders: updatedReminders });
    },
    [notes, updateNote],
  );

  const handleDeleteReminder = useCallback(
    async (reminderId: string) => {
      const targetNote = notes.find((n) =>
        (n.reminders || []).some((r) => r.id === reminderId),
      );
      if (!targetNote) return;

      // 노트 내용에서 리마인더 텍스트 제거 (선택적)
      // 이 로직은 앱의 기획에 따라 유지하거나 제거할 수 있습니다.
      const reminderToDelete = (targetNote.reminders || []).find(
        (r) => r.id === reminderId,
      );
      let updatedContent = targetNote.content;
      if (reminderToDelete?.original_text) {
        const regex = new RegExp(
          `(~~)?${reminderToDelete.original_text}(~~)?`,
          'g',
        );
        updatedContent = updatedContent.replace(regex, '');
      }

      const updatedReminders = (targetNote.reminders || []).filter(
        (r) => r.id !== reminderId,
      );

      await updateNote({
        ...targetNote,
        content: updatedContent,
        reminders: updatedReminders,
      });
    },
    [notes, updateNote],
  );

  const handleKeyboardShortcuts = useCallback(
    (e: KeyboardEvent) => {
      // ... (단축키 로직은 변경 없음, 필요한 경우 context에 따라 수정)
    },
    [
      /* ... 의존성 배열 ... */
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

  if (isLoginLoading || isAuthLoading || isNotesLoading) {
    return <LoadingSpinner />;
  }

  // 메인 컨텐츠 렌더링 함수
  const renderMainContent = () => {
    const filteredNotes = selectedTag
      ? notes.filter((note) => (note.tags || []).includes(selectedTag))
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
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      selectedNote && handleDeleteNote(selectedNote.id)
                    }
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
                  ref={editorRef}
                  key={selectedNote.id}
                  note={selectedNote}
                  onSave={handleUpdateNote}
                  onDelete={() => setIsDeleteDialogOpen(true)}
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
            reminders={allReminders}
            onToggleComplete={handleToggleReminderComplete} // 이전 리팩토링에서 이미 정의됨
            onToggleEnable={handleToggleReminderEnable} // 새로 추가
            onDelete={handleDeleteReminder} // 새로 추가
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

// --- 하위 컴포넌트들 (변경 없음) ---

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
    <aside className="w-56 border-r border-border bg-muted p-4 hidden md:flex overflow-y-auto justify-between flex-col">
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
        <div className="mt-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            팀 스페이스
          </h3>
          <TeamSpaceList activeTab={activeTab} setActiveTab={setActiveTab} />
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
