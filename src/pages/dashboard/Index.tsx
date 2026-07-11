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
import { Toaster } from '@/components/ui/toaster';

import { useToast } from '@/hooks/useToast';
import { useReminderScheduler } from '@/hooks/useReminderScheduler';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useWikiLinkNavigation } from '@/hooks/useWikiLinkNavigation';
import { deriveAllReminders } from '@/utils/deriveAllReminders';
import { derivePopularTags } from '@/utils/derivePopularTags';
import { useEditGuard } from '@/hooks/useEditGuard';

import { useAuthStore } from '@/stores/authStore';
import { useNotes } from '@/hooks/useNotes';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '@/stores/themeStore';
import logoImage from '@/assets/images/Logo.png';
import logoDarkImage from '@/assets/images/LogoDark.png';
import { Note, EditorReminder } from '@/types';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDataStore } from '@/stores/dataStore';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';

import { DashboardPageLoader } from '@/components/loader/dashboard/DashboardPageLoader';
import { EditorLoader } from '@/components/loader/dashboard/EditorLoader';
import { ReminderLoader } from '@/components/loader/dashboard/ReminderLoader';
import { CalendarLoader } from '@/components/loader/dashboard/CalendarLoader';
import { TimelineLoader } from '@/components/loader/dashboard/TimelineLoader';
import { NoteListLoader } from '@/components/loader/dashboard/NoteListLoader';
import { DashboardTour } from '@/components/features/dashboard/DashboardTour';
import { FeedbackDialog } from '@/components/features/dashboard/FeedbackDialog';
import { EmptyNoteState } from '@/components/features/dashboard/main/EmptyNoteState';
import { DashboardSidebar } from '@/components/features/dashboard/main/DashboardSidebar';
import { MobileNavigation } from '@/components/features/dashboard/main/MobileNavigation';
import { DesktopActions } from '@/components/features/dashboard/main/DesktopActions';

const NoteList = lazy(() =>
  import('@/components/features/dashboard/NoteList').then((module) => ({
    default: module.NoteList,
  })),
);
const Editor = lazy(() =>
  import('@/components/features/dashboard/main/Editor').then((module) => ({
    default: module.Editor,
  })),
);
const ReminderView = lazy(() =>
  import('@/components/features/dashboard/main/Reminder').then((module) => ({
    default: module.ReminderView,
  })),
);
const Calendar = lazy(() =>
  import('@/components/features/dashboard/main/Calendar').then((module) => ({
    default: module.Calendar,
  })),
);
const TimelineView = lazy(() =>
  import('@/components/features/dashboard/main/TimelineView').then(
    (module) => ({
      default: module.TimelineView,
    }),
  ),
);
const TrashView = lazy(() =>
  import('@/components/features/dashboard/main/TrashView').then((module) => ({
    default: module.TrashView,
  })),
);

import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';


