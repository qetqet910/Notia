import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
  useRef,
  Suspense,
  lazy,
} from 'react';
import { useNoteParser } from '@/hooks/useNoteParser';
import { useToast } from '@/hooks/useToast';
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
import { MarkdownPreviewLoader } from '@/components/features/dashboard/MarkdownPreviewLoader';
import mermaid from 'mermaid';
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
  Loader2,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Note, EditorReminder } from '@/types';

const MarkdownPreview = lazy(() =>
  import('@/components/features/dashboard/MarkdownPreview').then((module) => ({
    default: module.MarkdownPreview,
  })),
);

interface EditorProps {
  note: Note;
  onSave: (note: Note) => void;
  onDeleteRequest: () => void;
  isEditing: boolean;
  onEnterEditMode: () => void;
  onCancelEdit: () => void;
}

interface EditorRef {
  save: () => void;
}

mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
});

const MermaidComponent = ({
  chart,
  isEditing,
}: {
  chart: string;
  isEditing: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (ref.current && chart && !isEditing) {
      // 이전 내용 초기화
      ref.current.innerHTML = '';

      try {
        const id = `mermaid-svg-${Math.random().toString(36).substring(2, 9)}`;

        // DOM에서 기존 mermaid 오류 SVG 제거
        const existingErrors = document.querySelectorAll('svg[id*="mermaid"]');
        existingErrors.forEach((svg) => {
          if (svg.textContent?.includes('Syntax error')) {
            svg.remove();
          }
        });

        mermaid
          .render(id, chart)
          .then(({ svg }) => {
            if (ref.current) {
              ref.current.innerHTML = svg;
            }
          })
          .catch((error) => {
            console.error('Mermaid render error:', error);

            // DOM에서 새로 생긴 오류 SVG 찾아서 이동
            setTimeout(() => {
              const errorSvg = document.querySelector('svg[id*="mermaid"]');
              if (errorSvg && errorSvg.textContent?.includes('Syntax error')) {
                if (ref.current) {
                  ref.current.appendChild(errorSvg.cloneNode(true));
                }
                errorSvg.remove();
              }
            }, 100);

            toast({
              title: 'Mermaid 렌더링 오류',
              description: '다이어그램 문법을 확인해주세요.',
            });
          });
      } catch (error) {
        console.error('Mermaid render error:', error);

        // DOM에서 오류 SVG 찾아서 이동
        setTimeout(() => {
          const errorSvg = document.querySelector('svg[id*="mermaid"]');
          if (errorSvg && errorSvg.textContent?.includes('Syntax error')) {
            if (ref.current) {
              ref.current.appendChild(errorSvg.cloneNode(true));
            }
            errorSvg.remove();
          }
        }, 100);

        toast({
          title: 'Mermaid 렌더링 오류',
          description: '다이어그램 문법을 확인해주세요.',
        });
      }
    }
  }, [chart, isEditing]);

  return <div ref={ref} className="mermaid-container" />;
};

