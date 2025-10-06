import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  Suspense,
  lazy,
} from 'react';
import { useNavigate, useBlocker } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Toaster } from '@/components/ui/toaster';

import { useToast } from '@/hooks/useToast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { GoalProgress } from '@/components/features/dashboard/goalProgress';
import { UserProfile } from '@/components/features/dashboard/userProfile';
import { useAuthStore } from '@/stores/authStore';
import { useNotes } from '@/hooks/useNotes';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import PlusCircle from 'lucide-react/dist/esm/icons/plus-circle';
import CalendarIcon from 'lucide-react/dist/esm/icons/calendar';
import Clock from 'lucide-react/dist/esm/icons/clock';
import List from 'lucide-react/dist/esm/icons/list';
import Menu from 'lucide-react/dist/esm/icons/menu';
import User from 'lucide-react/dist/esm/icons/user';
import Activity from 'lucide-react/dist/esm/icons/activity';
import Settings from 'lucide-react/dist/esm/icons/settings';
import Monitor from 'lucide-react/dist/esm/icons/monitor';
import LogOut from 'lucide-react/dist/esm/icons/log-out';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const editorRef = useRef<{ save: () => void } | null>(null);
  const newlyCreatedNoteId = useRef<string | null>(null);

  const blocker = useBlocker(isEditing);

  useEffect(() => {
    if (blocker.state === 'blocked') {
      if (hasUnsavedChanges) {
        setIsCancelDialogOpen(true);
      } else {
        blocker.proceed();
      }
    }
  }, [blocker, hasUnsavedChanges]);

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
                onBack={() => setSelectedNoteId(null)}
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

        const cancelDialog = (
          <AlertDialog
            open={isCancelDialogOpen}
            onOpenChange={setIsCancelDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>변경사항이 저장되지 않았습니다</AlertDialogTitle>
                <AlertDialogDescription>
                  편집을 취소하시겠습니까? 저장하지 않은 내용은 사라집니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={() => {
                    blocker.reset?.();
                  }}
                >
                  취소
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    handleCancelEdit();
                    blocker.proceed?.();
                  }}
                >
                  나가기
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        );

        if (isEditing) {
          return (
            <>
              {deleteDialog}
              {cancelDialog}
              <div className="h-full">{editorContent}</div>
            </>
          );
        }

        return (
          <>
            {deleteDialog}
            {cancelDialog}
            {/* Desktop layout */}
            <div className="hidden md:flex h-full">
              <ResizablePanelGroup direction="horizontal" className="h-full">
                <ResizablePanel defaultSize={30} minSize={20}>
                  {noteListContent}
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={70} minSize={30}>
                  <div className="h-full">{editorContent}</div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
            {/* Mobile layout */}
            <div className="md:hidden h-full overflow-hidden relative">
              <motion.div
                className="h-full w-full"
                animate={{
                  scale: selectedNoteId ? 0.95 : 1,
                  x: selectedNoteId ? '-25%' : '0%',
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                {noteListContent}
              </motion.div>

              <AnimatePresence>
                {selectedNoteId && (
                  <motion.div
                    key="editor"
                    className="h-full absolute w-full top-0 left-0"
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(_, info) => {
                      if (info.offset.x > 100) {
                        setSelectedNoteId(null);
                      }
                    }}
                  >
                    {editorContent}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
            <div className="md:hidden">
              <MobileNavigation
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                handleCreateNote={handleCreateNote}
                popularTags={popularTags}
                onTagSelect={(tag) => {
                  setActiveTab('notes');
                  setSelectedTag(tag);
                }}
              />
            </div>
            <div className="hidden md:block">
              <DesktopActions handleCreateNote={handleCreateNote} />
            </div>
          </div>
        </header>
        <div className="flex flex-1 overflow-hidden">
          <div
            className={`transition-all duration-300 ease-in-out h-full hidden md:block ${
              !isEditing && isSidebarVisible ? 'w-56' : 'w-0 opacity-0'
            }`}
          >
            <Sidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onTagSelect={setSelectedTag}
              isEditing={isEditing}
              popularTags={popularTags}
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
  popularTags,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onTagSelect: (tag: string) => void;
  isEditing: boolean;
  popularTags: { tag: string; count: number }[];
}) => {
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
  popularTags,
  onTagSelect,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  handleCreateNote: () => void;
  popularTags: { tag: string; count: number }[];
  onTagSelect: (tag: string) => void;
}) => {
  const navigate = useNavigate();
  const { userProfile, user, signOut, isLogoutLoading } = useAuthStore();
  const { toast } = useToast();
  const { setTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);

  const displayName =
    userProfile?.display_name || user?.user_metadata?.name || '사용자';
  const displayEmail =
    userProfile?.email && !userProfile.email.startsWith('anon_')
      ? userProfile.email
      : user?.email && !user.email.startsWith('anon_')
      ? user.email
      : '';
  const avatarUrl =
    userProfile?.avatar_url || user?.user_metadata?.avatar_url || '';
  const initials = displayName?.substring(0, 1).toUpperCase() || '사';

  const handleSignOut = async () => {
    try {
      const result = await signOut();
      if (result.success) {
        toast({
          title: '로그아웃 성공',
          description: '성공적으로 로그아웃되었습니다.',
        });
        setTheme('system');
        navigate('/login');
      } else {
        throw result.error || new Error('로그아웃 실패');
      }
    } catch (error) {
      toast({
        title: '로그아웃 실패',
        description:
          error instanceof Error
            ? error.message
            : '로그아웃 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <Button
        variant="ghost"
        onClick={() => {
          handleCreateNote();
          setIsOpen(false);
        }}
      >
        <PlusCircle />
      </Button>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72 bg-background p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>모바일 메뉴</SheetTitle>
          <SheetDescription>
            노트, 리마인더, 캘린더, 타임라인 등 주요 기능으로 이동할 수 있는
            메뉴입니다.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-semibold">{displayName}</span>
                  <span className="text-sm text-muted-foreground">
                    {displayEmail}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-4">
              <Button
                variant="outline"
                className="w-full justify-start mb-4"
                onClick={() => {
                  handleCreateNote();
                  setIsOpen(false);
                }}
              >
                <PlusCircle className="mr-2 h-4 w-4" />새 노트
              </Button>
              <nav className="flex flex-col gap-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant={activeTab === item.id ? 'secondary' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsOpen(false);
                      }}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Button>
                  );
                })}
              </nav>
              <Separator className="my-4" />
              <nav className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() =>
                    handleNavigation('/dashboard/myPage?tab=profile')
                  }
                >
                  <User className="mr-2 h-4 w-4" />
                  마이페이지
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() =>
                    handleNavigation('/dashboard/myPage?tab=activity')
                  }
                >
                  <Activity className="mr-2 h-4 w-4" />
                  활동
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() =>
                    handleNavigation('/dashboard/myPage?tab=settings')
                  }
                >
                  <Settings className="mr-2 h-4 w-4" />
                  설정
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleNavigation('/dashboard/help')}
                >
                  <Monitor className="mr-2 h-4 w-4" />
                  도움말
                </Button>
              </nav>
            </div>
          </div>
          <div className="p-4 border-t">
            {popularTags.length > 0 && (
              <div className="mb-4">
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
                        onTagSelect(tag);
                        setIsOpen(false);
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
            <div className="mb-4">
              <GoalProgress />
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleSignOut}
              disabled={isLogoutLoading}
            >
              {isLogoutLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              로그아웃
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

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
