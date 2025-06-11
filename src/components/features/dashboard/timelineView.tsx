import React, { useState, useMemo } from 'react';
import { FileText, Clock, Calendar, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TimelineView = ({ notes, reminders, onOpenNote }) => {
  const [filter, setFilter] = useState('all'); // all, notes, reminders
  const [sortBy, setSortBy] = useState('date'); // date, title

  // 노트와 리마인더를 통합하여 타임라인 데이터 생성
  const timelineData = useMemo(() => {
    const items = [];

    // 노트 추가
    notes.forEach((note) => {
      items.push({
        id: `note-${note.id}`,
        type: 'note',
        title: note.title,
        content: note.content,
        date: new Date(note.updated_at || note.created_at),
        tags: note.tags || [],
        noteId: note.id,
        originalData: note,
      });
    });

    // 리마인더 추가
    reminders.forEach((reminder) => {
      const relatedNote = notes.find((n) => n.id === reminder.note_id);
      items.push({
        id: `reminder-${reminder.id}`,
        type: 'reminder',
        title: reminder.reminder_text,
        content: reminder.original_text,
        date: new Date(reminder.reminder_time),
        completed: reminder.completed,
        enabled: reminder.enabled,
        noteId: reminder.note_id,
        noteTitle: relatedNote?.title || '알 수 없는 노트',
        originalData: reminder,
      });
    });

    // 필터링
    let filteredItems = items;
    if (filter === 'notes') {
      filteredItems = items.filter((item) => item.type === 'note');
    } else if (filter === 'reminders') {
      filteredItems = items.filter((item) => item.type === 'reminder');
    }

    // 정렬
    filteredItems.sort((a, b) => {
      if (sortBy === 'date') {
        return b.date - a.date; // 최신순
      } else {
        return a.title.localeCompare(b.title);
      }
    });

    return filteredItems;
  }, [notes, reminders, filter, sortBy]);

  // 날짜별로 그룹화
  const groupedData = useMemo(() => {
    const groups = {};

    timelineData.forEach((item) => {
      const dateKey = item.date.toISOString().split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });

    return Object.entries(groups).sort(([a], [b]) => new Date(b) - new Date(a));
  }, [timelineData]);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return '오늘';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '어제';
    } else {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderTimelineItem = (item) => {
    const isNote = item.type === 'note';

    return (
      <div
        key={item.id}
        className={`ml-6 pb-6 border-l-2 pl-4 relative ${
          isNote ? 'border-blue-200' : 'border-orange-200'
        }`}
        style={{
          borderLeftColor: isNote
            ? 'rgb(147 197 253)' // blue-200 equivalent
            : 'rgb(254 215 170)', // orange-200 equivalent
        }}
      >
        {/* 타임라인 점 */}
        <div
          className="absolute -left-2 w-4 h-4 rounded-full border-2 border-background"
          style={{
            backgroundColor: isNote ? 'rgb(59 130 246)' : 'rgb(249 115 22)', // blue-500, orange-500
          }}
        />

        {/* 시간 */}
        <div className="text-xs text-muted-foreground mb-2">
          {formatTime(item.date)}
        </div>

        {/* 콘텐츠 카드 */}
        <div
          className="p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md bg-card hover:bg-accent/50"
          onClick={() => onOpenNote(item.noteId)}
          style={{
            backgroundColor: isNote
              ? 'hsl(var(--card))'
              : item.completed
              ? 'hsl(var(--muted))'
              : 'hsl(var(--card))',
            borderColor: isNote
              ? 'rgb(147 197 253)'
              : item.completed
              ? 'hsl(var(--border))'
              : 'rgb(254 215 170)',
          }}
        >
          {/* 헤더 */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              {isNote ? (
                <FileText
                  className="w-4 h-4"
                  style={{ color: 'rgb(37 99 235)' }} // blue-600
                />
              ) : (
                <Clock
                  className="w-4 h-4"
                  style={{ color: 'rgb(234 88 12)' }} // orange-600
                />
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

          {/* 제목 */}
          <h4
            className={`font-medium mb-2 ${
              item.completed ? 'line-through text-muted-foreground' : ''
            }`}
          >
            {item.title}
          </h4>

          {/* 내용 미리보기 */}
          {item.content && (
            <p
              className={`text-sm text-muted-foreground line-clamp-2 mb-2 ${
                item.completed ? 'line-through' : ''
              }`}
            >
              {item.content.length > 100
                ? `${item.content.substring(0, 100)}...`
                : item.content}
            </p>
          )}

          {/* 태그 (노트인 경우) */}
          {isNote && item.tags.length > 0 && (
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

          {/* 연결된 노트 (리마인더인 경우) */}
          {!isNote && (
            <div className="text-xs text-muted-foreground">
              📝 {item.noteTitle}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 h-full overflow-y-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">타임라인</h2>

        <div className="flex items-center gap-4">
          {/* 필터 */}
          <Tabs value={filter} onValueChange={setFilter} className="w-auto">
            <TabsList>
              <TabsTrigger value="all">전체</TabsTrigger>
              <TabsTrigger value="notes">노트</TabsTrigger>
              <TabsTrigger value="reminders">리마인더</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* 정렬 */}
          {/* <Button
            variant="outline"
            size="sm"
            onClick={() => setSortBy(sortBy === 'date' ? 'title' : 'date')}
          >
            {sortBy === 'date' ? '📅 날짜순' : '📝 제목순'}
          </Button> */}
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4" style={{ color: 'rgb(37 99 235)' }} />
            <span
              className="text-sm font-medium"
              style={{ color: 'rgb(37 99 235)' }}
            >
              총 노트
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {notes.length}
          </div>
        </div>

        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4" style={{ color: 'rgb(234 88 12)' }} />
            <span
              className="text-sm font-medium"
              style={{ color: 'rgb(234 88 12)' }}
            >
              총 리마인더
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {reminders.length}
          </div>
        </div>

        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4" style={{ color: 'rgb(34 197 94)' }} />
            <span
              className="text-sm font-medium"
              style={{ color: 'rgb(34 197 94)' }}
            >
              완료된 리마인더
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {reminders.filter((r) => r.completed).length}
          </div>
        </div>
      </div>

      {/* 타임라인 */}
      <div className="space-y-8">
        {groupedData.length > 0 ? (
          groupedData.map(([dateStr, items]) => (
            <div key={dateStr}>
              {/* 날짜 헤더 */}
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-lg font-semibold">{formatDate(dateStr)}</h3>
                <div className="flex-1 h-px bg-border" />
                <Badge variant="outline">{items.length}개 항목</Badge>
              </div>

              {/* 해당 날짜의 아이템들 */}
              <div className="space-y-0">{items.map(renderTimelineItem)}</div>
            </div>
          ))
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
};

export default TimelineView;
