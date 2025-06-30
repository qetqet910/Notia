import React, { useState, useMemo } from 'react';
import {
  FileText,
  Clock,
  Calendar,
  Tag,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Note, EditorReminder } from '@/types'; // 타입 임포트

// TimelineView Props 타입 정의
interface TimelineViewProps {
  notes: Note[];
  onOpenNote: (noteId: string) => void;
}

// 타임라인에 표시될 아이템의 통합 타입 정의
type TimelineItem = {
  id: string;
  type: 'note' | 'reminder';
  title: string;
  date: Date;
  noteId: string;
  originalData: Note | EditorReminder;
  // Note-specific fields
  content?: string;
  tags?: string[];
  // Reminder-specific fields
  completed?: boolean;
  noteTitle?: string;
};

export const TimelineView: React.FC<TimelineViewProps> = ({ notes, onOpenNote }) => {
  const [filter, setFilter] = useState<'all' | 'notes' | 'reminders'>('all');
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());

  const toggleDateGroup = (dateStr: string) => {
    setCollapsedDates((prev) => {
      const newSet = new Set(prev);
      newSet.has(dateStr) ? newSet.delete(dateStr) : newSet.add(dateStr);
      return newSet;
    });
  };

  // --- 데이터 가공 및 통계 최적화 ---
  const { timelineItems, totalReminders, completedReminders } = useMemo(() => {
    const items: TimelineItem[] = [];
    let reminderCount = 0;
    let completedCount = 0;

    // notes 배열을 한 번만 순회하여 note와 reminder 아이템을 모두 생성
    notes.forEach((note) => {
      // 1. 노트 아이템 추가
      items.push({
        id: `note-${note.id}`,
        type: 'note',
        title: note.title,
        content: note.content?.replace(/<[^>]*>/g, ''), // HTML 태그 제거
        date: new Date(note.updated_at), // 노트는 마지막 활동(수정) 시간을 기준
        tags: note.tags || [],
        noteId: note.id,
        originalData: note,
      });

      // 2. 해당 노트의 리마인더 아이템들 추가
      (note.reminders || []).forEach((reminder) => {
        items.push({
          id: `reminder-${reminder.id}`,
          type: 'reminder',
          title: reminder.text,
          date: reminder.date, // 리마인더는 '알림 설정 시간'을 기준
          completed: reminder.completed,
          noteId: note.id,
          noteTitle: note.title,
          originalData: reminder,
        });
        reminderCount++;
        if (reminder.completed) {
          completedCount++;
        }
      });
    });

    // 필터링
    const filteredItems = items.filter(item => {
        if (filter === 'notes') return item.type === 'note';
        if (filter === 'reminders') return item.type === 'reminder';
        return true;
    });

    // 정렬 (최신순)
    filteredItems.sort((a, b) => b.date.getTime() - a.date.getTime());

    return {
      timelineItems: filteredItems,
      totalReminders: reminderCount,
      completedReminders: completedCount,
    };
  }, [notes, filter]);

  // 날짜별 그룹화
  const groupedData = useMemo(() => {
    const groups: Record<string, TimelineItem[]> = {};

    timelineItems.forEach((item) => {
      const dateKey = item.date.toISOString().split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });

    return Object.entries(groups).sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime());
  }, [timelineItems]);


  // --- 렌더링 함수 ---
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return '오늘';
    if (date.toDateString() === yesterday.toDateString()) return '어제';
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  const renderTimelineItem = (item: TimelineItem) => {
    const isNote = item.type === 'note';

    return (
      <div key={item.id} className="ml-6 pb-6 border-l-2 pl-4 relative border-border/50">
        <div className={`absolute -left-2 w-4 h-4 rounded-full border-2 border-background ${isNote ? 'bg-primary' : 'bg-orange-500'}`}/>
        <div className="text-xs text-muted-foreground mb-2">{formatTime(item.date)}</div>
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
              <Badge variant={isNote ? 'default' : item.completed ? 'secondary' : 'destructive'}>
                {isNote ? '노트' : item.completed ? '완료된 리마인더' : '리마인더'}
              </Badge>
            </div>
          </div>
          <h4 className={`font-medium mb-2 ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
            {item.title}
          </h4>
          {item.content && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{item.content}</p>
          )}
          {isNote && item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {item.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  <Tag className="w-3 h-3 mr-1" />{tag}
                </Badge>
              ))}
              {item.tags.length > 3 && <Badge variant="outline" className="text-xs">+{item.tags.length - 3}</Badge>}
            </div>
          )}
          {!isNote && (
            <div className="text-xs text-muted-foreground">📝 {item.noteTitle}</div>
          )}
        </div>
      </div>
    );
  };


  return (
    <div className="p-6 h-full overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">타임라인</h2>
        <Tabs value={filter} onValueChange={setFilter} className="w-auto">
          <TabsList>
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="notes">노트</TabsTrigger>
            <TabsTrigger value="reminders">리마인더</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg border bg-card"><div className="flex items-center gap-2 mb-1"><FileText className="w-4 h-4 text-primary" /><span className="text-sm font-medium">총 노트</span></div><div className="text-2xl font-bold">{notes.length}</div></div>
        <div className="p-4 rounded-lg border bg-card"><div className="flex items-center gap-2 mb-1"><Clock className="w-4 h-4 text-orange-500" /><span className="text-sm font-medium">총 리마인더</span></div><div className="text-2xl font-bold">{totalReminders}</div></div>
        <div className="p-4 rounded-lg border bg-card"><div className="flex items-center gap-2 mb-1"><Calendar className="w-4 h-4 text-green-500" /><span className="text-sm font-medium">완료된 리마인더</span></div><div className="text-2xl font-bold">{completedReminders}</div></div>
      </div>

      <div className="space-y-8">
        {groupedData.length > 0 ? (
          groupedData.map(([dateStr, items]) => {
            const isCollapsed = collapsedDates.has(dateStr);
            return (
              <div key={dateStr}>
                <div className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors" onClick={() => toggleDateGroup(dateStr)}>
                  {isCollapsed ? <ChevronRight className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  <h3 className="text-lg font-semibold">{formatDate(dateStr)}</h3>
                  <div className="flex-1 h-px bg-border" />
                  <Badge variant="outline">{items.length}개 항목</Badge>
                </div>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'}`}>
                  <div className="pt-4">{items.map(renderTimelineItem)}</div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>표시할 항목이 없습니다.</p>
            <p className="text-sm">노트를 작성하거나 리마인더를 설정해보세요.</p>
          </div>
        )}
      </div>
    </div>
  );
};