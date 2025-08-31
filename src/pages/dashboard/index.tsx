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
import { Note, Reminder, EditorReminder } from '@/types';
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

import { DashboardPageLoader } from '@/components/loader/dashboard/DashboardPageLoader';
import { EditorLoader } from '@/components/loader/dashboard/EditorLoader';
import { ReminderLoader } from '@/components/loader/dashboard/ReminderLoader';
import { CalendarLoader } from '@/components/loader/dashboard/CalendarLoader';
import { TimelineLoader } from '@/components/loader/dashboard/TimelineLoader';
import { NoteListLoader } from '@/components/loader/dashboard/NoteListLoader';

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

import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';

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
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedNoteId) || null,
    [notes, selectedNoteId],
  );
  const [isNoteContentLoading, setIsNoteContentLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
    // notes 배열에서 더 이상 존재하지 않는 노트를 보고 있다면 선택 해제
    if (selectedNoteId && !notes.some((note) => note.id === selectedNoteId)) {
      setSelectedNoteId(null);
      setIsEditing(false);
    }
  }, [notes, selectedNoteId]);

  useEffect(() => {
    if (selectedNoteId && selectedNoteId === newlyCreatedNoteId.current) {
      setTimeout(() => {
        setIsEditing(true);
        newlyCreatedNoteId.current = null;
      }, 50);
    }
  }, [selectedNoteId]);

  const handleSelectNote = useCallback(
    async (note: Note) => {
      setSelectedNoteId(note.id);
      setIsEditing(false);
      setHasUnsavedChanges(false);

      if (note && !note.content) {
        setIsNoteContentLoading(true);
        await fetchNoteContent(note.id);
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
    setHasUnsavedChanges(false);
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
      setSelectedNoteId(newNote.id);
      setActiveTab('notes');
    }
  }, [addNote, session?.user?.id]);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedNoteId) return;
    await deleteNote(selectedNoteId);
    setIsDeleteDialogOpen(false);
  }, [deleteNote, selectedNoteId]);

  const handleSaveNote = async (
    noteId: string,
    updates: Partial<Note> & { reminders: EditorReminder[] },
  ) => {
    await updateNote(noteId, updates);
    setHasUnsavedChanges(false);
  };

  const handleKeyboardShortcuts = useCallback(
    (e: KeyboardEvent) => {
      const isCtrlCmd = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      const target = e.target as HTMLElement;

      if (isDeleteDialogOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setIsDeleteDialogOpen(false);
        }
        return;
      }

      // When in editing mode
      if (isEditing) {
        if (isCtrlCmd && key === 's') {
          e.preventDefault();
          if (hasUnsavedChanges && editorRef.current) {
            editorRef.current.save();
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          handleCancelEdit();
        }
        // Allow other keys to function normally for typing
        return;
      }

      // When not in editing mode
      const isInputElement =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isInputElement && e.key !== 'Tab') {
        return;
      }

      const shortcuts: { [key: string]: () => void } = {
        n: handleCreateNote,
        '/': () => navigate('/dashboard/help?tab=overview'),
        '?': () => navigate('/dashboard/help?tab=overview'),
        t: () => setTheme(isDarkMode || isDeepDarkMode ? 'light' : 'dark'),
        Tab: () => {
          const currentTabIndex = activeTabs.indexOf(activeTab);
          const nextIndex = (currentTabIndex + 1) % activeTabs.length;
          setActiveTab(activeTabs[nextIndex]);
        },
        b: () => setIsSidebarVisible((prev) => !prev),
        d: () => selectedNoteId && setIsDeleteDialogOpen(true),
        delete: () => selectedNoteId && setIsDeleteDialogOpen(true),
        m: () => navigate('/dashboard/myPage?tab=profile'),
        ',': () => navigate('/dashboard/myPage?tab=activity'),
        '.': () => navigate('/dashboard/myPage?tab=settings'),
      };

      const handler = shortcuts[e.key === 'Tab' ? 'Tab' : key];
      if (handler) {
        e.preventDefault();
        handler();
      }
    },
    [
      isEditing,
      hasUnsavedChanges,
      handleCancelEdit,
      handleCreateNote,
      navigate,
      setTheme,
      isDarkMode,
      isDeepDarkMode,
      activeTabs,
      activeTab,
      selectedNoteId,
      isDeleteDialogOpen,
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

  if (isNotesLoading) return <DashboardPageLoader />;

  const renderMainContent = () => {
    const filteredNotes = selectedTag
      ? (notes || []).filter(
          (note) => note && (note.tags || []).includes(selectedTag),
        )
      : notes || [];

    switch (activeTab) {
      case 'notes': {
        const editorContent = (
          <Suspense fallback={<EditorLoader />}>
            {isNoteContentLoading ? (
              <EditorLoader />
            ) : selectedNote ? (
              <Editor
                ref={editorRef}
                key={selectedNote.id}
                note={selectedNote}
                onSave={handleSaveNote}
                onDeleteRequest={() => setIsDeleteDialogOpen(true)}
                isEditing={isEditing}
                onEnterEditMode={handleEnterEditMode}
                onCancelEdit={handleCancelEdit}
                onContentChange={() => setHasUnsavedChanges(true)}
                hasUnsavedChanges={hasUnsavedChanges}
              />
            ) : (
              <EmptyNoteState handleCreateNote={handleCreateNote} />
            )}
          </Suspense>
        );

        const noteListContent = (
          <div className="h-full overflow-y-auto border-r custom-scrollbar">
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
        );

        const deleteDialog = (
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
        );

        if (isEditing) {
          return (
            <>
              {deleteDialog}
              <div className="h-full">{editorContent}</div>
            </>
          );
        }

        return (
          <>
            {deleteDialog}
            <ResizablePanelGroup direction="horizontal" className="h-full">
              <ResizablePanel defaultSize={30} minSize={20}>
                {noteListContent}
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={70} minSize={30}>
                <div className="h-full">{editorContent}</div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </>
        );
      }
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
          <main className="flex-1 overflow-auto no-scrollbar">
            {renderMainContent()}
          </main>
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