export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  useReminderScheduler();
  const { toast } = useToast();
  const { session } = useAuthStore();
  const isSyncing = useDataStore((state) => state.isSyncing);
  const {
    notes,
    trashNotes,
    loading: isNotesLoading,
    addNote,
    updateNote,
    deleteNote, // soft delete default (exposed as deleteNote in useNotes but we need to check if we updated it)
    // Wait, useNotes exposes softDeleteNote separately.
    restoreNote,
    permanentlyDeleteNote,
    deleteReminder,
    updateReminderCompletion,
    updateReminderEnabled,
    fetchNoteContent,
    togglePinNote,
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const editorRef = useRef<{ save: () => void } | null>(null);
  const newlyCreatedNoteId = useRef<string | null>(null);

  const {
    isEditing,
    setIsEditing,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    isCancelDialogOpen,
    handleEnterEditMode,
    handleCancelEdit,
    confirmLeaveEdit,
    cancelLeaveEdit,
  } = useEditGuard();

  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const activeTabs = useMemo(
    () => ['notes', 'reminder', 'calendar', 'timeline'],
    [],
  );

  const allReminders = useMemo(() => deriveAllReminders(notes), [notes]);

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
  }, [notes, selectedNoteId, setIsEditing]);

  useEffect(() => {
    if (selectedNoteId && selectedNoteId === newlyCreatedNoteId.current) {
      setTimeout(() => {
        setIsEditing(true);
        newlyCreatedNoteId.current = null;
      }, 50);
    }
  }, [selectedNoteId, setIsEditing]);

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
    [fetchNoteContent, setIsEditing, setHasUnsavedChanges],
  );

  const selectNewlyCreatedNote = useCallback((note: Note) => {
    setSelectedNoteId(note.id);
  }, []);

  const {
    isWikiLinkDialogOpen,
    wikiLinkTargetTitle,
    wikiLinkCandidates,
    openNoteByTitle,
    closeWikiLinkDialog,
    selectWikiLinkCandidate,
  } = useWikiLinkNavigation({
    notes,
    sessionUserId: session?.user?.id,
    addNote,
    toast,
    setActiveTab,
    handleSelectNote,
    selectNewlyCreatedNote,
  });

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

  useKeyboardShortcuts({
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isEditing,
    hasUnsavedChanges,
    editorRef,
    handleCancelEdit,
    handleCreateNote,
    navigate,
    setTheme,
    isDarkMode,
    isDeepDarkMode,
    activeTabs,
    activeTab,
    setActiveTab,
    setIsSidebarVisible,
    selectedNoteId,
  });

  const logoSrc = useMemo(
    () => (isDarkMode || isDeepDarkMode ? logoDarkImage : logoImage),
    [isDarkMode, isDeepDarkMode],
  );

  const popularTags = useMemo(() => derivePopularTags(notes), [notes]);

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
                notes={notes || []}
                onSave={handleSaveNote}
                onDeleteRequest={() => setIsDeleteDialogOpen(true)}
                onTogglePin={() => togglePinNote(selectedNote.id)}
                isEditing={isEditing}
                onEnterEditMode={handleEnterEditMode}
                onCancelEdit={handleCancelEdit}
                onContentChange={() => setHasUnsavedChanges(true)}
                hasUnsavedChanges={hasUnsavedChanges}
                onBack={() => setSelectedNoteId(null)}
                onWikiLinkClick={openNoteByTitle}
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
                onTogglePin={togglePinNote}
                onWikiLinkClick={openNoteByTitle}
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
                  삭제한 노트는 휴지통에서 되돌릴 수 있습니다.
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
            onOpenChange={(open) => {
              if (!open) cancelLeaveEdit();
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  변경사항이 저장되지 않았습니다
                </AlertDialogTitle>
                <AlertDialogDescription>
                  편집을 취소하시겠습니까? 저장하지 않은 내용은 사라집니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={cancelLeaveEdit}>
                  취소
                </AlertDialogCancel>
                <AlertDialogAction onClick={confirmLeaveEdit}>
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
      case 'trash':
        return (
          <Suspense fallback={<DashboardPageLoader />}>
             <TrashView 
                trashNotes={trashNotes || []}
                onRestore={restoreNote}
                onDeleteForever={permanentlyDeleteNote}
             />
          </Suspense>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`flex flex-col h-full theme-${
        isDarkMode ? (isDeepDarkMode ? 'deepdark' : 'dark') : 'light'
      }`}
    >
      <DashboardTour />
      <FeedbackDialog />
      <Dialog
        open={isWikiLinkDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeWikiLinkDialog();
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>동일한 제목의 노트가 여러 개 있어요</DialogTitle>
            <DialogDescription>
              {"\""}{wikiLinkTargetTitle}{"\""} 제목의 노트를 선택해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
            {wikiLinkCandidates.map((candidate) => (
              <Button
                key={candidate.id}
                variant="outline"
                className="h-auto w-full justify-start py-3 text-left"
                onClick={() => selectWikiLinkCandidate(candidate)}
              >
                <div className="flex w-full flex-col gap-1">
                  <span className="font-medium">{candidate.title}</span>
                  <span className="text-xs text-muted-foreground">
                    경로: {candidate.folder_path || '/'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    수정일: {new Date(candidate.updated_at).toLocaleString('ko-KR')}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
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
            <AnimatePresence>
              {isSyncing && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                >
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span className="hidden sm:inline">동기화 중</span>
                </motion.div>
              )}
            </AnimatePresence>
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
              !isEditing && isSidebarVisible ? 'w-48' : 'w-0 opacity-0'
            }`}
          >
            <DashboardSidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onTagSelect={setSelectedTag}
              isEditing={isEditing}
              popularTags={popularTags}
            />
          </div>
          <main className="flex-1 overflow-auto no-scrollbar flex flex-col">
            {renderMainContent()}
          </main>
        </div>
      </div>
    </div>
  );
};



export default Dashboard;
