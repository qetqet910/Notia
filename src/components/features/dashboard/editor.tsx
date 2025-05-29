import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Trash2,
  Save,
  Calendar,
  Tag,
  Clock,
  CheckCircle,
  HelpCircle,
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

export const Editor: React.FC<EditorProps> = ({ note, onSave, onDelete }) => {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setIsDirty(false);
  }, [note]);

  const parseTimeExpression = (timeText: string): Date | undefined => {
    const now = new Date();
    const timeStr = timeText.trim().toLowerCase();
    const currentHour = now.getHours();

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

      // 자정 처리 (0시, 00시, 24시)
      if (hour === 0 || hour === 24) {
        hour = 0;
      } else if (isAm) {
        // 오전: 12시는 0시로, 나머지는 그대로
        if (hour === 12) hour = 0;
      } else {
        // 오후: 12시는 그대로, 나머지는 +12
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

      // 자정이거나 이미 지난 시간이면 내일로
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

        // 자정 처리
        if (hour === 0 || hour === 24) {
          hour = 0;
          result.setDate(result.getDate() + 1); // 자정은 다음날
        } else if (amPm === '오전') {
          if (hour === 12) hour = 0;
        } else if (amPm === '오후') {
          if (hour !== 12) hour += 12;
        } else {
          // 오전/오후 명시 없음 - 현재 시간 기준으로 판단
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
            // 현재 시간보다 이전이면 오후로, 이후면 오전으로
            if (targetTime <= now) {
              hour += 12; // 오후
            }
            // else: 오전 그대로
          }
          // 12시, 13-23시는 그대로
        }

        result.setHours(hour, minute, 0, 0);
      } else {
        result.setHours(9, 0, 0, 0); // 기본값 9시
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

        // 자정 처리
        if (hour === 0 || hour === 24) {
          hour = 0;
        } else if (amPm === '오전') {
          if (hour === 12) hour = 0;
        } else if (amPm === '오후') {
          if (hour !== 12) hour += 12;
        } else {
          // 오전/오후 명시 없음 - 1-11시는 오후로 해석
          if (hour >= 1 && hour <= 11) {
            hour += 12;
          }
        }

        result.setHours(hour, minute, 0, 0);
      } else {
        result.setHours(9, 0, 0, 0); // 기본값 9시
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

        // 자정 처리
        if (hour === 0 || hour === 24) {
          hour = 0;
        } else if (amPm === '오전') {
          if (hour === 12) hour = 0;
        } else if (amPm === '오후') {
          if (hour !== 12) hour += 12;
        } else {
          // 오전/오후 명시 없음 - 1-11시는 오후로 해석
          if (hour >= 1 && hour <= 11) {
            hour += 12;
          }
        }

        result.setHours(hour, minute, 0, 0);
      } else {
        result.setHours(9, 0, 0, 0); // 기본값 9시
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

      // 자정 처리 (0시, 00시, 24시)
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

      // 01, 02, ... 09 형태는 오전으로 해석
      if (
        hourStr.length === 2 &&
        hourStr.startsWith('0') &&
        hour >= 1 &&
        hour <= 9
      ) {
        // 01시 ~ 09시는 오전으로 해석
        // hour는 그대로 사용 (1-9)
      } else if (hour >= 1 && hour <= 11) {
        // 1-11시는 현재 시간 기준으로 오전/오후 판단
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
          hour += 12; // 오후
        }
        // else: 오전 그대로
      }
      // 12시, 13-23시는 그대로 사용

      const result = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hour,
        minute,
        0,
        0,
      );

      // 현재 시간보다 이전이면 내일로 설정
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
      const month = parseInt(fullDateTimeMatch[2]) - 1; // 월은 0부터 시작
      const day = parseInt(fullDateTimeMatch[3]);
      const amPm = fullDateTimeMatch[4];
      let hour = parseInt(fullDateTimeMatch[5]);
      const minute = fullDateTimeMatch[6] ? parseInt(fullDateTimeMatch[6]) : 0;

      // 자정 처리
      if (hour === 0 || hour === 24) {
        hour = 0;
      } else if (amPm === '오전') {
        if (hour === 12) hour = 0;
      } else if (amPm === '오후') {
        if (hour !== 12) hour += 12;
      } else {
        // 오전/오후 명시 없음 - 1-11시는 오후로 해석
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
      const month = parseInt(dateMatch[2]) - 1; // 월은 0부터 시작
      const day = parseInt(dateMatch[3]);

      return new Date(year, month, day, 9, 0, 0, 0); // 기본값 9시
    }

    // MM-DD 형식
    const shortDateMatch = timeStr.match(/^(\d{1,2})-(\d{1,2})$/);
    if (shortDateMatch) {
      const month = parseInt(shortDateMatch[1]) - 1; // 월은 0부터 시작
      const day = parseInt(shortDateMatch[2]);

      return new Date(now.getFullYear(), month, day, 9, 0, 0, 0); // 기본값 9시
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

      // 시간 부분과 내용 부분 분리
      let timeText = '';
      let reminderText = '';

      // 패턴별로 시간 부분 추출 (우선순위 순서로 배치)
      const patterns = [
        /^(\d{4}-\d{1,2}-\d{1,2}(?:\s*(?:오전|오후)?\s*\d{1,2}\s*시(?:\s*\d{1,2}\s*분)?)?)/, // 날짜 형식 우선
        /^((?:오전|오후)\s*\d{1,2}\s*시(?:\s*\d{1,2}\s*분)?)/, // 오전/오후 명시 (분 포함)
        /^(내일\s*(?:오전|오후)?\s*\d{1,2}\s*시(?:\s*\d{1,2}\s*분)?)/,
        /^(오늘\s*(?:오전|오후)?\s*\d{1,2}\s*시(?:\s*\d{1,2}\s*분)?)/,
        /^(모레\s*(?:오전|오후)?\s*\d{1,2}\s*시(?:\s*\d{1,2}\s*분)?)/,
        /^(\d{1,2}\s*시간)/,
        /^(\d{1,2}\s*분)/,
        /^(\d{1,2}\s*시(?:\s*\d{1,2}\s*분)?)/, // 시간만 (분 포함)
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
        originalText: r.originalText,
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
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold">편집기</h2>

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
                <h3 className="font-semibold mt-3">예시</h3>
                <div className="space-y-1">
                  <p>• @내일 오후 3시 30분 회의 참석하기.</p>
                  <p>• @오전 6시 30분 기상하기.</p>
                  <p>• @10시 양치질하기.</p>
                  <p>• @00시 30분 보이는 건 확인하기.</p>
                  <p>• @2025-05-25 오후 2시 프로젝트 마감.</p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex gap-2">
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
            onClick={handleSave}
            disabled={!isDirty}
          >
            <Save className="h-4 w-4 mr-1" />
            저장
          </Button>
        </div>
      </div>

      <div className="p-4 border-b">
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

      {(parsedData.tags.length > 0 || parsedData.reminders.length > 0) && (
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

      <ScrollArea className="flex-1 p-4">
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
          className="min-h-full border-0 focus-visible:ring-0 resize-none font-mono"
          rows={20}
        />
        {note.reminders && note.reminders.length > 0 && (
          <div className="pt-4 pr-2 pl-2 border-t bg-muted/20">
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
      </ScrollArea>
    </div>
  );
};
