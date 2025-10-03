import React, {
  useState,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useCallback,
  Suspense,
  lazy,
  useRef,
} from 'react';
import { useToast } from '@/hooks/useToast';
import { parseNoteContent } from '@/utils/noteParser';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import { MarkdownPreviewLoader } from '@/components/loader/dashboard/MarkdownPreviewLoader';
import {
  Trash2,
  Save,
  Calendar,
  Tag,
  Clock,
  HelpCircle,
  Edit3,
  Eye,
  X,
  ArrowLeft,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Note, EditorReminder, Reminder } from '@/types';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';

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
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow =
    date.toDateString() ===
    new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
  const timeString = `${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
  if (isToday) return `오늘 ${timeString}`;
  if (isTomorrow) return `내일 ${timeString}`;
  return `${date.getMonth() + 1}/${date.getDate()} ${timeString}`;
};

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
    const [title, setTitle] = useState(note.title);
    const [content, setContent] = useState(note.content);
    const [tags, setTags] = useState<string[]>([]);
    const [reminders, setReminders] = useState<EditorReminder[]>([]);
    const { toast } = useToast();
    const navigate = useNavigate();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
      setTitle(note.title);
      setContent(note.content);

      const existingEditorReminders: EditorReminder[] = (
        note.reminders || []
      ).map((r: Reminder) => ({
        id: r.id,
        text: r.reminder_text,
        date: new Date(r.reminder_time),
        completed: r.completed,
        enabled: r.enabled,
        original_text: r.original_text,
      }));

      const { tags: initialTags, reminders: initialReminders } =
        parseNoteContent(note.content, new Date(), existingEditorReminders);

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
    }, [note]);

    useEffect(() => {
      if (content === note.content && title === note.title) return;

      const { tags: currentTags, reminders: currentRemindersRaw } =
        parseNoteContent(content, new Date());

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
            return {
              id: existing?.id || `temp-${parsed.originalText}-${Date.now()}`,
              text: parsed.reminderText!,
              date: existing?.date || parsed.parsedDate!,
              completed: existing?.completed || false,
              enabled: existing?.enabled ?? true,
              original_text: parsed.originalText,
            };
          });
      });
    }, [content, title, note.content, note.title]);

    const handleSave = useCallback(() => {
      onSave(note.id, {
        title,
        content,
        tags,
        reminders,
      });
      onCancelEdit();
      toast({
        title: '저장 완료',
        description: '노트가 성공적으로 저장되었습니다.',
      });
    }, [note.id, title, content, tags, reminders, onSave, onCancelEdit, toast]);

    useImperativeHandle(ref, () => ({ save: handleSave }), [handleSave]);

    const handleCancel = useCallback(() => {
      setTitle(note.title);
      setContent(note.content);

      const existingEditorReminders: EditorReminder[] = (
        note.reminders || []
      ).map((r: Reminder) => ({
        id: r.id,
        text: r.reminder_text,
        date: new Date(r.reminder_time),
        completed: r.completed,
        enabled: r.enabled,
        original_text: r.original_text,
      }));

      const { tags: initialTags, reminders: initialReminders } =
        parseNoteContent(note.content, new Date(), existingEditorReminders);

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
              date: existing?.date || parsed.parsedDate!,
              completed: existing?.completed || false,
              enabled: existing?.enabled ?? true,
              original_text: parsed.originalText,
            };
          }),
      );

      onCancelEdit();
    }, [note, onCancelEdit]);

    useEffect(() => {
      if (!isEditing) return;

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          handleCancel();
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [isEditing, handleCancel]);

    const navigateHandler = () => navigate('/dashboard/help?tab=shortcuts');

    const displayTags = useMemo(() => tags.map((t) => ({ text: t })), [tags]);
    const displayReminders = useMemo(
      () =>
        reminders.map((r) => ({
          reminderText: r.text,
          parsedDate: r.date,
          // text: r.original_text.match(/@(.*)\./)?.[1] || '',
          originalText: r.original_text,
        })),
      [reminders],
    );

    return (
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-border">
          <div className="flex items-center">
            <h2 className="flex items-center h-full text-lg font-semibold">
              {onBack && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onBack}
                  className=""
                >
                  <ArrowLeft />
                </Button>
              )}
              <div className="mt-1">{isEditing ? '편집 중' : '미리보기'}</div>
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
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onDeleteRequest}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  삭제
                </Button>
                <Button variant="default" size="sm" onClick={onEnterEditMode}>
                  <Edit3 className="h-4 w-4 mr-1" />
                  수정
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-1" />
                  취소
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges}
                >
                  <Save className="h-4 w-4 mr-1" />
                  저장
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {isEditing ? (
            <>
              {/* Desktop: Resizable Panel Layout */}
              <div className="hidden lg:block h-full">
                <ResizablePanelGroup direction="horizontal" className="h-full">
                  <ResizablePanel defaultSize={50}>
                    <EditingPanel
                      title={title}
                      setTitle={setTitle}
                      onContentChange={onContentChange}
                      displayTags={displayTags}
                      displayReminders={displayReminders}
                      content={content}
                      setContent={setContent}
                      textareaRef={textareaRef}
                    />
                  </ResizablePanel>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize={50}>
                    <PreviewPanel content={content} />
                  </ResizablePanel>
                </ResizablePanelGroup>
              </div>

              {/* Mobile & Tablet: Tabs Layout */}
              <div className="lg:hidden h-full">
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
                    <EditingPanel
                      title={title}
                      setTitle={setTitle}
                      onContentChange={onContentChange}
                      displayTags={displayTags}
                      displayReminders={displayReminders}
                      content={content}
                      setContent={setContent}
                      textareaRef={textareaRef}
                    />
                  </TabsContent>
                  <TabsContent
                    value="preview"
                    className="flex-1 overflow-hidden data-[state=inactive]:hidden"
                  >
                    <PreviewPanel content={content} />
                  </TabsContent>
                </Tabs>
              </div>
            </>
          ) : (
            <PreviewPanel
              content={content}
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

// Helper components to avoid repetition
const EditingPanel = ({
  title,
  setTitle,
  onContentChange,
  displayTags,
  displayReminders,
  content,
  setContent,
  textareaRef,
}: any) => (
  <div className="h-full flex flex-col">
    {/* Title Input */}
    <div className="p-4 border-b border-border pl-6">
      <Input
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          onContentChange();
        }}
        placeholder="제목을 입력하세요"
        className="text-lg font-medium"
      />
    </div>

    {/* Tags and Reminders */}
    {(displayTags.length > 0 || displayReminders.length > 0) && (
      <div
        className={`border-b border-border bg-muted/30 transition-all duration-300 ease-in-out p-2`}
      >
        {displayTags.length > 0 && (
          <div className={`mb-3 pl-5`}>
            <div className="flex items-center mb-2">
              <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm font-medium">태그</span>
            </div>
            <Carousel
              opts={{
                align: 'start',
                loop: false,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-0">
                {displayTags.map((tag: any, index: number) => (
                  <CarouselItem key={index} className="basis-auto pl-1 pr-1">
                    <Badge variant="secondary">#{tag.text}</Badge>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        )}

        {displayReminders.length > 0 && (
          <div className={`mt-3 pl-5`}>
            <div className="flex items-center mb-2">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm font-medium">리마인더</span>
            </div>
            <Carousel
              opts={{
                align: 'start',
                loop: false,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-0">
                {displayReminders.map((reminder: any, index: number) => (
                  <CarouselItem key={index} className="basis-auto pl-1 pr-1">
                    <div className="flex-shrink-0 flex items-center gap-2 p-2 pr-4 bg-background rounded-lg border border-border min-w-fit">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <div className="flex-1 whitespace-nowrap">
                        <div className="font-medium text-sm">
                          {reminder.reminderText}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {reminder.parsedDate ? (
                            <span className="text-green-600 dark:text-green-400">
                              {formatDate(reminder.parsedDate)}
                            </span>
                          ) : (
                            <span className="text-orange-600 dark:text-orange-400">
                              시간 파싱 실패
                            </span>
                          )}
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

    {/* Editor */}
    <div className="p-4 flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center mb-2 flex-shrink-0">
        <Edit3 className="h-4 w-4 mr-2 text-muted-foreground" />
        <span className="text-sm font-medium">편집</span>
      </div>
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          onContentChange();
        }}
        placeholder="
내용을 입력하세요...

#프로젝트 #중요

@내일 2시 팀 미팅 참석하기.
@1시간 코드 리뷰 완료하기.
@10시 양치질하기.
@2025-05-25 프로젝트 마감."
        className="w-full flex-1 resize-none border-0 focus:ring-0 focus:outline-none bg-transparent text-sm font-mono custom-scrollbar p-2"
      />
    </div>
  </div>
);

const PreviewPanel = ({
  content,
  isReadOnly = false,
  title,
  displayTags,
  displayReminders,
}: any) => (
  <div className="h-full overflow-y-auto custom-scrollbar">
    {isReadOnly && (
      <>
        {/* Title */}
        <div className="p-4 border-b border-border">
          <h1 className="text-lg font-medium text-foreground min-h-[2.5rem] flex items-center">
            {title || '제목 없음'}
          </h1>
        </div>

        {/* Tags and Reminders */}
        {(displayTags?.length > 0 || displayReminders?.length > 0) && (
          <div
            className={`border-b border-border bg-muted/30 transition-all duration-300 ease-in-out p-4`}
          >
            {displayTags?.length > 0 && (
              <div className={`mb-3`}>
                <div className="flex items-center mb-2">
                  <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm font-medium">태그</span>
                </div>
                <Carousel
                  opts={{
                    align: 'start',
                    loop: false,
                  }}
                  className="w-full"
                >
                  <CarouselContent className="-ml-0">
                    {displayTags.map((tag: any, index: number) => (
                      <CarouselItem key={index} className="basis-auto pl-1 pr-1">
                        <Badge variant="secondary">#{tag.text}</Badge>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              </div>
            )}

            {displayReminders?.length > 0 && (
              <div className={`mt-3`}>
                <div className="flex items-center mb-2">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm font-medium">리마인더</span>
                </div>
                <Carousel
                  opts={{
                    align: 'start',
                    loop: false,
                  }}
                  className="w-full"
                >
                  <CarouselContent className="-ml-0">
                    {displayReminders.map((reminder: any, index: number) => (
                      <CarouselItem key={index} className="basis-auto pl-1 pr-1">
                        <div className="flex-shrink-0 flex items-center gap-2 p-2 pr-4 bg-background rounded-lg border border-border min-w-fit">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <div className="flex-1 whitespace-nowrap">
                            <div className="font-medium text-sm">
                              {reminder.reminderText}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {reminder.parsedDate ? (
                                <span className="text-green-600 dark:text-green-400">
                                  {formatDate(reminder.parsedDate)}
                                </span>
                              ) : (
                                <span className="text-orange-600 dark:text-orange-400">
                                  시간 파싱 실패
                                </span>
                              )}
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
      </>
    )}

    {/* Content */}
    <div className="p-4">
      <Suspense fallback={<MarkdownPreviewLoader />}>
        <MarkdownPreview content={content} />
      </Suspense>
    </div>
  </div>
);
