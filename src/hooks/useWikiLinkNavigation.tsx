import { useCallback, useState } from 'react';
import { ToastAction } from '@/components/ui/toast';
import type { Note } from '@/types';
import { resolveWikiLinkTitle } from '@/utils/wikiLinkSelection';

// useToast()가 반환하는 toast 함수와 호환되는 최소 시그니처.
type ToastFn = (props: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: 'default' | 'destructive';
  action?: React.ReactElement;
}) => void;

export interface UseWikiLinkNavigationOptions {
  notes: Note[];
  sessionUserId: string | undefined;
  addNote: (note: {
    title: string;
    content: string;
    tags: string[];
  }) => Promise<Note | null>;
  toast: ToastFn;
  setActiveTab: (tab: string) => void;
  handleSelectNote: (note: Note) => void | Promise<void>;
  /**
   * 새로 생성된 노트를 선택 상태로 만듭니다. 내용이 이미 빈 문자열로
   * 알려져 있으므로 handleSelectNote와 달리 fetchNoteContent를 트리거하지
   * 않습니다 (Index.tsx의 handleCreateNote와 동일한 패턴).
   */
  selectNewlyCreatedNote: (note: Note) => void;
}

/**
 * [[위키링크]] 클릭 시 노트를 여는 흐름을 캡슐화합니다.
 * - 정확히 하나 일치: 바로 연다.
 * - 없음: "생성 후 열기" 액션이 달린 토스트를 띄운다.
 * - 여러 개 일치: 선택 다이얼로그 상태를 노출한다.
 */
export function useWikiLinkNavigation(options: UseWikiLinkNavigationOptions) {
  const {
    notes,
    sessionUserId,
    addNote,
    toast,
    setActiveTab,
    handleSelectNote,
    selectNewlyCreatedNote,
  } = options;

  const [isWikiLinkDialogOpen, setIsWikiLinkDialogOpen] = useState(false);
  const [wikiLinkTargetTitle, setWikiLinkTargetTitle] = useState('');
  const [wikiLinkCandidates, setWikiLinkCandidates] = useState<Note[]>([]);

  const resetDialogState = useCallback(() => {
    setWikiLinkCandidates([]);
    setWikiLinkTargetTitle('');
  }, []);

  const closeWikiLinkDialog = useCallback(() => {
    setIsWikiLinkDialogOpen(false);
    resetDialogState();
  }, [resetDialogState]);

  const createAndOpenNoteFromWikiLink = useCallback(
    async (title: string) => {
      if (!sessionUserId) return;

      const newNote = await addNote({
        title: title.trim() || '새로운 노트',
        content: '',
        tags: [],
      });

      if (!newNote) {
        toast({
          title: '노트 생성에 실패했어요',
          description: '잠시 후 다시 시도해주세요.',
          variant: 'destructive',
        });
        return;
      }

      setActiveTab('notes');
      selectNewlyCreatedNote(newNote);
    },
    [addNote, sessionUserId, toast, setActiveTab, selectNewlyCreatedNote],
  );

  const openNoteByTitle = useCallback(
    (title: string) => {
      const resolution = resolveWikiLinkTitle(notes || [], title);

      if (resolution.type === 'single') {
        setActiveTab('notes');
        void handleSelectNote(resolution.note);
        return;
      }

      if (resolution.type === 'none') {
        toast({
          title: '노트를 찾을 수 없어요',
          description: `"${title}" 제목의 노트를 찾지 못했어요.`,
          variant: 'destructive',
          action: (
            <ToastAction
              altText={`"${title}" 노트 생성`}
              onClick={() => {
                void createAndOpenNoteFromWikiLink(title);
              }}
            >
              생성 후 열기
            </ToastAction>
          ),
        });
        return;
      }

      setWikiLinkTargetTitle(title);
      setWikiLinkCandidates(resolution.candidates);
      setIsWikiLinkDialogOpen(true);
    },
    [notes, setActiveTab, handleSelectNote, toast, createAndOpenNoteFromWikiLink],
  );

  const selectWikiLinkCandidate = useCallback(
    (note: Note) => {
      setActiveTab('notes');
      setIsWikiLinkDialogOpen(false);
      resetDialogState();
      void handleSelectNote(note);
    },
    [setActiveTab, handleSelectNote, resetDialogState],
  );

  return {
    isWikiLinkDialogOpen,
    wikiLinkTargetTitle,
    wikiLinkCandidates,
    openNoteByTitle,
    closeWikiLinkDialog,
    selectWikiLinkCandidate,
    createAndOpenNoteFromWikiLink,
  };
}
