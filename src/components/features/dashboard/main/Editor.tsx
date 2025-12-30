import {
  useRef,
  useState,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useCallback,
  Suspense,
  lazy,
  useDeferredValue,
} from 'react';
import { useToast } from '@/hooks/useToast';
import { parseNoteContent, parseNoteContentAsync } from '@/utils/noteParser';

import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorView } from '@codemirror/view';
import { keymap } from '@codemirror/view';

import {
  history,
  historyKeymap,
  defaultKeymap,
  redo,
  deleteLine,
} from '@codemirror/commands';
import { indentOnInput } from '@codemirror/language';
import { bracketMatching } from '@codemirror/matchbrackets';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/closebrackets';
import { autocompletion } from '@codemirror/autocomplete';

import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { MarkdownPreviewLoader } from '@/components/loader/dashboard/MarkdownPreviewLoader';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Save from 'lucide-react/dist/esm/icons/save';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Tag from 'lucide-react/dist/esm/icons/tag';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Edit3 from 'lucide-react/dist/esm/icons/edit-3';
import Eye from 'lucide-react/dist/esm/icons/eye';
import X from 'lucide-react/dist/esm/icons/x';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import HelpCircle from 'lucide-react/dist/esm/icons/help-circle';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Note, EditorReminder, Reminder } from '@/types';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { EditorToolbar } from '@/components/features/dashboard/toolbar/EditorToolbar';
import { codeMirrorTheme } from '@/components/features/dashboard/editorTheme';
import { checkboxPlugin } from '@/components/features/dashboard/main/checkboxPlugin';
import { createSlashCommandCompletion } from '@/components/features/dashboard/main/slashCommand';
import { useImageUpload } from '@/hooks/editor/useImageUpload';
import { useScrollSync } from '@/hooks/editor/useScrollSync';

const MarkdownPreview = lazy(() =>
  import('@/components/features/dashboard/MarkdownPreview').then((module) => ({
    default: module.MarkdownPreview,
  })),
);

interface EditorProps {
  note: Note;
  onSave: (
    noteId: string,
    updates: Partial<
      Pick<Note, 'title' | 'content' | 'tags'> & {
        reminders: EditorReminder[];
      }
    >,
  ) => void;
  onDeleteRequest: () => void;
  isEditing: boolean;
  onEnterEditMode: () => void;
  onCancelEdit: () => void;
  onContentChange: () => void;
  hasUnsavedChanges: boolean;
  onBack?: () => void;
}

interface EditorRef {
  save: () => void;
}

