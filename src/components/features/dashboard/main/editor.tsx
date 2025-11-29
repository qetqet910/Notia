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
} from 'react';
import { useToast } from '@/hooks/useToast';
import { parseNoteContent } from '@/utils/noteParser';

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
import { supabase } from '@/services/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { v4 as uuidv4 } from 'uuid';
import { EditorToolbar } from '@/components/features/dashboard/editorToolbar';
import { codeMirrorTheme } from '@/components/features/dashboard/editorTheme';

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
    const [tags, setTags] = useState<string[]>([]);
    const [reminders, setReminders] = useState<EditorReminder[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const editorRef = useRef<ReactCodeMirrorRef>(null);
    const { toast } = useToast();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isDesktop = useMediaQuery('(min-width: 1024px)');

    const { title, body } = useMemo(() => {
      const lines = content.split('\n');
      const title = lines[0] || '';
      const body = lines.slice(1).join('\n');
      return { title, body };
    }, [content]);

    const filteredLanguages = languages.filter((lang) =>
      ['javascript', 'css', 'python', 'json'].includes(lang.name),
    );

    const handleImageUpload = useCallback(
      async (file: File): Promise<string | null> => {
        if (!user) {
          toast({
            title: '오류',
            description: '이미지를 업로드하려면 로그인이 필요합니다.',
            variant: 'destructive',
          });
          return null;
        }
        if (file.size > 1024 * 1024 * 5) {
          toast({
            title: '오류',
            description: '이미지 파일 크기는 5MB를 초과할 수 없습니다.',
            variant: 'destructive',
          });
          return null;
        }

        setIsUploading(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `note-images/${user.id}/${fileName}`;

        try {
          const { error } = await supabase.storage
            .from('note-images')
            .upload(filePath, file);

          if (error) {
            throw error;
          }

          const { data } = supabase.storage
            .from('note-images')
            .getPublicUrl(filePath);

          return data.publicUrl;
        } catch (error) {
          console.error('Image upload error:', error);
          toast({
            title: '업로드 실패',
            description: '이미지 업로드 중 오류가 발생했습니다.',
            variant: 'destructive',
          });
          return null;
        } finally {
          setIsUploading(false);
        }
      },
      [user, toast],
    );

    const imageUploadExtension = useMemo(() => {
      return EditorView.domEventHandlers({
        drop(event, view) {
          event.preventDefault();
          const files = event.dataTransfer?.files;
          if (files && files.length > 0 && files[0].type.startsWith('image/')) {
            const imageFile = files[0];
            const uniqueId = uuidv4();
            const placeholder = `![Uploading ${imageFile.name} ${uniqueId}...]()`;
            const pos = view.posAtCoords({
              x: event.clientX,
              y: event.clientY,
            });
            if (pos === null) return;

            view.dispatch({
              changes: { from: pos, insert: placeholder },
            });

            handleImageUpload(imageFile).then((url) => {
              const doc = view.state.doc.toString();
              const placeholderPos = doc.indexOf(placeholder);
              if (placeholderPos === -1) return;

              if (url) {
                const markdownImage = `![${imageFile.name}](${url})`;
                view.dispatch({
                  changes: {
                    from: placeholderPos,
                    to: placeholderPos + placeholder.length,
                    insert: markdownImage,
                  },
                });
              } else {
                // Upload failed, remove placeholder
                view.dispatch({
                  changes: {
                    from: placeholderPos,
                    to: placeholderPos + placeholder.length,
                    insert: '',
                  },
                });
              }
            });
          }
        },
        paste(event, view) {
          const files = event.clipboardData?.files;
          if (files && files.length > 0 && files[0].type.startsWith('image/')) {
            event.preventDefault();
            const imageFile = files[0];
            const uniqueId = uuidv4();
            const placeholder = `![Pasting image ${uniqueId}...]()`;
            const pos = view.state.selection.main.head;

            view.dispatch({
              changes: { from: pos, insert: placeholder },
            });

            handleImageUpload(imageFile).then((url) => {
              const doc = view.state.doc.toString();
              const placeholderPos = doc.indexOf(placeholder);
              if (placeholderPos === -1) return;

              if (url) {
                const markdownImage = `![${imageFile.name}](${url})`;
                view.dispatch({
                  changes: {
                    from: placeholderPos,
                    to: placeholderPos + placeholder.length,
                    insert: markdownImage,
                  },
                });
              } else {
                // Upload failed, remove placeholder
                view.dispatch({
                  changes: {
                    from: placeholderPos,
                    to: placeholderPos + placeholder.length,
                    insert: '',
                  },
                });
              }
            });
          }
        },
      });
    }, [handleImageUpload]);

    const isResettingRef = useRef(false);

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

    useEffect(() => {
      resetStateFromNote(note);
    }, [note, resetStateFromNote]);

    const remindersRef = useRef(reminders);
    useEffect(() => {
      remindersRef.current = reminders;
    }, [reminders]);

    useEffect(() => {
      if (isResettingRef.current) {
        isResettingRef.current = false;
        return;
      }

      const { tags: currentTags, reminders: currentRemindersRaw } =
        parseNoteContent(content, new Date(), remindersRef.current);

      setTags(currentTags.map((t) => t.text));

      setReminders((prevReminders) => {
        return currentRemindersRaw
          .filter(
            (p) =>
              p.parsedDate instanceof Date && !isNaN(p.parsedDate.getTime()),
          )
          .map((parsed) => {
            // originalText가 같은 기존 리마인더를 찾습니다.
            const existing = prevReminders.find(
              (r) => r.original_text === parsed.originalText,
            );

            // 기존 리마인더가 있다면, (DB에 저장된 것이든, 현재 편집 세션의 임시 것이든)
            // '시간'을 새로 파싱된 시간(상대 시간의 경우 현재 기준 내일 등)으로 덮어쓰지 않고
            // 기존에 확정된 시간을 유지합니다.
            // 단, 텍스트가 변경되어 originalText가 달라진 경우는 새로운 리마인더로 취급되어
            // 위 find에서 찾지 못하므로 자연스럽게 새로운 파싱 시간이 적용됩니다.
            const resolvedDate = existing ? existing.date : parsed.parsedDate!;
            
            // id도 기존 것을 유지하거나, 없으면 임시 id 발급
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
    }, [content]);

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
                      <EditorToolbar editorRef={editorRef} />
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
                          EditorView.lineWrapping,
                        ]}
                        onChange={(value) => {
                          setContent(value);
                          onContentChange();
                        }}
                        className="w-full h-full text-lg"
                        theme={codeMirrorTheme}
                        placeholder="제목을 입력하세요..."
                      />
                    </div>
                  </ResizablePanel>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize={50}>
                    <PreviewPanel
                      content={body}
                      title={title}
                      displayTags={displayTags}
                      displayReminders={displayReminders}
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
                      <EditorToolbar editorRef={editorRef} />
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
                          EditorView.lineWrapping,
                        ]}
                        onChange={(value) => {
                          setContent(value);
                          onContentChange();
                        }}
                        className="w-full h-full text-lg"
                        theme={codeMirrorTheme}
                        placeholder="제목을 입력하세요..."
                      />
                    </div>
                  </TabsContent>
                  <TabsContent
                    value="preview"
                    className="flex-1 overflow-hidden data-[state=inactive]:hidden"
                  >
                    <PreviewPanel
                      content={body}
                      title={title}
                      displayTags={displayTags}
                      displayReminders={displayReminders}
                    />
                  </TabsContent>
                </Tabs>
              )}
            </>
          ) : (
            <PreviewPanel
              content={body}
              isReadOnly
              title={title}
              displayTags={displayTags}
              displayReminders={displayReminders}
            />
          )}
        </div>
      </div>
    );
  },
);

Editor.displayName = 'Editor';

interface PreviewPanelProps {
  content: string;
  isReadOnly?: boolean;
  title?: string;
  displayTags?: { text: string }[];
  displayReminders?: { reminderText: string; parsedDate?: Date }[];
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  content,
  isReadOnly = false,
  title,
  displayTags,
  displayReminders,
}) => (
  <div className="h-full overflow-y-auto custom-scrollbar">
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
);