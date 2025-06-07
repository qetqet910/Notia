import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { Note, EditorReminder } from '@/types';

interface EditorProps {
  note: Note;
  onSave: (note: Note) => void;
  onDelete: (id: string) => void;
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

export const Editor: React.FC<EditorProps> = ({ note, onSave, onDelete }) => {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [isDirty, setIsDirty] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setIsDirty(false);
  }, [note]);

  const MermaidComponent = ({ chart }: { chart: string }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [rendered, setRendered] = useState(false);

    useEffect(() => {
      if (ref.current && !rendered) {
        const id = `mermaid-${Date.now()}-${Math.random()}`;
        ref.current.innerHTML = ''; // 기존 내용 초기화

        mermaid
          .render(id, chart)
          .then((result) => {
            if (ref.current) {
              ref.current.innerHTML = result.svg;
              setRendered(true);
            }
          })
          .catch((error) => {
            console.error('Mermaid render error:', error);
            if (ref.current) {
              ref.current.innerHTML = `<pre class="bg-red-100 p-2 rounded text-red-700">Mermaid 렌더링 오류: ${error.message}</pre>`;
            }
          });
      }
    }, [chart, rendered]);

    // chart가 변경되면 다시 렌더링
    useEffect(() => {
      setRendered(false);
    }, [chart]);
  };

  const parseTimeExpression = (timeText: string): Date | undefined => {
    const now = new Date();
    const timeStr = timeText.trim().toLowerCase();

    // 시간 단위 처리 (@1시간, @30분)
    const hoursMatch = timeStr.match(/(\d+)\s*시간/);
    if (hoursMatch) {
      const result = new Date(now);
      result.setHours(result.getHours() + parseInt(hoursMatch[1]));
      return result;
    }

    const minutesMatch = timeStr.match(/(\d+)\s*분/);
    if (minutesMatch) {
      const result = new Date(now);
      result.setMinutes(result.getMinutes() + parseInt(minutesMatch[1]));
      return result;
    }

    // 오전/오후가 명시된 경우 처리 (분 포함)
    const amPmMatch = timeStr.match(
      /(오전|오후)\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?/,
    );
    if (amPmMatch) {
      const isAm = amPmMatch[1] === '오전';
      let hour = parseInt(amPmMatch[2]);
      const minute = amPmMatch[3] ? parseInt(amPmMatch[3]) : 0;

      if (hour === 0 || hour === 24) {
        hour = 0;
      } else if (isAm) {
        if (hour === 12) hour = 0;
      } else {
        if (hour !== 12) hour += 12;
      }

      const result = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hour,
        minute,
        0,
        0,
      );

      if (hour === 0 || result <= now) {
        result.setDate(result.getDate() + 1);
      }

      return result;
    }

    // 한국어 날짜 처리 (오늘, 내일, 모레) - 분 포함
    if (timeStr.includes('오늘')) {
      const timeMatch = timeStr.match(
        /(오전|오후)?\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?/,
      );
      const result = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (timeMatch) {
        const amPm = timeMatch[1];
        let hour = parseInt(timeMatch[2]);
        const minute = timeMatch[3] ? parseInt(timeMatch[3]) : 0;

        if (hour === 0 || hour === 24) {
          hour = 0;
          result.setDate(result.getDate() + 1);
        } else if (amPm === '오전') {
          if (hour === 12) hour = 0;
        } else if (amPm === '오후') {
          if (hour !== 12) hour += 12;
        } else {
          if (hour >= 1 && hour <= 11) {
            const targetTime = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
              hour,
              minute,
              0,
              0,
            );
            if (targetTime <= now) {
              hour += 12;
            }
          }
        }

        result.setHours(hour, minute, 0, 0);
      } else {
        result.setHours(9, 0, 0, 0);
      }
      return result;
    }

    if (timeStr.includes('내일')) {
      const timeMatch = timeStr.match(
        /(오전|오후)?\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?/,
      );
      const result = new Date(now);
      result.setDate(result.getDate() + 1);

      if (timeMatch) {
        const amPm = timeMatch[1];
        let hour = parseInt(timeMatch[2]);
        const minute = timeMatch[3] ? parseInt(timeMatch[3]) : 0;

        if (hour === 0 || hour === 24) {
          hour = 0;
        } else if (amPm === '오전') {
          if (hour === 12) hour = 0;
        } else if (amPm === '오후') {
          if (hour !== 12) hour += 12;
        } else {
          if (hour >= 1 && hour <= 11) {
            hour += 12;
          }
        }

        result.setHours(hour, minute, 0, 0);
      } else {
        result.setHours(9, 0, 0, 0);
      }
      return result;
    }

    if (timeStr.includes('모레')) {
      const timeMatch = timeStr.match(
        /(오전|오후)?\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?/,
      );
      const result = new Date(now);
      result.setDate(result.getDate() + 2);

      if (timeMatch) {
        const amPm = timeMatch[1];
        let hour = parseInt(timeMatch[2]);
        const minute = timeMatch[3] ? parseInt(timeMatch[3]) : 0;

        if (hour === 0 || hour === 24) {
          hour = 0;
        } else if (amPm === '오전') {
          if (hour === 12) hour = 0;
        } else if (amPm === '오후') {
          if (hour !== 12) hour += 12;
        } else {
          if (hour >= 1 && hour <= 11) {
            hour += 12;
          }
        }

        result.setHours(hour, minute, 0, 0);
      } else {
        result.setHours(9, 0, 0, 0);
      }
      return result;
    }

    // 시간만 입력된 경우 (@1시, @13시, @01시, @1시 30분 등) - 분 포함
    const timeOnlyMatch = timeStr.match(
      /^(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?$/,
    );
    if (timeOnlyMatch) {
      const hourStr = timeOnlyMatch[1];
      let hour = parseInt(hourStr);
      const minute = timeOnlyMatch[2] ? parseInt(timeOnlyMatch[2]) : 0;

      if (hour === 0 || hour === 24) {
        hour = 0;
        const result = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 1,
          hour,
          minute,
          0,
          0,
        );
        return result;
      }

      if (
        hourStr.length === 2 &&
        hourStr.startsWith('0') &&
        hour >= 1 &&
        hour <= 9
      ) {
        // 01시 ~ 09시는 오전으로 해석
      } else if (hour >= 1 && hour <= 11) {
        const targetTime = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          hour,
          minute,
          0,
          0,
        );
        if (targetTime <= now) {
          hour += 12;
        }
      }

      const result = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hour,
        minute,
        0,
        0,
      );

      if (result <= now) {
        result.setDate(result.getDate() + 1);
      }

      return result;
    }

    // YYYY-MM-DD HH시 형식 - 분 포함
    const fullDateTimeMatch = timeStr.match(
      /(\d{4})-(\d{1,2})-(\d{1,2})\s*(오전|오후)?\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?/,
    );
    if (fullDateTimeMatch) {
      const year = parseInt(fullDateTimeMatch[1]);
      const month = parseInt(fullDateTimeMatch[2]) - 1;
      const day = parseInt(fullDateTimeMatch[3]);
      const amPm = fullDateTimeMatch[4];
      let hour = parseInt(fullDateTimeMatch[5]);
      const minute = fullDateTimeMatch[6] ? parseInt(fullDateTimeMatch[6]) : 0;

      if (hour === 0 || hour === 24) {
        hour = 0;
      } else if (amPm === '오전') {
        if (hour === 12) hour = 0;
      } else if (amPm === '오후') {
        if (hour !== 12) hour += 12;
      } else {
        if (hour >= 1 && hour <= 11) {
          hour += 12;
        }
      }

      return new Date(year, month, day, hour, minute, 0, 0);
    }

    // YYYY-MM-DD 형식 (시간 없음)
    const dateMatch = timeStr.match(/(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (dateMatch) {
      const year = parseInt(dateMatch[1]);
      const month = parseInt(dateMatch[2]) - 1;
      const day = parseInt(dateMatch[3]);

      return new Date(year, month, day, 9, 0, 0, 0);
    }

    // MM-DD 형식
    const shortDateMatch = timeStr.match(/^(\d{1,2})-(\d{1,2})$/);
    if (shortDateMatch) {
      const month = parseInt(shortDateMatch[1]) - 1;
      const day = parseInt(shortDateMatch[2]);

      return new Date(now.getFullYear(), month, day, 9, 0, 0, 0);
    }

    return undefined;
  };

  const parsedData = useMemo(() => {
    const tags: ParsedTag[] = [];
    const reminders: ParsedTag[] = [];

    // 해시태그 파싱
    const hashtagRegex = /#([^\s#@]+)/g;
    let match;
    while ((match = hashtagRegex.exec(content)) !== null) {
      tags.push({
        text: match[1],
        type: 'tag',
        originalText: match[0],
      });
    }

    // 리마인더 파싱 (@시간 내용.)
    const reminderRegex = /@([^@#\n]+?)\./g;
    while ((match = reminderRegex.exec(content)) !== null) {
      const fullText = match[1].trim();

      let timeText = '';
      let reminderText = '';

      const patterns = [
        /^(\d{4}-\d{1,2}-\d{1,2}(?:\s*(?:오전|오후)?\s*\d{1,2}\s*시(?:\s*\d{1,2}\s*분)?)?)/,
        /^((?:오전|오후)\s*\d{1,2}\s*시(?:\s*\d{1,2}\s*분)?)/,
        /^(내일\s*(?:오전|오후)?\s*\d{1,2}\s*시(?:\s*\d{1,2}\s*분)?)/,
        /^(오늘\s*(?:오전|오후)?\s*\d{1,2}\s*시(?:\s*\d{1,2}\s*분)?)/,
        /^(모레\s*(?:오전|오후)?\s*\d{1,2}\s*시(?:\s*\d{1,2}\s*분)?)/,
        /^(\d{1,2}\s*시간)/,
        /^(\d{1,2}\s*분)/,
        /^(\d{1,2}\s*시(?:\s*\d{1,2}\s*분)?)/,
        /^(\d{1,2}-\d{1,2})/,
      ];

      for (const pattern of patterns) {
        const timeMatch = fullText.match(pattern);
        if (timeMatch) {
          timeText = timeMatch[1];
          reminderText = fullText.substring(timeMatch[0].length).trim();
          break;
        }
      }

      if (reminderText) {
        const parsedDate = parseTimeExpression(timeText);
        reminders.push({
          text: timeText,
          type: 'reminder',
          originalText: match[0],
          parsedDate,
          reminderText,
        });
      }
    }

    return { tags, reminders };
  }, [content]);

  const handleSave = () => {
    const extractedTags = parsedData.tags.map((tag) => tag.text);

    const extractedReminders: EditorReminder[] = parsedData.reminders
      .filter((r) => r.parsedDate && r.reminderText)
      .map((r) => ({
        id: `${Date.now()}-${Math.random()}`,
        text: r.reminderText!,
        date: r.parsedDate!,
        completed: false,
        original_text: r.originalText,
      }));

    const updatedNote: Note = {
      ...note,
      title,
      content,
      tags: extractedTags,
      reminders: extractedReminders,
      updatedAt: new Date(),
    };

    onSave(updatedNote);
    setIsDirty(false);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTitle(note.title);
    setContent(note.content);
    setIsDirty(false);
    setIsEditing(false);
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
          <h2 className="text-lg font-semibold">
            {isEditing ? '편집 중' : '미리보기'}
          </h2>

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
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(note.id)}
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                삭제
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
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
      <div className="p-4 border-b border-border">
        {isEditing ? (
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setIsDirty(true);
            }}
            placeholder="제목을 입력하세요"
            className="text-lg font-medium"
          />
        ) : (
          <h1 className="text-lg font-medium text-foreground min-h-[2.5rem] flex items-center">
            {title || '제목 없음'}
          </h1>
        )}
      </div>

      {/* Tags and Reminders */}
      {(parsedData.tags.length > 0 || parsedData.reminders.length > 0) && (
        <div
          className={`border-b border-border bg-muted/30 transition-all duration-300 ease-in-out ${
            isEditing ? 'p-2' : 'p-4'
          }`}
        >
          {parsedData.tags.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center mb-2">
                <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm font-medium">태그</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {parsedData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    #{tag.text}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {parsedData.reminders.length > 0 && (
            <div>
              <div className="flex items-center mb-2">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm font-medium">리마인더</span>
              </div>
              <div className="space-y-2">
                {parsedData.reminders.map((reminder, index) => (
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
          <div className="absolute inset-0 flex">
            {/* Editor */}
            <div className="w-1/2 p-4 border-r border-border flex flex-col">
              <div className="flex items-center mb-2">
                <Edit3 className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm font-medium">편집</span>
              </div>
              <Textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="내용을 입력하세요...

#프로젝트 #중요

@내일 2시 팀 미팅 참석하기.
@1시간 코드 리뷰 완료하기.
@10시 양치질하기.
@2025-05-25 프로젝트 마감."
                className="w-full resize-none border-0 focus:ring-0 focus:outline-none bg-transparent text-sm font-mono overflow-y-auto"
                style={{ height: 'calc(100vh - 400px)' }}
              />
            </div>

            {/* Preview */}
            <div className="w-1/2 p-4">
              <div className="flex items-center mb-2">
                <Eye className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm font-medium">미리보기</span>
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert h-full overflow-y-auto">
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
                        return <MermaidComponent chart={String(children)} />;
                      }

                      return (
                        <code
                          className="bg-muted px-1 py-0.5 rounded text-sm font-mono"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    pre: ({ children, ...props }) => (
                      <pre
                        className="bg-muted p-3 rounded-lg overflow-x-auto mb-3"
                        {...props}
                      >
                        {children}
                      </pre>
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
                      <td className="border border-border px-3 py-2" {...props}>
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
          </div>
        ) : (
          <div className="p-4 h-full overflow-y-auto transition-all duration-300 ease-in-out">
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
                      return <MermaidComponent chart={String(children)} />;
                    }

                    return (
                      <code
                        className="bg-muted px-1 py-0.5 rounded text-sm font-mono"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children, ...props }) => (
                    <pre
                      className="bg-muted p-4 rounded-lg overflow-x-auto mb-4"
                      {...props}
                    >
                      {children}
                    </pre>
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
