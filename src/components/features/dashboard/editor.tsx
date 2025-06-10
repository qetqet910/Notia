import React, { useState, useEffect, useMemo, useRef } from 'react';
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

export const Editor: React.FC<EditorProps> = ({
  note,
  onSave,
  onDelete,
  isEditing,
  setIsEditing,
}) => {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [isDirty, setIsDirty] = useState(false);
  const { tags, reminders } = useNoteParser(content);

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setIsDirty(false);
  }, [note]);

  const handleSave = () => {
    const extractedTags = tags.map((tag) => tag.text);
    const extractedReminders: EditorReminder[] = reminders
      .filter((r) => r.parsedDate && r.reminderText)
      .map((r) => ({
        id: `${note.id}-${r.originalText}`, // 더 예측 가능한 ID 생성
        text: r.reminderText!,
        date: r.parsedDate!,
        completed: false,
        original_text: r.originalText,
      }));

    onSave({
      ...note,
      title,
      content,
      tags: extractedTags,
      reminders: extractedReminders,
      updatedAt: new Date(),
    });
    setIsDirty(false);
    setIsEditing(false); // 부모의 상태 변경
  };

  const handleCancel = () => {
    setTitle(note.title);
    setContent(note.content);
    setIsDirty(false);
    setIsEditing(false); // 부모의 상태 변경
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
                  <p>• @1시 → 현재 시간 기준 오전/오후 자동 판단</p>
                  <p>• @01시 → 오전 1시 (01:00)</p>
                  <p>• @13시 30분 → 오후 1시 30분 (13:30)</p>
                  <p>• @오전 10시 → 오전 10시 (10:00)</p>
                  <p>• @오후 3시 30분 → 오후 3시 30분 (15:30)</p>
                  <p>• @00시, @0시, @24시 → 자정 (00:00)</p>
                  <p>• @2025-05-25 → 해당 날짜 09:00</p>
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
                    <AlertDialogAction
                      onClick={() => onDelete(note.id)}
                      className="bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
                    >
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
            <div className={`mb-3 ${isEditing ? 'pl-5' : ''}`}>
              <div className="flex items-center mb-2">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm font-medium">리마인더</span>
              </div>
              <div className="space-y-2">
                {reminders.map((reminder, index) => (
                  <div
                    key={index}
                    className="inline-flex mr-2 items-center gap-2 p-2 bg-background rounded-lg border border-border"
                  >
                    <Clock className="h-4 w-4 text-blue-500" />
                    <div className="flex-1">
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
                      <Badge variant="outline" className="text-xs">
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
};
