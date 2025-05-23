import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Trash2, Save, Calendar, Tag } from 'lucide-react';
import { Note } from '@/types/index';

interface EditorProps {
  note: Note;
  onSave: (note: Note) => void;
  onDelete: (id: string) => void;
}

interface ParsedTag {
  text: string;
  type: 'tag' | 'reminder';
  originalText?: string;
  parsedDate?: Date;
}

export const Editor: React.FC<EditorProps> = ({ note, onSave, onDelete }) => {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [isDirty, setIsDirty] = useState(false);

  // Update state when note changes
  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setIsDirty(false);
  }, [note]);

  // Simple time parsing function
  const parseTimeExpression = (timeText: string): Date | undefined => {
    const now = new Date();

    // 오늘, 내일 등의 한국어 처리
    if (timeText.includes('오늘')) {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    if (timeText.includes('내일')) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }
    if (timeText.includes('모레')) {
      const dayAfterTomorrow = new Date(now);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      return dayAfterTomorrow;
    }

    // YYYY-MM-DD 형식 처리
    const dateMatch = timeText.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (dateMatch) {
      return new Date(
        parseInt(dateMatch[1]),
        parseInt(dateMatch[2]) - 1,
        parseInt(dateMatch[3]),
      );
    }

    // MM-DD 형식 처리 (현재 년도 기준)
    const shortDateMatch = timeText.match(/(\d{1,2})-(\d{1,2})/);
    if (shortDateMatch) {
      return new Date(
        now.getFullYear(),
        parseInt(shortDateMatch[1]) - 1,
        parseInt(shortDateMatch[2]),
      );
    }

    return undefined;
  };

  // Parse tags and reminders from content
  const parsedData = useMemo(() => {
    const tags: ParsedTag[] = [];
    const reminders: ParsedTag[] = [];

    // Parse hashtags (#태그)
    const hashtagRegex = /#([^\s#@]+)/g;
    let match;
    while ((match = hashtagRegex.exec(content)) !== null) {
      tags.push({
        text: match[1],
        type: 'tag',
        originalText: match[0],
      });
    }

    // Parse time mentions (@시간)
    const timeRegex = /@([^#@\n]+?)(?=\s|$|#|@)/g;
    while ((match = timeRegex.exec(content)) !== null) {
      const timeText = match[1].trim();
      const parsedDate = parseTimeExpression(timeText);

      reminders.push({
        text: timeText,
        type: 'reminder',
        originalText: match[0],
        parsedDate,
      });
    }

    return { tags, reminders };
  }, [content]);

  // Handle saving the note
  const handleSave = () => {
    const extractedTags = parsedData.tags.map((tag) => tag.text);

    const updatedNote = {
      ...note,
      title,
      content,
      tags: extractedTags,
      updatedAt: new Date(),
      reminders: parsedData.reminders
        .filter((r) => r.parsedDate)
        .map((r) => ({
          text: r.text,
          date: r.parsedDate!,
          completed: false,
        })),
    };
    onSave(updatedNote);
    setIsDirty(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-semibold">에디터</h2>
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

      {/* 감지된 태그 및 리마인더 미리보기 */}
      {(parsedData.tags.length > 0 || parsedData.reminders.length > 0) && (
        <div className="p-4 border-b bg-muted/30">
          {parsedData.tags.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center mb-2">
                <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm font-medium">감지된 태그</span>
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
                <span className="text-sm font-medium">감지된 리마인더</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {parsedData.reminders.map((reminder, index) => (
                  <Badge
                    key={index}
                    variant={reminder.parsedDate ? 'default' : 'outline'}
                    className={
                      reminder.parsedDate
                        ? 'text-green-700 bg-green-100'
                        : 'text-orange-700 bg-orange-100'
                    }
                  >
                    @{reminder.text}
                    {reminder.parsedDate && (
                      <span className="ml-1 text-xs">
                        ({reminder.parsedDate.toLocaleDateString()})
                      </span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="p-4 text-sm text-muted-foreground border-b">
        <p>
          <strong>사용법:</strong> #태그명 으로 태그 추가, @시간 으로 리마인더
          추가
        </p>
        <p>예시: #프로젝트 @내일 2시 회의, @2024-05-25 데드라인</p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <Textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setIsDirty(true);
          }}
          placeholder="내용을 입력하세요... 
          
#태그명 으로 태그를 추가하고
@내일 2시, @2024-05-25 와 같이 리마인더를 추가하세요"
          className="min-h-full border-0 focus-visible:ring-0 resize-none font-mono"
          rows={20}
        />
      </ScrollArea>
    </div>
  );
};
