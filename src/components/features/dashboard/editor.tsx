import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Trash2,
  Save,
  Calendar,
  Tag,
  Clock,
  CheckCircle,
  HelpCircle,
  Edit,
  Eye,
  X,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Mock types (실제 사용시 @/types에서 import)
interface EditorReminder {
  id: string;
  text: string;
  date: Date;
  completed: boolean;
  original_text: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  reminders: EditorReminder[];
  createdAt: Date;
  updatedAt: Date;
}

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

// Simple Markdown renderer
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const renderMarkdown = (text: string) => {
    return text
      .replace(
        /^### (.*$)/gim,
        '<h3 class="text-lg font-semibold mb-2 mt-4">$1</h3>',
      )
      .replace(
        /^## (.*$)/gim,
        '<h2 class="text-xl font-semibold mb-3 mt-4">$1</h2>',
      )
      .replace(
        /^# (.*$)/gim,
        '<h1 class="text-2xl font-bold mb-4 mt-4">$1</h1>',
      )
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(
        /`(.*?)`/g,
        '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>',
      )
      .replace(/^- (.*$)/gim, '<li class="ml-4">• $1</li>')
      .replace(/\n\n/g, '</p><p class="mb-2">')
      .replace(/\n/g, '<br />');
  };

  return (
    <div
      className="prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{
        __html: `<p class="mb-2">${renderMarkdown(content)}</p>`,
      }}
    />
  );
};

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

  const parseTimeExpression = useCallback(
    (timeText: string): Date | undefined => {
      const now = new Date();
      const timeStr = timeText.trim().toLowerCase();

      // 시간 단위 처리
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

      // 오전/오후 처리
      const amPmMatch = timeStr.match(
        /(오전|오후)\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?/,
      );
      if (amPmMatch) {
        const isAm = amPmMatch[1] === '오전';
        let hour = parseInt(amPmMatch[2]);
        const minute = amPmMatch[3] ? parseInt(amPmMatch[3]) : 0;

        if (hour === 0 || hour === 24) {
          hour = 0;
        } else if (isAm && hour === 12) {
          hour = 0;
        } else if (!isAm && hour !== 12) {
          hour += 12;
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

      // 한국어 날짜 처리
      if (
        timeStr.includes('오늘') ||
        timeStr.includes('내일') ||
        timeStr.includes('모레')
      ) {
        const timeMatch = timeStr.match(
          /(오전|오후)?\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?/,
        );
        const result = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );

        let dayOffset = 0;
        if (timeStr.includes('내일')) dayOffset = 1;
        if (timeStr.includes('모레')) dayOffset = 2;

        result.setDate(result.getDate() + dayOffset);

        if (timeMatch) {
          const amPm = timeMatch[1];
          let hour = parseInt(timeMatch[2]);
          const minute = timeMatch[3] ? parseInt(timeMatch[3]) : 0;

          if (hour === 0 || hour === 24) {
            hour = 0;
          } else if (amPm === '오전' && hour === 12) {
            hour = 0;
          } else if (amPm === '오후' && hour !== 12) {
            hour += 12;
          } else if (!amPm && hour >= 1 && hour <= 11) {
            hour += 12;
          }

          result.setHours(hour, minute, 0, 0);
        } else {
          result.setHours(9, 0, 0, 0);
        }
        return result;
      }

      // 시간만 입력
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
          // 01시-09시는 오전
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

      return undefined;
    },
    [],
  );

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

    // 리마인더 파싱
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
  }, [content, parseTimeExpression]);

  const handleSave = useCallback(() => {
    const extractedTags = parsedData.tags.map((tag) => tag.text);
    const extractedReminders: EditorReminder[] = parsedData.reminders
      .filter((r) => r.parsedDate && r.reminderText)
      .map((r) => ({
        id: `${Date.now()}-${Math.random()}`,
        text: r.reminderText!,
        date: r.parsedDate!,
        completed: false,
        original_text: r.text + ' ' + r.reminderText,
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
  }, [note, title, content, parsedData, onSave]);

  const formatDate = useCallback((date: Date): string => {
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
  }, []);

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  const cancelEdit = () => {
    setTitle(note.title);
    setContent(note.content);
    setIsDirty(false);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold">
            {isEditing ? '편집 모드' : '미리보기'}
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
                  <p>• **굵게**, *기울임*, `코드`</p>
                  <p>• # 제목, ## 소제목</p>
                </div>
                <h3 className="font-semibold mt-3">시간 형식</h3>
                <div className="space-y-1 text-xs">
                  <p>• @1시 → 현재 기준 자동 판단</p>
                  <p>• @01시 → 오전 1시</p>
                  <p>• @13시 30분 → 오후 1시 30분</p>
                  <p>• @오전 10시 → 오전 10시</p>
                  <p>• @내일 오후 3시 30분</p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={cancelEdit}>
                <X className="h-4 w-4 mr-1" />
                취소
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(note.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                삭제
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
          ) : (
            <Button variant="default" size="sm" onClick={toggleEditMode}>
              <Edit className="h-4 w-4 mr-1" />
              수정
            </Button>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="p-4 border-b">
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
          <h1 className="text-lg font-medium">{title || '제목 없음'}</h1>
        )}
      </div>

      {/* Tags and Reminders Preview */}
      {!isEditing &&
        (parsedData.tags.length > 0 || parsedData.reminders.length > 0) && (
          <div className="p-4 border-b bg-muted/30">
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
                      className="inline-flex mr-2 items-center gap-2 p-2 bg-background rounded-lg border"
                    >
                      <Clock className="h-4 w-4 text-blue-500" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {reminder.reminderText}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {reminder.parsedDate ? (
                            <span className="text-green-600">
                              {formatDate(reminder.parsedDate)}
                            </span>
                          ) : (
                            <span className="text-orange-600">
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
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isEditing ? 'grid grid-cols-2 gap-4' : ''
        }`}
      >
        {isEditing ? (
          <>
            {/* Edit Mode - Split View */}
            <div className="p-4 border-r">
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <Edit className="h-4 w-4 mr-1" />
                편집
              </h3>
              <textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="내용을 입력하세요...

#프로젝트 #중요

**굵은 텍스트**와 *기울임* 사용 가능
`코드 블록`도 지원

@내일 2시 팀 미팅 참석하기.
@1시간 코드 리뷰 완료하기.
@10시 양치질하기."
                className="w-full h-full resize-none border-0 focus:outline-none font-mono text-sm"
              />
            </div>
            <div className="p-4">
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <Eye className="h-4 w-4 mr-1" />
                미리보기
              </h3>
              <div className="h-full overflow-auto">
                <MarkdownRenderer content={content} />
              </div>
            </div>
          </>
        ) : (
          /* Preview Mode */
          <div className="p-4 overflow-auto">
            <MarkdownRenderer content={content} />

            {/* Saved Reminders */}
            {note.reminders && note.reminders.length > 0 && (
              <div className="mt-6 pt-4 border-t bg-muted/20 rounded p-4">
                <div className="flex items-center mb-2">
                  <CheckCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm font-medium">저장된 리마인더</span>
                </div>
                <div className="space-y-1">
                  {note.reminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="flex justify-between items-center text-xs"
                    >
                      <span
                        className={
                          reminder.completed
                            ? 'line-through text-muted-foreground'
                            : ''
                        }
                      >
                        {reminder.text}
                      </span>
                      <span className="text-muted-foreground">
                        {formatDate(reminder.date)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
