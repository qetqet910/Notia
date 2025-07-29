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
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
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

import { DashboardLoader } from '@/components/loader/DashboardLoader';
import { EditorLoader } from '@/components/loader/EditorLoader';
import { ReminderLoader } from '@/components/loader/ReminderLoader';
import { CalendarLoader } from '@/components/loader/CalendarLoader';
import { TimelineLoader } from '@/components/loader/TimelineLoader';
import { NoteListLoader } from '@/components/loader/NoteListLoader';

const NoteList = lazy(() =>
  import('@/components/features/dashboard/noteList').then((module) => ({
    default: module.NoteList,
  })),
);
const Editor = lazy(() =>
  import('@/components/features/dashboard/main/editor').then((module) => ({
    default: module.Editor,
  })),
);
const ReminderView = lazy(() =>
  import('@/components/features/dashboard/main/reminder').then((module) => ({
    default: module.ReminderView,
  })),
);
const Calendar = lazy(() =>
  import('@/components/features/dashboard/main/calendar').then((module) => ({
    default: module.Calendar,
  })),
);
const TimelineView = lazy(() =>
  import('@/components/features/dashboard/main/timelineView').then(
    (module) => ({
      default: module.TimelineView,
    }),
  ),
);

const NAV_ITEMS = [
  { id: 'notes', label: '노트', icon: List },
  { id: 'reminder', label: '리마인더', icon: Clock },
  { id: 'calendar', label: '캘린더', icon: CalendarIcon },
  { id: 'timeline', label: '타임라인', icon: List },
];

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
  const { session } = useAuthStore();
  const {
    notes,
    loading: isNotesLoading,
    addNote,
    updateNote,
    deleteNote,
    deleteReminder,
    updateReminderCompletion,
    updateReminderEnabled,
    fetchNoteContent,
  } = useNotes();
  const { permission, requestPermission } = useNotificationPermission();
  const { isDarkMode, isDeepDarkMode, setTheme } = useThemeStore();
  const [isMobile] = useState(window.innerWidth < 768);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('notes');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isNoteContentLoading, setIsNoteContentLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const editorRef = useRef<{ save: () => void } | null>(null);
  const newlyCreatedNoteId = useRef<string | null>(null);

  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const activeTabs = useMemo(
    () => ['notes', 'reminder', 'calendar', 'timeline'],
    [],
  );

  const allReminders = useMemo(() => {
    if (!notes || !Array.isArray(notes)) return [];
    const remindersMap = new Map<
      string,
      Reminder & { noteId: string; noteTitle: string; noteContent: string }
    >();
    notes.forEach((note) => {
      (note.reminders || []).forEach((reminder) => {
        if (!remindersMap.has(reminder.id)) {
          remindersMap.set(reminder.id, {
            ...reminder,
            noteId: note.id,
            noteTitle: note.title || '제목 없음',
            noteContent: note.content_preview?.substring(0, 100) || '',
          });
        }
      });
    });
    return Array.from(remindersMap.values());
  }, [notes]);

  useEffect(() => {
    if (permission === 'default') {
      requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    if (
      selectedNote &&
      !notes.some((note) => note && note.id === selectedNote.id)
    ) {
      setSelectedNote(null);
      setIsEditing(false);
    }
  }, [notes, selectedNote]);

  useEffect(() => {
    if (selectedNote && selectedNote.id === newlyCreatedNoteId.current) {
      setTimeout(() => {
        setIsEditing(true);
        newlyCreatedNoteId.current = null;
      }, 50);
    }
  }, [selectedNote]);

  const handleSelectNote = useCallback(
    async (note: Note) => {
      setSelectedNote(note);
      setIsEditing(false);

      if (note && !note.content) {
        setIsNoteContentLoading(true);
        const content = await fetchNoteContent(note.id);
        setSelectedNote((prev) =>
          prev?.id === note.id ? { ...prev, content: content || '' } : prev,
        );
        setIsNoteContentLoading(false);
      }
    },
    [fetchNoteContent],
  );

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

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedNote) return;
    await deleteNote(selectedNote.id);
    setIsDeleteDialogOpen(false);
  }, [deleteNote, selectedNote]);

  const handleKeyboardShortcuts = useCallback(
    (e: KeyboardEvent) => {
      const isCtrlCmd = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement;

      const isInputElement =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isInputElement && !(isCtrlCmd && e.key.toLowerCase() === 's')) {
        if (e.key !== 'Tab') return;
      }

      const key = e.key === 'Tab' ? 'Tab' : e.key.toLowerCase();

      const shortcuts: { [key: string]: (isCtrlCmd?: boolean) => void } = {
        n: () => handleCreateNote(),
        s: (isCtrlCmd) => {
          if (isCtrlCmd && isEditing && editorRef.current) {
            editorRef.current.save();
          }
        },
        '/': () => navigate('/dashboard/help?tab=overview'),
        '?': () => navigate('/dashboard/help?tab=overview'),
        t: () => setTheme(isDarkMode || isDeepDarkMode ? 'light' : 'dark'),
        Tab: () => {
          const currentTabIndex = activeTabs.indexOf(activeTab);
          const nextIndex = (currentTabIndex + 1) % activeTabs.length;
          setActiveTab(activeTabs[nextIndex]);
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
      activeTab,
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

  if (isNotesLoading) return <DashboardLoader />;

  const renderMainContent = () => {
    const filteredNotes = selectedTag
      ? (notes || []).filter(
          (note) => note && (note.tags || []).includes(selectedTag),
        )
      : notes || [];

    switch (activeTab) {
      case 'notes':
        return (
          <div className="flex h-full overflow-hidden">
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
              <Suspense fallback={<NoteListLoader />}>
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
              </Suspense>
            </div>
            <div
              className={`h-full transition-all duration-300 ease-in-out ${
                isEditing ? 'w-full' : 'hidden md:block w-2/3'
              }`}
            >
              <Suspense fallback={<EditorLoader />}>
                {isNoteContentLoading ? (
                  <EditorLoader />
                ) : selectedNote ? (
                  <Editor
                    ref={editorRef}
                    key={selectedNote.id}
                    note={selectedNote}
                    onSave={updateNote}
                    onDeleteRequest={() => setIsDeleteDialogOpen(true)}
                    isEditing={isEditing}
                    onEnterEditMode={handleEnterEditMode}
                    onCancelEdit={handleCancelEdit}
                  />
                ) : (
                  <EmptyNoteState handleCreateNote={handleCreateNote} />
                )}
              </Suspense>
            </div>
          </div>
        );
      case 'reminder':
        return (
          <Suspense fallback={<ReminderLoader />}>
            <ReminderView
              reminders={allReminders}
              onToggleComplete={updateReminderCompletion}
              onToggleEnable={updateReminderEnabled}
              onDelete={deleteReminder}
              onOpenNote={(noteId) => {
                const noteToOpen =
                  (notes || []).find((note) => note && note.id === noteId) ||
                  null;
                if (noteToOpen) handleSelectNote(noteToOpen);
                setActiveTab('notes');
              }}
            />
          </Suspense>
        );
      case 'calendar':
        return (
          <Suspense fallback={<CalendarLoader />}>
            <Calendar
              reminders={allReminders}
              onOpenNote={(noteId) => {
                const noteToOpen =
                  (notes || []).find((note) => note && note.id === noteId) ||
                  null;
                if (noteToOpen) handleSelectNote(noteToOpen);
                setActiveTab('notes');
              }}
            />
          </Suspense>
        );
      case 'timeline':
        return (
          <Suspense fallback={<TimelineLoader />}>
            <TimelineView
              notes={notes || []}
              reminders={allReminders}
              onOpenNote={(noteId) => {
                const noteToOpen =
                  (notes || []).find((note) => note && note.id === noteId) ||
                  null;
                if (noteToOpen) handleSelectNote(noteToOpen);
                setActiveTab('notes');
              }}
            />
          </Suspense>
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
                className="max-w-40 cursor-pointer h-8"
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
              isEditing={isEditing}
            />
          </div>
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
  isEditing,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onTagSelect: (tag: string) => void;
  isEditing: boolean;
}) => {
  const { notes } = useNotes();
  const popularTags = useMemo(() => {
    if (!notes || !Array.isArray(notes)) return [];
    const tagCount: Record<string, number> = {};
    notes
      .filter((note) => note && typeof note === 'object')
      .forEach((note) => {
        const tags = note.tags;
        if (tags && Array.isArray(tags)) {
          tags
            .filter((tag) => typeof tag === 'string')
            .forEach((tag) => {
              tagCount[tag] = (tagCount[tag] || 0) + 1;
            });
        }
      });
    return Object.entries(tagCount)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [notes]);

  return (
    <aside
      className={`border-r border-border bg-muted p-4 hidden md:flex overflow-y-auto justify-between flex-col h-full ${
        isEditing ? 'w-0 opacity-0' : 'w-56'
      }`}
    >
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
