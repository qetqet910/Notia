import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { supabase } from '@/services/supabaseClient';
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
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
import {
  Trash2,
  Save,
  Calendar,
  Tag,
  Clock,
  CheckCircle,
  HelpCircle,
  Edit3,
  Eye,
  X,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Note, EditorReminder } from '@/types';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface EditorProps {
  note: Note;
  onSave: (note: Note) => void;
  onDelete: (id: string) => void;
  isEditing: boolean; // ⭐️ 부모로부터 상태를 받음
  setIsEditing: (isEditing: boolean) => void; // ⭐️ 부모의 상태를 제어
}

interface ParsedTag {
  text: string;
  type: 'tag' | 'reminder';
  originalText: string;
  parsedDate?: Date;
  reminderText?: string;
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

export const Editor: React.FC<EditorProps> = forwardRef<EditorRef, EditorProps>(
  (props, ref) => {
    const { note, onSave, onDelete, isEditing, setIsEditing } = props;
    const [title, setTitle] = useState(note.title);
    const [content, setContent] = useState(note.content);
    const [isDirty, setIsDirty] = useState(false);
    const { tags, reminders: parsedReminders } = useNoteParser(content);
    const navigate = useNavigate();

    useEffect(() => {
      setTitle(note.title);
      setContent(note.content);
      setIsDirty(false);
    }, [note]);

    const reminders = useMemo(() => {
      if (!note.reminders?.length) return parsedReminders;

      const existingByText = new Map(note.reminders.map((r) => [r.text, r]));

      return parsedReminders.map((parsed) => {
        const existing = existingByText.get(parsed.reminderText);
        if (existing) {
          return {
            ...parsed,
            parsedDate: existing.date, // 기존 날짜 유지
          };
        }
        return parsed;
      });
    }, [content, note.reminders]);

    const handleSave = async () => {
      console.clear();
      console.log('--- [ handleSave 시작 ] ---');

      try {
        // ✅ 최신 노트 데이터를 DB에서 직접 가져오기
        const { data: freshNoteData, error } = await supabase
          .from('notes')
          .select(
            `
        *,
        reminders (
          id,
          reminder_text,
          reminder_time,
          completed,
          enabled,
          created_at,
          updated_at
        )
      `,
          )
          .eq('id', note.id)
          .single();

        if (error) throw error;

        // ✅ 최신 리마인더 데이터 포맷팅
        const freshReminders =
          freshNoteData.reminders?.map((reminder: any) => ({
            id: reminder.id,
            text: reminder.reminder_text,
            date: new Date(reminder.reminder_time),
            completed: reminder.completed,
            original_text: `@${reminder.reminder_text}.`, // 추정값 - 실제 저장된 형식 확인 필요
          })) || [];

        console.log(
          '[핸들세이브-최신] 최신 리마인더 데이터:',
          JSON.stringify(freshReminders, null, 2),
        );

        const extractedTags = tags.map((tag) => tag.text);
        const currentParsedReminders = reminders
          .filter((r) => r.parsedDate && r.reminderText)
          .map((r) => ({
            id: '',
            note_id: note.id,
            text: r.reminderText!,
            date: r.parsedDate!,
            completed: false,
            original_text: r.originalText,
          }));

        // ✅ 최신 리마인더로 매칭
        const existingByText = new Map(freshReminders.map((r) => [r.text, r]));

        const finalReminders = currentParsedReminders.map((currentReminder) => {
          const existingReminder = existingByText.get(currentReminder.text);
          console.log(`매칭 시도: "${currentReminder.text}"`);

          if (existingReminder) {
            console.log(
              `✅ 최신 데이터에서 매칭! completed: ${existingReminder.completed}`,
            );
            return {
              ...currentReminder,
              id: existingReminder.id,
              completed: existingReminder.completed,
              date: existingReminder.date, // ⚠️ 기존 날짜 유지
            };
          } else {
            console.log('❌ 새 리마인더');
            return currentReminder; // 새 리마인더만 새 날짜 사용
          }
        });

        console.log(
          '최종 결과:',
          finalReminders.map((r) => ({ text: r.text, completed: r.completed })),
        );

        onSave({
          ...note,
          title,
          content,
          tags: extractedTags,
          reminders: finalReminders,
          updatedAt: new Date(),
        });

        setIsDirty(false);
        setIsEditing(false);
      } catch (err) {
        console.error('최신 데이터 가져오기 실패:', err);
      }
    };

    useImperativeHandle(
      ref,
      () => ({
        save: handleSave,
      }),
      [handleSave],
    );

    const handleCancel = () => {
      setTitle(note.title);
      setContent(note.content);
      setIsDirty(false);
      setIsEditing(false); // 부모의 상태 변경
    };

    const navigateHandler = () => {
      navigate('/dashboard/help?tab=shortcuts');
    };

    const formatDate = (date: Date): string => {
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const isTomorrow =
        date.toDateString() ===
        new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();

      const timeString = `${date.getHours().toString().padStart(2, '0')}:${date
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;

      if (isToday) {
        return `오늘 ${timeString}`;
      } else if (isTomorrow) {
        return `내일 ${timeString}`;
      } else {
        return `${date.getMonth() + 1}/${date.getDate()} ${timeString}`;
      }
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
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4 mr-1" /> 삭제
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        정말로 삭제하시겠습니까?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        이 작업은 되돌릴 수 없습니다. 노트가 영구적으로
                        삭제됩니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(note.id)}>
                        삭제
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
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
                  disabled={!isDirty}
                >
                  <Save className="h-4 w-4 mr-1" /> 저장
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
        {(tags.length > 0 || reminders.length > 0) && (
          <div
            className={`border-b border-border bg-muted/30 transition-all duration-300 ease-in-out ${
              isEditing ? 'p-2' : 'p-4'
            }`}
          >
            {tags.length > 0 && (
              <div className={`mb-3 ${isEditing ? 'pl-5' : ''}`}>
                <div className="flex items-center mb-2">
                  <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm font-medium">태그</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      #{tag.text}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {reminders.length > 0 && (
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
                  {reminders.map((reminder, index) => (
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
                      setIsDirty(true);
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
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children, ...props }) => (
                          <h1 className="text-xl font-bold mb-4" {...props}>
                            {children}
                          </h1>
                        ),
                        h2: ({ children, ...props }) => (
                          <h2 className="text-lg font-semibold mb-3" {...props}>
                            {children}
                          </h2>
                        ),
                        h3: ({ children, ...props }) => (
                          <h3 className="text-base font-medium mb-2" {...props}>
                            {children}
                          </h3>
                        ),
                        p: ({ children, ...props }) => (
                          <p className="mb-3 leading-relaxed" {...props}>
                            {children}
                          </p>
                        ),
                        ul: ({ children, ...props }) => (
                          <ul
                            className="list-disc list-inside mb-3 space-y-1"
                            {...props}
                          >
                            {children}
                          </ul>
                        ),
                        ol: ({ children, ...props }) => (
                          <ol
                            className="list-decimal list-inside mb-3 space-y-1"
                            {...props}
                          >
                            {children}
                          </ol>
                        ),
                        li: ({ children, ...props }) => (
                          <li className="leading-relaxed" {...props}>
                            {children}
                          </li>
                        ),
                        blockquote: ({ children, ...props }) => (
                          <blockquote
                            className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-3"
                            {...props}
                          >
                            {children}
                          </blockquote>
                        ),
                        code: ({ className, children, ...props }: any) => {
                          const match = /language-(\w+)/.exec(className || '');
                          const language = match ? match[1] : '';
                          const isInline = !match;

                          if (!isInline && language === 'mermaid') {
                            return (
                              <MermaidComponent
                                chart={String(children)}
                                isEditing={isEditing}
                              />
                            );
                          }

                          // 인라인 코드
                          if (isInline) {
                            return (
                              <code
                                className="bg-muted px-1 py-0.5 rounded text-sm font-mono"
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          }

                          // 코드 블록
                          return (
                            <SyntaxHighlighter
                              language={language || 'text'}
                              style={oneDark}
                              customStyle={{
                                borderRadius: '8px',
                                fontSize: '14px',
                                marginBottom: '1rem',
                              }}
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          );
                        },
                        pre: ({ children, ...props }) => (
                          <pre {...props}>{children}</pre>
                        ),
                        table: ({ children, ...props }) => (
                          <table
                            className="border-collapse border border-border mb-3 w-full"
                            {...props}
                          >
                            {children}
                          </table>
                        ),
                        th: ({ children, ...props }) => (
                          <th
                            className="border border-border px-3 py-2 bg-muted font-semibold text-left"
                            {...props}
                          >
                            {children}
                          </th>
                        ),
                        td: ({ children, ...props }) => (
                          <td
                            className="border border-border px-3 py-2"
                            {...props}
                          >
                            {children}
                          </td>
                        ),
                        a: ({ children, ...props }) => (
                          <a
                            className="text-primary hover:underline"
                            {...props}
                          >
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {content || '*내용이 없습니다.*'}
                    </ReactMarkdown>
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <div className="p-4 h-full overflow-y-auto custom-scrollbar">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children, ...props }) => (
                      <h1 className="text-2xl font-bold mb-4" {...props}>
                        {children}
                      </h1>
                    ),
                    h2: ({ children, ...props }) => (
                      <h2 className="text-xl font-semibold mb-3" {...props}>
                        {children}
                      </h2>
                    ),
                    h3: ({ children, ...props }) => (
                      <h3 className="text-lg font-medium mb-2" {...props}>
                        {children}
                      </h3>
                    ),
                    p: ({ children, ...props }) => (
                      <p className="mb-4 leading-relaxed" {...props}>
                        {children}
                      </p>
                    ),
                    ul: ({ children, ...props }) => (
                      <ul
                        className="list-disc list-inside mb-4 space-y-2"
                        {...props}
                      >
                        {children}
                      </ul>
                    ),
                    ol: ({ children, ...props }) => (
                      <ol
                        className="list-decimal list-inside mb-4 space-y-2"
                        {...props}
                      >
                        {children}
                      </ol>
                    ),
                    li: ({ children, ...props }) => (
                      <li className="leading-relaxed" {...props}>
                        {children}
                      </li>
                    ),
                    blockquote: ({ children, ...props }) => (
                      <blockquote
                        className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-4 bg-muted/30 py-2 rounded-r-lg"
                        {...props}
                      >
                        {children}
                      </blockquote>
                    ),
                    code: ({ className, children, ...props }: any) => {
                      const match = /language-(\w+)/.exec(className || '');
                      const language = match ? match[1] : '';
                      const isInline = !match;

                      if (!isInline && language === 'mermaid') {
                        return (
                          <MermaidComponent
                            chart={String(children)}
                            isEditing={isEditing}
                          />
                        );
                      }

                      // 인라인 코드
                      if (isInline) {
                        return (
                          <code
                            className="bg-muted px-1 py-0.5 rounded text-sm font-mono"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      }

                      // 코드 블록
                      return (
                        <SyntaxHighlighter
                          language={language || 'text'}
                          style={oneDark}
                          customStyle={{
                            borderRadius: '8px',
                            fontSize: '14px',
                            marginBottom: '1rem',
                          }}
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      );
                    },
                    pre: ({ children, ...props }) => (
                      <pre {...props}>{children}</pre>
                    ),
                    table: ({ children, ...props }) => (
                      <table
                        className="border-collapse border border-border mb-4 w-full"
                        {...props}
                      >
                        {children}
                      </table>
                    ),
                    th: ({ children, ...props }) => (
                      <th
                        className="border border-border px-4 py-3 bg-muted font-semibold text-left"
                        {...props}
                      >
                        {children}
                      </th>
                    ),
                    td: ({ children, ...props }) => (
                      <td className="border border-border px-4 py-3" {...props}>
                        {children}
                      </td>
                    ),
                    a: ({ children, ...props }) => (
                      <a className="text-primary hover:underline" {...props}>
                        {children}
                      </a>
                    ),
                  }}
                >
                  {content || '*내용이 없습니다.*'}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
);