export const Editor = forwardRef<EditorRef, EditorProps>(
  (
    { note, onSave, onDeleteRequest, isEditing, onEnterEditMode, onCancelEdit },
    ref,
  ) => {
    const [title, setTitle] = useState(note.title);
    const [content, setContent] = useState(note.content);
    const [isDirty, setIsDirty] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    const { tags: parsedTags, reminders: parsedReminders } =
      useNoteParser(content);

    useEffect(() => {
      setTitle(note.title);
      setContent(note.content);
      setIsDirty(false);
    }, [note]);

    const handleSave = useCallback(() => {
      const extractedTags = parsedTags.map((tag) => tag.text);
      const existingRemindersMap = new Map(
        (note.reminders || []).map((r: any) => [
          r.original_text || `@${r.text || r.reminder_text}.`,
          r,
        ]),
      );
      const finalReminders: EditorReminder[] = parsedReminders.map((parsed) => {
        const existing = existingRemindersMap.get(parsed.originalText);
        if (existing) {
          return {
            id: existing.id,
            text: parsed.reminderText!,
            date: existing.date,
            completed: existing.completed,
            original_text: parsed.originalText,
          };
        }
        return {
          id: '',
          text: parsed.reminderText!,
          date: parsed.parsedDate!,
          completed: false,
          original_text: parsed.originalText,
        };
      });

      const noteToSave: Note = {
        ...note,
        title,
        content,
        tags: extractedTags,
        reminders: finalReminders,
        updatedAt: new Date(),
      };

      onSave(noteToSave);
      setIsDirty(false);
      onCancelEdit();
      toast({
        title: '저장 완료',
        description: '노트가 성공적으로 저장되었습니다.',
      });
    }, [
      note,
      title,
      content,
      parsedTags,
      parsedReminders,
      onSave,
      onCancelEdit,
      toast,
    ]);

    useImperativeHandle(ref, () => ({ save: handleSave }), [handleSave]);

    const handleCancel = () => {
      setTitle(note.title);
      setContent(note.content);
      setIsDirty(false);
      onCancelEdit();
    };

    const navigateHandler = () => navigate('/dashboard/help?tab=shortcuts');

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

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-border">
          <div className="flex items-center">
            {isEditing ? (
              <h2 className="text-lg font-semibold pl-3">편집 중</h2>
            ) : (
              <h2 className="text-lg font-semibold">미리보기</h2>
            )}
            {/* 정보 아이콘 및 팝오버 */}
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
                  disabled={!isDirty}
                >
                  <Save className="h-4 w-4 mr-1" />
                  저장
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Title */}
        {isEditing ? (
          <div className="p-4 border-b border-border pl-6">
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setIsDirty(true);
              }}
              placeholder="제목을 입력하세요"
              className="text-lg font-medium"
            />
          </div>
        ) : (
          <div className="p-4 border-b border-border">
            <h1 className="text-lg font-medium text-foreground min-h-[2.5rem] flex items-center">
              {title || '제목 없음'}
            </h1>
          </div>
        )}

        {/* Tags and Reminders */}
        {(parsedTags.length > 0 || parsedReminders.length > 0) && (
          <div
            className={`border-b border-border bg-muted/30 transition-all duration-300 ease-in-out ${
              isEditing ? 'p-2' : 'p-4'
            }`}
          >
            {parsedTags.length > 0 && (
              <div className={`mb-3 ${isEditing ? 'pl-5' : ''}`}>
                <div className="flex items-center mb-2">
                  <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm font-medium">태그</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {parsedTags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      #{tag.text}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {parsedReminders.length > 0 && (
              <div className={`mt-3 ${isEditing ? 'pl-5' : ''}`}>
                <div className="flex items-center mb-2">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm font-medium">리마인더</span>
                </div>
                <div
                  className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 custom-scrollbar"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }}
                  onWheel={(e) => {
                    e.currentTarget.scrollBy({
                      left: e.deltaY > 0 ? 120 : -120,
                      behavior: 'smooth',
                    });
                  }}
                >
                  {parsedReminders.map((reminder, index) => (
                    <div
                      key={index}
                      className="flex-shrink-0 flex items-center gap-2 p-2 bg-background rounded-lg border border-border min-w-fit"
                    >
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
                      {reminder.parsedDate && (
                        <Badge
                          variant="outline"
                          className="text-xs whitespace-nowrap"
                        >
                          {reminder.text}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {isEditing ? (
            <ResizablePanelGroup direction="horizontal" className="h-full">
              <ResizablePanel defaultSize={50}>
                <div className="p-4 h-full flex flex-col">
                  <div className="flex items-center mb-2 flex-shrink-0">
                    <Edit3 className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm font-medium">편집</span>
                  </div>
                  <Textarea
                    value={content}
                    onChange={(e) => {
                      setContent(e.target.value);
                      // setIsDirty(true);
                    }}
                    placeholder="
          내용을 입력하세요...
        
          #프로젝트 #중요
        
          @내일 2시 팀 미팅 참석하기.
          @1시간 코드 리뷰 완료하기.
          @10시 양치질하기.
          @2025-05-25 프로젝트 마감."
                    className="w-full h-full flex-1 resize-none border-0 focus:ring-0 focus:outline-none bg-transparent text-sm font-mono custom-scrollbar px-2"
                    style={{ height: 'calc(100vh - 400px)' }}
                  />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={50}>
                <div className="h-full overflow-y-auto custom-scrollbar p-4 pr-2">
                  <div className="flex items-center mb-2">
                    <Eye className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm font-medium">미리보기</span>
                  </div>
                  <Suspense fallback={<MarkdownPreviewLoader />}>
                    <MarkdownPreview content={content} />
                  </Suspense>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <div className="p-4 h-full overflow-y-auto custom-scrollbar">
              <Suspense fallback={<MarkdownPreviewLoader />}>
                <MarkdownPreview content={content} />
              </Suspense>
            </div>
          )}
        </div>
      </div>
    );
  },
);
