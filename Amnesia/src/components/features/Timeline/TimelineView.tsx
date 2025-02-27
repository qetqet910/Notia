import React, { useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isSameDay, addDays, startOfDay, endOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar, FileText, ArrowLeft, ArrowRight } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface Plan {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
}

interface TimelineViewProps {
  plans: Plan[];
  notes: Note[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ plans, notes }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day');
  
  const priorityColors = {
    low: 'bg-blue-100 text-blue-800 border-blue-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-red-100 text-red-800 border-red-200'
  };

  const getTimelineItems = () => {
    let startDate, endDate;
    
    if (timeRange === 'day') {
      startDate = startOfDay(currentDate);
      endDate = endOfDay(currentDate);
    } else if (timeRange === 'week') {
      startDate = startOfDay(currentDate);
      endDate = endOfDay(addDays(currentDate, 6));
    } else {
      startDate = startOfDay(currentDate);
      endDate = endOfDay(addDays(currentDate, 29));
    }
    
    const plansInRange = plans.filter(plan => 
      plan.startDate <= endDate && plan.endDate >= startDate
    );
    
    const notesInRange = notes.filter(note => 
      note.createdAt >= startDate && note.createdAt <= endDate
    );
    
    // Combine and sort items
    const timelineItems = [
      ...plansInRange.map(plan => ({
        type: 'plan' as const,
        id: plan.id,
        title: plan.title,
        description: plan.description,
        date: plan.startDate,
        tags: plan.tags,
        priority: plan.priority,
        completed: plan.completed
      })),
      ...notesInRange.map(note => ({
        type: 'note' as const,
        id: note.id,
        title: note.title,
        content: note.content,
        date: note.createdAt,
        tags: note.tags
      }))
    ].sort((a, b) => a.date.getTime() - b.date.getTime());
    
    return timelineItems;
  };
  
  const timelineItems = getTimelineItems();
  
  const handlePrevious = () => {
    if (timeRange === 'day') {
      setCurrentDate(prev => addDays(prev, -1));
    } else if (timeRange === 'week') {
      setCurrentDate(prev => addDays(prev, -7));
    } else {
      setCurrentDate(prev => addDays(prev, -30));
    }
  };
  
  const handleNext = () => {
    if (timeRange === 'day') {
      setCurrentDate(prev => addDays(prev, 1));
    } else if (timeRange === 'week') {
      setCurrentDate(prev => addDays(prev, 7));
    } else {
      setCurrentDate(prev => addDays(prev, 30));
    }
  };
  
  const getDateRangeText = () => {
    if (timeRange === 'day') {
      return format(currentDate, 'PPP', { locale: ko });
    } else if (timeRange === 'week') {
      const endDate = addDays(currentDate, 6);
      return `${format(currentDate, 'PPP', { locale: ko })} - ${format(endDate, 'PPP', { locale: ko })}`;
    } else {
      const endDate = addDays(currentDate, 29);
      return `${format(currentDate, 'PPP', { locale: ko })} - ${format(endDate, 'PPP', { locale: ko })}`;
    }
  };
  
  // Function to group items by date for better organization
  const groupItemsByDate = () => {
    const grouped: Record<string, typeof timelineItems> = {};
    
    timelineItems.forEach(item => {
      const dateKey = format(item.date, 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(item);
    });
    
    return Object.entries(grouped).map(([date, items]) => ({
      date: new Date(date),
      items
    }));
  };
  
  const groupedItems = groupItemsByDate();

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-4">
          <Button variant="outline" size="sm" onClick={handlePrevious}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            이전
          </Button>
          
          <h2 className="text-lg font-semibold">
            {getDateRangeText()}
          </h2>
          
          <Button variant="outline" size="sm" onClick={handleNext}>
            다음
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        
        <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as 'day' | 'week' | 'month')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="day">일간</TabsTrigger>
            <TabsTrigger value="week">주간</TabsTrigger>
            <TabsTrigger value="month">월간</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-6">
          {groupedItems.length > 0 ? (
            <div className="relative">
              {/* Timeline connector */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />
              
              <div className="space-y-8">
                {groupedItems.map(group => (
                  <div key={format(group.date, 'yyyy-MM-dd')} className="relative">
                    {/* Date marker */}
                    <div className="flex items-center mb-4 relative z-10">
                      <div className="h-8 w-8 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div className="ml-4 py-1 px-3 bg-muted rounded-md">
                        <h3 className="font-medium">{format(group.date, 'PPP', { locale: ko })}</h3>
                      </div>
                    </div>
                    
                    {/* Timeline items for this date */}
                    <div className="space-y-4 ml-12">
                      {group.items.map(item => (
                        <Card key={`${item.type}-${item.id}`} className="overflow-hidden relative">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                item.type === 'plan' 
                                  ? item.completed
                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                    : priorityColors[item.priority]
                                  : 'bg-purple-100 text-purple-800 border border-purple-200'
                              }`}>
                                {item.type === 'plan' ? (
                                  <Calendar className="h-4 w-4" />
                                ) : (
                                  <FileText className="h-4 w-4" />
                                )}
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <h4 className={`font-medium ${
                                    item.type === 'plan' && item.completed ? 'line-through text-muted-foreground' : ''
                                  }`}>
                                    {item.title}
                                  </h4>
                                  <Badge variant="outline" className="ml-2">
                                    {item.type === 'plan' ? '일정' : '노트'}
                                  </Badge>
                                </div>
                                
                                <div className="text-xs text-muted-foreground mt-1">
                                  {format(item.date, 'p', { locale: ko })}
                                </div>
                                
                                {item.type === 'plan' && item.description && (
                                  <p className="text-sm mt-2">{item.description}</p>
                                )}
                                
                                {item.type === 'note' && item.content && (
                                  <p className="text-sm mt-2 line-clamp-2">{item.content.replace(/<[^>]*>/g, '')}</p>
                                )}
                                
                                {item.tags?.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-3">
                                    {item.tags.map(tag => (
                                      <Badge key={tag} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
              <p>선택한 기간에 일정과 노트가 없습니다</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};