import React, { useState, useMemo, useCallback } from 'react';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Tag from 'lucide-react/dist/esm/icons/tag';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Note, Reminder } from '@/types';

// EnrichedReminder 타입을 정의하여 noteId와 noteTitle을 포함시킵니다.
type EnrichedReminder = Reminder & {
  noteId: string;
  noteTitle: string;
};

type TimelineItem = {
  id: string;
  type: 'note' | 'reminder';
  title: string;
  date: Date;
  noteId: string;
  originalData: Note | EnrichedReminder;
  content?: string;
  tags?: string[];
  completed?: boolean;
  noteTitle?: string;
};

interface TimelineViewProps {
  notes: Note[];
  // reminders prop을 추가합니다.
  reminders: EnrichedReminder[];
  onOpenNote: (noteId: string) => void;
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return '오늘';
  if (date.toDateString() === yesterday.toDateString()) return '어제';
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatTime = (date: Date) => {
  if (date && !isNaN(date.getTime())) {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return '시간 정보 없음';
};

const TimelineItemCard: React.FC<{
  item: TimelineItem;
  onOpenNote: (noteId: string) => void;
}> = React.memo(({ item, onOpenNote }) => {
  const isNote = item.type === 'note';
  return (
    <div
      key={item.id}
      className="ml-6 pb-6 border-l-2 pl-4 relative border-border/50"
    >
      <div
        className={`absolute -left-2 w-4 h-4 rounded-full border-2 border-background ${
          isNote ? 'bg-primary' : 'bg-orange-500'
        }`}
      />
      <div className="text-xs text-muted-foreground mb-2">
        {formatTime(item.date)}
      </div>
      <div
        className="p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md bg-card hover:bg-accent/50"
        onClick={() => onOpenNote(item.noteId)}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {isNote ? (
              <FileText className="w-4 h-4 text-primary-600" />
            ) : (
              <Clock className="w-4 h-4 text-orange-600" />
            )}
            <Badge
              variant={
                isNote
                  ? 'default'
                  : item.completed
                  ? 'secondary'
                  : 'destructive'
              }
            >
              {isNote
                ? '노트'
                : item.completed
                ? '완료된 리마인더'
                : '리마인더'}
            </Badge>
          </div>
        </div>
        <h4
          className={`font-medium mb-2 ${
            item.completed ? 'line-through text-muted-foreground' : ''
          }`}
        >
          {item.title}
        </h4>
        {item.content && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {item.content}
          </p>
        )}
        {isNote && item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {item.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </Badge>
            ))}
            {item.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{item.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
        {!isNote && (
          <div className="text-xs text-muted-foreground">
            📝 {item.noteTitle}
          </div>
        )}
      </div>
    </div>
  );
});
TimelineItemCard.displayName = 'TimelineItemCard';

export const TimelineView: React.FC<TimelineViewProps> = React.memo(
  ({ notes = [], reminders = [], onOpenNote }) => {
    const [filter, setFilter] = useState<'all' | 'notes' | 'reminders'>('all');
    const [collapsedDates, setCollapsedDates] = useState<Set<string>>(
      new Set(),
    );

    const toggleDateGroup = useCallback((dateStr: string) => {
      setCollapsedDates((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(dateStr)) {
          newSet.delete(dateStr);
        } else {
          newSet.add(dateStr);
        }
        return newSet;
      });
    }, []);

    const { timelineItems, totalReminders, completedReminders } =
      useMemo(() => {
        const items: TimelineItem[] = [];

        // notes prop으로 타임라인 아이템 생성
        notes.forEach((note) => {
          items.push({
            id: `note-${note.id}`,
            type: 'note',
            title: note.title,
            content: note.content?.replace(/<[^>]*>/g, ''),
            date: new Date(note.created_at),
            tags: note.tags || [],
            noteId: note.id,
            originalData: note,
          });
        });

        // reminders prop으로 타임라인 아이템 생성
        reminders.forEach((reminder) => {
          items.push({
            id: `reminder-${reminder.id}`,
            type: 'reminder',
            title: reminder.reminder_text,
            date: new Date(reminder.created_at),
            completed: reminder.completed,
            noteId: reminder.noteId,
            noteTitle: reminder.noteTitle,
            originalData: reminder,
          });
        });

        const filteredItems = items.filter((item) => {
          if (filter === 'notes') return item.type === 'note';
          if (filter === 'reminders') return item.type === 'reminder';
          return true;
        });

        filteredItems.sort((a, b) => b.date.getTime() - a.date.getTime());

        const completedCount = reminders.filter((r) => r.completed).length;

        return {
          timelineItems: filteredItems,
          totalReminders: reminders.length,
          completedReminders: completedCount,
        };
      }, [notes, reminders, filter]);

    const groupedData = useMemo(() => {
      const groups: Record<string, TimelineItem[]> = {};
      timelineItems.forEach((item) => {
        if (item.date && !isNaN(item.date.getTime())) {
          const dateKey = item.date.toISOString().split('T')[0];
          if (!groups[dateKey]) {
            groups[dateKey] = [];
          }
          groups[dateKey].push(item);
        }
      });
      return Object.entries(groups).sort(
        ([a], [b]) => new Date(b).getTime() - new Date(a).getTime(),
      );
    }, [timelineItems]);

    return (
      <div className="p-6 h-full overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">타임라인</h2>
          <Tabs
            value={filter}
            onValueChange={(value) =>
              setFilter(value as 'all' | 'notes' | 'reminders')
            }
            className="w-auto"
          >
            <TabsList>
              <TabsTrigger value="all">전체</TabsTrigger>
              <TabsTrigger value="notes">노트</TabsTrigger>
              <TabsTrigger value="reminders">리마인더</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 max-[470px]:p-3 rounded-lg border bg-card">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm max-[470px]:text-xs font-medium">
                총 노트
              </span>
            </div>
            <div className="text-2xl font-bold">{notes.length}</div>
          </div>
          <div className="p-4 max-[470px]:p-3 rounded-lg border bg-card">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="text-sm max-[470px]:text-xs font-medium">
                총 리마인더
              </span>
            </div>
            <div className="text-2xl font-bold">{totalReminders}</div>
          </div>
          <div className="p-4 max-[470px]:p-3 rounded-lg border bg-card">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
              <Calendar className="w-4 h-4 text-green-500" />
              <span className="text-sm max-[470px]:text-xs font-medium">
                완료된 리마인더
              </span>
            </div>
            <div className="text-2xl font-bold">{completedReminders}</div>
          </div>
        </div>

        <div className="space-y-8">
          {groupedData.length > 0 ? (
            groupedData.map(([dateStr, items]) => {
              const isCollapsed = collapsedDates.has(dateStr);
              return (
                <div key={dateStr}>
                  <div
                    className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
                    onClick={() => toggleDateGroup(dateStr)}
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                    <h3 className="text-lg font-semibold">
                      {formatDate(dateStr)}
                    </h3>
                    <div className="flex-1 h-px bg-border" />
                    <Badge variant="outline">{items.length}개 항목</Badge>
                  </div>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isCollapsed
                        ? 'max-h-0 opacity-0'
                        : 'max-h-[2000px] opacity-100'
                    }`}
                  >
                    <div className="pt-4">
                      {items.map((item) => (
                        <TimelineItemCard
                          key={item.id}
                          item={item}
                          onOpenNote={onOpenNote}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>표시할 항목이 없습니다.</p>
              <p className="text-sm">
                노트를 작성하거나 리마인더를 설정해보세요.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  },
);
TimelineView.displayName = 'TimelineView';
