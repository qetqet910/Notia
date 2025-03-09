import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, File, Clock, Tag, Calendar } from 'lucide-react';

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

interface SearchResult {
  notes: Note[];
  plans: Plan[];
  tags: string[];
}

interface SearchProps {
  onSearch: (query: string) => void;
  results: SearchResult;
  onSelectNote: (note: Note) => void;
  onSelectPlan?: (plan: Plan) => void;
}

export const Search: React.FC<SearchProps> = ({ onSearch, results, onSelectNote, onSelectPlan }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Perform search when query changes
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (searchQuery.trim()) {
        onSearch(searchQuery);
      }
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, onSearch]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Format date to readable string
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Highlight matching text
  const highlightMatch = (text: string) => {
    if (!searchQuery.trim()) return text;
    
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  };

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center space-x-2 mb-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="검색어를 입력하세요..."
            value={searchQuery}
            onChange={handleSearchChange}
            autoFocus
          />
        </div>
      </div>

      {searchQuery.trim() ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="mb-4">
            <TabsTrigger value="all">전체 ({results.notes.length + results.plans.length})</TabsTrigger>
            <TabsTrigger value="notes">노트 ({results.notes.length})</TabsTrigger>
            <TabsTrigger value="plans">일정 ({results.plans.length})</TabsTrigger>
            <TabsTrigger value="tags">태그 ({results.tags.length})</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <TabsContent value="all" className="m-0">
              {results.notes.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-2 text-muted-foreground">노트</h3>
                  {results.notes.slice(0, 3).map(note => (
                    <Card key={note.id} className="mb-2 cursor-pointer hover:bg-accent/50" onClick={() => onSelectNote(note)}>
                      <CardContent className="p-3">
                        <div className="flex items-center">
                          <File className="h-4 w-4 mr-2 text-muted-foreground" />
                          <div className="flex-1">
                            <h4 className="text-sm font-medium" dangerouslySetInnerHTML={{ __html: highlightMatch(note.title) }} />
                            <p className="text-xs text-muted-foreground truncate" dangerouslySetInnerHTML={{ __html: highlightMatch(note.content.substring(0, 100)) }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{formatDate(note.updatedAt)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {results.notes.length > 3 && (
                    <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setActiveTab('notes')}>
                      더 보기
                    </Button>
                  )}
                </div>
              )}

              {results.plans.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2 text-muted-foreground">일정</h3>
                  {results.plans.slice(0, 3).map(plan => (
                    <Card key={plan.id} className="mb-2 cursor-pointer hover:bg-accent/50" onClick={() => onSelectPlan && onSelectPlan(plan)}>
                      <CardContent className="p-3">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                          <div className="flex-1">
                            <h4 className="text-sm font-medium" dangerouslySetInnerHTML={{ __html: highlightMatch(plan.title) }} />
                            <p className="text-xs text-muted-foreground truncate" dangerouslySetInnerHTML={{ __html: highlightMatch(plan.description.substring(0, 100)) }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{formatDate(plan.startDate)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {results.plans.length > 3 && (
                    <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setActiveTab('plans')}>
                      더 보기
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="notes" className="m-0">
              <div className="space-y-2">
                {results.notes.map(note => (
                  <Card key={note.id} className="cursor-pointer hover:bg-accent/50" onClick={() => onSelectNote(note)}>
                    <CardContent className="p-3">
                      <div className="flex items-center">
                        <File className="h-4 w-4 mr-2 text-muted-foreground" />
                        <div className="flex-1">
                          <h4 className="text-sm font-medium" dangerouslySetInnerHTML={{ __html: highlightMatch(note.title) }} />
                          <p className="text-xs text-muted-foreground truncate" dangerouslySetInnerHTML={{ __html: highlightMatch(note.content.substring(0, 100)) }} />
                          {note.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {note.tags.map(tag => (
                                <span key={tag} className="text-xs bg-accent/60 px-1.5 py-0.5 rounded">#{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDate(note.updatedAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {results.notes.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>검색 결과가 없습니다.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="plans" className="m-0">
              <div className="space-y-2">
                {results.plans.map(plan => (
                  <Card key={plan.id} className="cursor-pointer hover:bg-accent/50" onClick={() => onSelectPlan && onSelectPlan(plan)}>
                    <CardContent className="p-3">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <div className="flex-1">
                          <h4 className="text-sm font-medium" dangerouslySetInnerHTML={{ __html: highlightMatch(plan.title) }} />
                          <p className="text-xs text-muted-foreground truncate" dangerouslySetInnerHTML={{ __html: highlightMatch(plan.description.substring(0, 100)) }} />
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {formatDate(plan.startDate)} - {formatDate(plan.endDate)}
                            </span>
                            <span className={`text-xs ml-2 px-1.5 py-0.5 rounded ${
                              plan.priority === 'high' ? 'bg-red-100 text-red-800' : 
                              plan.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-green-100 text-green-800'
                            }`}>
                              {plan.priority === 'high' ? '높음' : plan.priority === 'medium' ? '중간' : '낮음'}
                            </span>
                            {plan.completed && (
                              <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">완료됨</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {results.plans.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>검색 결과가 없습니다.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="tags" className="m-0">
              <div className="flex flex-wrap gap-2 p-2">
                {results.tags.map(tag => (
                  <Button 
                    key={tag} 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center" 
                    onClick={() => setSearchQuery(tag)}
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Button>
                ))}
                {results.tags.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground w-full">
                    <p>검색된 태그가 없습니다.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <SearchIcon className="h-12 w-12 mb-4 text-muted-foreground/50" />
          <p className="text-center">검색어를 입력하여 노트, 일정, 태그를 찾아보세요.</p>
        </div>
      )}
    </div>
  );
};