const formatDate = (date: Date): string => {
  if (!date || !(date instanceof Date)) return '날짜 정보 없음';
  const timeString = `${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
  return `${date.getMonth() + 1}/${date.getDate()} ${timeString}`;
};

const toggleMarkdownFormatting = (
  view: EditorView,
  formatting: string,
): boolean => {
  const { from, to } = view.state.selection.main;
  const selection = view.state.sliceDoc(from, to);
  const formattedText = `${formatting}${selection}${formatting}`;
  view.dispatch({
    changes: { from, to, insert: formattedText },
  });
  return true;
};

const customKeymap = [
  { key: 'Ctrl-d', run: deleteLine },
  { key: 'Ctrl-Shift-z', run: redo },
  {
    key: 'Ctrl-b',
    run: (view: EditorView) => toggleMarkdownFormatting(view, '**'),
  },
  {
    key: 'Ctrl-i',
    run: (view: EditorView) => toggleMarkdownFormatting(view, '_'),
  },
];

export const Editor = forwardRef<EditorRef, EditorProps>(
  (
    {
      note,
      onSave,
      onDeleteRequest,
      isEditing,
      onEnterEditMode,
      onCancelEdit,
      onContentChange,
      hasUnsavedChanges,
      onBack,
    },
    ref,
  ) => {
    const [content, setContent] = useState('');
    // React 19 useDeferredValue: 입력은 즉시, 파싱은 여유로울 때 처리
    const deferredContent = useDeferredValue(content);
    const [tags, setTags] = useState<string[]>([]);
    const [reminders, setReminders] = useState<EditorReminder[]>([]);
    
    // editorRef를 먼저 선언해야 합니다.
    const editorRef = useRef<ReactCodeMirrorRef>(null);
    // useImageUpload 훅에서 필요한 기능들을 가져옵니다.
    const { isUploading, imageUploadExtension, openFileSelector, fileInputRef, handleFileChange } = useImageUpload(editorRef);
    
    const { toast } = useToast();
    const navigate = useNavigate();
    const isDesktop = useMediaQuery('(min-width: 1024px)');

    // Slash Command 확장 생성 (이미지 업로드 콜백 연결)
    const slashCommandExtension = useMemo(() => 
      autocompletion({ override: [createSlashCommandCompletion(openFileSelector)] }), 
    [openFileSelector]);


    const { title, body } = useMemo(() => {
      const lines = content.split('\n');
      const title = lines[0] || '';
      const body = lines.slice(1).join('\n');
      return { title, body };
    }, [content]);

    // 미리보기 및 파싱용 (Deferred 반영)
    const { title: debouncedTitle, body: debouncedBody } = useMemo(() => {
      const lines = deferredContent.split('\n');
      const title = lines[0] || '';
      const body = lines.slice(1).join('\n');
      return { title, body };
    }, [deferredContent]);

    const filteredLanguages = languages.filter((lang) =>
      ['javascript', 'css', 'python', 'json'].includes(lang.name),
    );







    const isResettingRef = useRef(false);
    const previewRef = useRef<HTMLDivElement>(null);
    const { handleEditorScroll, handlePreviewScroll } = useScrollSync(
      editorRef,
      previewRef,
    );

    const resetStateFromNote = useCallback((noteToReset: Note) => {
      isResettingRef.current = true;
      const initialContent = `${noteToReset.title}\n${noteToReset.content}`;
      setContent(initialContent);

      const existingEditorReminders: EditorReminder[] = (
        noteToReset.reminders || []
      ).map((r: Reminder) => ({
        id: r.id,
        text: r.reminder_text,
        date: new Date(r.reminder_time),
        completed: r.completed,
        enabled: r.enabled,
        original_text: r.original_text,
      }));

      const { tags: initialTags, reminders: initialReminders } =
        parseNoteContent(initialContent, new Date(), existingEditorReminders);

      setTags(initialTags.map((t) => t.text));
      setReminders(
        initialReminders
          .filter(
            (p) =>
              p.parsedDate instanceof Date && !isNaN(p.parsedDate.getTime()),
          )
          .map((parsed) => {
            const existing = existingEditorReminders.find(
              (er) => er.original_text === parsed.originalText,
            );
            return {
              id: existing?.id || `temp-${parsed.originalText}-${Date.now()}`,
              text: parsed.reminderText!,
              date: parsed.parsedDate!,
              completed: existing?.completed || false,
              enabled: existing?.enabled ?? true,
              original_text: parsed.originalText,
            };
          }),
      );
    }, []);

    // ... (useEffect hooks for resetStateFromNote and remindersRef remain same)



    useEffect(() => {
      resetStateFromNote(note);
    }, [note, resetStateFromNote]);

    const remindersRef = useRef(reminders);
    useEffect(() => {
      remindersRef.current = reminders;
    }, [reminders]);

    // 파싱 로직: useDeferredValue 덕분에 딜레이 없이 실행해도 
    // 리액트가 입력 우선순위를 유지하며 최적의 타이밍에 실행합니다.
    useEffect(() => {
      if (isResettingRef.current) {
        isResettingRef.current = false;
        return;
      }

      const performParsing = async () => {
        const { tags: currentTags, reminders: currentRemindersRaw } =
          await parseNoteContentAsync(deferredContent, new Date(), remindersRef.current);

        setTags(currentTags.map((t) => t.text));

        setReminders((prevReminders) => {
          return currentRemindersRaw
            .filter(
              (p) =>
                p.parsedDate instanceof Date && !isNaN(p.parsedDate.getTime()),
            )
            .map((parsed) => {
              const existing = prevReminders.find(
                (r) => r.original_text === parsed.originalText,
              );

              const resolvedDate = existing ? existing.date : parsed.parsedDate!;
              const resolvedId = existing?.id || `temp-${parsed.originalText}-${Date.now()}`;

              return {
                id: resolvedId,
                text: parsed.reminderText!,
                date: resolvedDate,
                completed: existing?.completed || false,
                enabled: existing?.enabled ?? true,
                original_text: parsed.originalText,
              };
            });
        });
      };

      performParsing();
    }, [deferredContent]);

    const handleSave = useCallback(() => {
      onSave(note.id, {
        title,
        content: body,
        tags,
        reminders,
      });
      onCancelEdit();
      toast({
        title: '저장 완료',
        description: '노트가 성공적으로 저장되었습니다.',
      });
    }, [note.id, title, body, tags, reminders, onSave, onCancelEdit, toast]);

    useImperativeHandle(ref, () => ({ save: handleSave }), [handleSave]);

    const handleCancel = useCallback(() => {
      resetStateFromNote(note);
      onCancelEdit();
    }, [note, onCancelEdit, resetStateFromNote]);

    useEffect(() => {
      if (!isEditing) return;
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') handleCancel();
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isEditing, handleCancel]);

    const navigateHandler = () => navigate('/dashboard/help?tab=shortcuts');

    const displayTags = useMemo(() => tags.map((t) => ({ text: t })), [tags]);
    const displayReminders = useMemo(
      () =>
        reminders.map((r) => ({
          reminderText: r.text,
          parsedDate: r.date,
          originalText: r.original_text,
        })),
      [reminders],
    );

    return (
      <div className="flex flex-col h-full bg-background">
        <div className="flex justify-between items-center p-4 border-b border-border">
          <div className="flex items-center">
            <h2 className="flex items-center h-full text-lg font-semibold">
              {onBack && !isEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onBack}
                  className="mr-2"
                >
                  <ArrowLeft />
                </Button>
              )}
              <div className="mt-1">
                {isEditing ? `편집 중 | ${title}` : '미리보기'}
              </div>
            </h2>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-1 h-8 w-8">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" side="right" align="start">
                <div className="space-y-2 text-sm">
                  <h3 className="font-semibold">사용법</h3>
                  <div className="space-y-1">
                    <p>• #태그명 - 태그 추가</p>
                    <p>• @시간 할일내용. - 리마인더 추가</p>
                  </div>
                  <h3 className="font-semibold mt-3">시간 형식</h3>
                  <div className="space-y-1 text-xs">
                    <p>• @1시간 → 1시간 후</p>
                    <p>• @내일 2시 → 내일 오후 2시</p>
                    <p>• @모레 10시 → 모레 오전 10시</p>
                    <p>• @00시, @0시, @24시 → 자정</p>
                    <p>• @2025-05-25 → 해당 날짜 09:00</p>
                    <p>• @3시 → 오후 3시 (15:00)</p>
                    <p>• @15시 → 오후 3시 (15:00)</p>
                  </div>
                  <h3 className="font-semibold mt-3">키보드 단축키</h3>
                  <div className="space-y-1 text-xs">
                    <p
                      className="cursor-pointer hover:underline hover:text-blue-500 transition-all .25s"
                      onClick={navigateHandler}
                    >
                      • 단축키 도움말 바로가기
                    </p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onDeleteRequest}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> 삭제
                </Button>
                <Button variant="default" size="sm" onClick={onEnterEditMode}>
                  <Edit3 className="h-4 w-4 mr-1" /> 수정
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-1" /> 취소
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges || isUploading}
                >
                  <Save className="h-4 w-4 mr-1" />
                  {isUploading ? '업로드 중...' : '저장'}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {isEditing ? (
            <>
              {isDesktop ? (
                // Desktop: Resizable Panel Layout
                <ResizablePanelGroup direction="horizontal" className="h-full">
                  <ResizablePanel defaultSize={50}>
                    <div className="p-4 pt-0 h-full flex flex-col">
                      <EditorToolbar editorRef={editorRef} onImageClick={openFileSelector} />
                      <div className="flex-1 min-h-0">
                        <CodeMirror
                          ref={editorRef}
                          value={content}
                          height="100%"
                          basicSetup={false}
                          extensions={[
                            markdown({
                              base: markdownLanguage,
                              codeLanguages: filteredLanguages,
                            }),
                            history(),
                            indentOnInput(),
                            bracketMatching(),
                            closeBrackets(),
                            keymap.of([
                              ...customKeymap,
                              ...defaultKeymap,
                              ...historyKeymap,
                              ...closeBracketsKeymap,
                            ]),
                            imageUploadExtension,
                            checkboxPlugin,
                            slashCommandExtension,
                            EditorView.lineWrapping,
                            EditorView.theme({
                              '.cm-content': { paddingBottom: '50px' },
                              '.cm-scroller': { paddingBottom: '50px' },
                              '.cm-line': { lineHeight: '1.2', padding: '0' },
                              // Autocomplete Tooltip Styles
                              '.cm-tooltip': {
                                border: '1px solid hsl(var(--border))',
                                backgroundColor: 'hsl(var(--popover))',
                                color: 'hsl(var(--popover-foreground))',
                                borderRadius: 'calc(var(--radius) - 2px)',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                              },
                              '.cm-tooltip-autocomplete': {
                                '& > ul > li': {
                                  fontFamily: "'NoonnuBasicGothicRegular', sans-serif",
                                  padding: '4px 8px',
                                },
                                '& > ul > li[aria-selected]': {
                                  backgroundColor: 'hsl(var(--accent))',
                                  color: 'hsl(var(--accent-foreground))',
                                },
                                '& > ul > li:hover': {
                                  backgroundColor: 'hsl(var(--accent))',
                                  color: 'hsl(var(--accent-foreground))',
                                },
                              },
                              '.cm-completionLabel': {
                                fontWeight: 'bold',
                              },
                              '.cm-completionDetail': {
                                color: 'hsl(var(--muted-foreground))',
                                fontStyle: 'normal',
                                marginLeft: '0.5em',
                                fontSize: '0.85em',
                              },
                              '.cm-completionIcon': {
                                display: 'none',
                              },
                            }),
                          ]}
                          onUpdate={(viewUpdate) => {
                            if (viewUpdate.viewportChanged) {
                              handleEditorScroll(viewUpdate.view);
                            }
                          }}
                          onChange={(value) => {
                            setContent(value);
                            onContentChange();
                          }}
                          className="w-full h-full text-lg"
                          theme={codeMirrorTheme}
                          placeholder="제목을 입력하세요..."
                        />
                      </div>
                    </div>
                  </ResizablePanel>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize={50}>
                    <PreviewPanel
                      ref={previewRef}
                      content={debouncedBody}
                      title={debouncedTitle}
                      displayTags={displayTags}
                      displayReminders={displayReminders}
                      onScroll={handlePreviewScroll}
                    />
                  </ResizablePanel>
                </ResizablePanelGroup>
              ) : (
                // Mobile & Tablet: Tabs Layout
                <Tabs defaultValue="edit" className="h-full flex flex-col">
                  <div className="p-2 border-b">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="edit">
                        <Edit3 className="w-4 h-4 mr-2" />
                        편집
                      </TabsTrigger>
                      <TabsTrigger value="preview">
                        <Eye className="w-4 h-4 mr-2" />
                        미리보기
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  <TabsContent
                    value="edit"
                    className="flex-1 overflow-hidden data-[state=inactive]:hidden"
                  >
                    <div className="p-4 pt-0 h-full flex flex-col">
                      <EditorToolbar editorRef={editorRef} onImageClick={openFileSelector} />
                      <div className="flex-1 min-h-0">
                        <CodeMirror
                          ref={editorRef}
                          value={content}
                          height="100%"
                          basicSetup={false}
                          extensions={[
                            markdown({
                              base: markdownLanguage,
                              codeLanguages: filteredLanguages,
                            }),
                            history(),
                            indentOnInput(),
                            bracketMatching(),
                            closeBrackets(),
                            keymap.of([
                              ...customKeymap,
                              ...defaultKeymap,
                              ...historyKeymap,
                              ...closeBracketsKeymap,
                            ]),
                            imageUploadExtension,
                            checkboxPlugin,
                            slashCommandExtension,
                            EditorView.lineWrapping,
                            EditorView.theme({
                              '.cm-content': { paddingBottom: '50px' },
                              '.cm-scroller': { paddingBottom: '50px' },
                              '.cm-line': { lineHeight: '1.2', padding: '0' },
                              // Autocomplete Tooltip Styles
                              '.cm-tooltip': {
                                border: '1px solid hsl(var(--border))',
                                backgroundColor: 'hsl(var(--popover))',
                                color: 'hsl(var(--popover-foreground))',
                                borderRadius: 'calc(var(--radius) - 2px)',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                              },
                              '.cm-tooltip-autocomplete': {
                                '& > ul > li': {
                                  fontFamily: "'NoonnuBasicGothicRegular', sans-serif",
                                  padding: '4px 8px',
                                },
                                '& > ul > li[aria-selected]': {
                                  backgroundColor: 'hsl(var(--accent))',
                                  color: 'hsl(var(--accent-foreground))',
                                },
                                '& > ul > li:hover': {
                                  backgroundColor: 'hsl(var(--accent))',
                                  color: 'hsl(var(--accent-foreground))',
                                },
                              },
                              '.cm-completionLabel': {
                                fontWeight: 'bold',
                              },
                              '.cm-completionDetail': {
                                color: 'hsl(var(--muted-foreground))',
                                fontStyle: 'normal',
                                marginLeft: '0.5em',
                                fontSize: '0.85em',
                              },
                              '.cm-completionIcon': {
                                display: 'none',
                              },
                            }),
                          ]}
                          onUpdate={(viewUpdate) => {
                            if (viewUpdate.viewportChanged) {
                              handleEditorScroll(viewUpdate.view);
                            }
                          }}
                          onChange={(value) => {
                            setContent(value);
                            onContentChange();
                          }}
                          className="w-full h-full text-lg"
                          theme={codeMirrorTheme}
                          placeholder="제목을 입력하세요..."
                        />
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent
                    value="preview"
                    className="flex-1 overflow-hidden data-[state=inactive]:hidden"
                  >
                    <PreviewPanel
                      ref={previewRef}
                      content={debouncedBody}
                      title={debouncedTitle}
                      displayTags={displayTags}
                      displayReminders={displayReminders}
                      onScroll={handlePreviewScroll}
                    />
                  </TabsContent>
                </Tabs>
              )}
            </>
          ) : (
            <PreviewPanel
              ref={previewRef}
              content={body}
              title={title}
              displayTags={displayTags}
              displayReminders={displayReminders}
            />
          )}
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
        />
      </div>
    );
  },
);

Editor.displayName = 'Editor';

interface PreviewPanelProps {
  content: string;
  title?: string;
  displayTags?: { text: string }[];
  displayReminders?: { reminderText: string; parsedDate?: Date }[];
  onScroll?: () => void;
}

const PreviewPanel = forwardRef<HTMLDivElement, PreviewPanelProps>(({
  content,
  title,
  displayTags,
  displayReminders,
  onScroll,
}, ref) => (
  <div
    ref={ref}
    className="h-full overflow-y-auto custom-scrollbar"
    onScroll={onScroll}
  >
    <h1 className="text-4xl pl-4 pt-4 font-bold mb-4">
      {title || '제목 없음'}
    </h1>
    {(displayTags?.length > 0 || displayReminders?.length > 0) && (
      <div className="sticky top-0 z-10 border-b border-t bg-background p-4 rounded-b-lg space-y-4">
        {displayTags && displayTags.length > 0 && (
          <div className="flex items-center">
            <Tag className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
            <Carousel
              opts={{ align: 'start', loop: false }}
              className="w-full"
            >
              <CarouselContent className="-ml-1">
                {displayTags.map((tag, index) => (
                  <CarouselItem
                    key={index}
                    className="basis-auto pl-1 pr-1"
                  >
                    <Badge variant="secondary">#{tag.text}</Badge>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        )}
        {displayReminders && displayReminders.length > 0 && (
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
            <Carousel
              opts={{ align: 'start', loop: false }}
              className="w-full"
            >
              <CarouselContent className="-ml-1">
                {displayReminders.map((reminder, index) => (
                  <CarouselItem
                    key={index}
                    className="basis-auto pl-1 pr-1"
                  >
                    <div className="flex-shrink-0 flex items-center gap-2 p-2 pr-4 bg-background rounded-lg border border-border min-w-fit">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <div className="flex-1 whitespace-nowrap">
                        <div className="font-medium text-sm">
                          {reminder.parsedDate ? (
                            <span className="text-green-600 dark:text-green-400 mr-2">
                              {formatDate(reminder.parsedDate)}
                            </span>
                          ) : (
                            <span className="text-orange-600 dark:text-orange-400 mr-2">
                              시간 파싱 실패
                            </span>
                          )}
                          {reminder.reminderText}
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        )}
      </div>
    )}
    <div className="p-4">
      <Suspense fallback={<MarkdownPreviewLoader />}>
        <MarkdownPreview content={content} />
      </Suspense>
    </div>
  </div>
));

PreviewPanel.displayName = 'PreviewPanel';