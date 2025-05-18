// src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Toaster } from '@/components/ui/toaster';
import { NoteList } from '@/components/features/noteList';
import { Editor } from '@/components/features/editor';
import { Calendar } from '@/components/features/calendar';
import { PlanManager } from '@/components/features/planManager';
import { TimelineView } from '@/components/features/timelineView';
import { Search } from '@/components/features/search';
import { UserProfile } from '@/components/features/userProfile';
import { useAuthStore } from '@/stores/authStore';
import { useNotes } from '@/hooks/useNotes';
import { usePlans } from '@/hooks/usePlans';
import { useSearch } from '@/hooks/useSearch';
import { TeamSpaceList } from '@/components/features/dashboard/teamSpaceList';
import {
  PlusCircle,
  Calendar as CalendarIcon,
  Clock,
  List,
  Search as SearchIcon,
  Menu,
} from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import logoImage from '@/assets/images/Logo.png';
import logoDarkImage from '@/assets/images/LogoDark.png';

// 타입 정의
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

const NAV_ITEMS = [
  { id: 'notes', label: '노트', icon: List },
  { id: 'plans', label: '일정', icon: Clock },
  { id: 'calendar', label: '캘린더', icon: CalendarIcon },
  { id: 'timeline', label: '타임라인', icon: List },
];

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('notes');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { isDarkMode, isDeepDarkMode } = useThemeStore();
  const { notes, addNote, updateNote, deleteNote } = useNotes();
  const { plans, addPlan, updatePlan, deletePlan } = usePlans();
  const { searchResults, setSearchQuery } = useSearch();
  const { isAuthenticated, isLoginLoading, checkSession } = useAuthStore();
  const navigate = useNavigate();
  const [isClient, setIsClient] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);

  // 반응형 처리
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 인증 체크
  useEffect(() => {
    setIsClient(true);
    const checkAuthStatus = async () => {
      try {
        const isAuth = await checkSession();
        if (!isAuth) {
          navigate('/login');
        }
      } catch (err) {
        navigate('/login');
      } finally {
        setLocalLoading(false);
      }
    };
    checkAuthStatus();
  }, [navigate, checkSession]);

  // 로딩 상태 처리
  if (!isClient) return null;
  if (isLoginLoading || localLoading) {
    return <LoadingSpinner />;
  }
  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  // 새 노트 생성
  const handleCreateNote = async () => {
    const newNoteData = {
      title: '새로운 노트',
      content: '',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newNote = await addNote(newNoteData);
    if (newNote) {
      setSelectedNote(newNote);
      setActiveTab('notes');
    }
  };

  // 새 일정 생성
  const handleCreatePlan = () => {
    const newPlan: Plan = {
      id: Date.now().toString(),
      title: '새로운 일정',
      description: '',
      startDate: new Date(),
      endDate: new Date(Date.now() + 3600000), // 1시간 후
      completed: false,
      priority: 'medium',
      tags: [],
    };

    addPlan(newPlan);
    setActiveTab('plans');
  };

  return (
    <div
      id="dashboard-container"
      className={`flex flex-col h-screen theme-${
        isDarkMode ? (isDeepDarkMode ? 'deepdark' : 'dark') : 'light'
      }`}
    >
      <div className="flex flex-col h-full bg-background text-foreground">
        <Toaster />
        {/* 헤더 */}
        <header className="flex justify-between items-center px-4 py-3 border-b border-border">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-primary">
              <img
                src={isDarkMode || isDeepDarkMode ? logoDarkImage : logoImage}
                className="max-w-40 cursor-pointer"
                alt="로고"
              />
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveTab('search')}
            >
              <SearchIcon className="h-5 w-5" />
            </Button>

            {/* 모바일 네비게이션 */}
            {isMobile ? (
              <MobileNavigation
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                handleCreateNote={handleCreateNote}
                handleCreatePlan={handleCreatePlan}
              />
            ) : (
              <DesktopActions
                handleCreateNote={handleCreateNote}
                handleCreatePlan={handleCreatePlan}
              />
            )}
          </div>
        </header>

        {/* 메인 컨텐츠 */}
        <div className="flex flex-1 overflow-hidden">
          {/* 사이드바 - 데스크톱만 */}
          {!isMobile && (
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          )}

          {/* 메인 컨텐츠 영역 */}
          <div className="flex-1 overflow-hidden">{renderMainContent()}</div>
        </div>
      </div>
    </div>
  );

  // 메인 컨텐츠 렌더링 함수
  function renderMainContent() {
    switch (activeTab) {
      case 'notes':
        return (
          <div className="flex h-full">
            <div className="w-1/3 border-r border-border h-full">
              <NoteList
                notes={notes}
                onSelectNote={setSelectedNote}
                selectedNote={selectedNote}
              />
            </div>
            <div className="w-2/3 h-full">
              {selectedNote ? (
                <Editor
                  note={selectedNote}
                  onSave={updateNote}
                  onDelete={() => {
                    deleteNote(selectedNote.id);
                    setSelectedNote(null);
                  }}
                />
              ) : (
                <EmptyNoteState handleCreateNote={handleCreateNote} />
              )}
            </div>
          </div>
        );
      case 'plans':
        return (
          <PlanManager
            plans={plans}
            onAddPlan={addPlan}
            onUpdatePlan={updatePlan}
            onDeletePlan={deletePlan}
          />
        );
      case 'calendar':
        return (
          <Calendar
            plans={plans}
            onSelectDate={setSelectedDate}
            selectedDate={selectedDate}
          />
        );
      case 'timeline':
        return <TimelineView plans={plans} notes={notes} />;
      case 'search':
        return (
          <Search
            onSearch={setSearchQuery}
            results={searchResults}
            onSelectNote={(note) => {
              setSelectedNote(note);
              setActiveTab('notes');
            }}
          />
        );
      default:
        return null;
    }
  }
};

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

const EmptyNoteState = ({
  handleCreateNote,
}: {
  handleCreateNote: () => void;
}) => (
  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
    <p>노트를 선택하거나 새로운 노트를 작성하세요</p>
    <Button variant="outline" className="mt-4" onClick={handleCreateNote}>
      <PlusCircle className="mr-2 h-4 w-4" />새 노트
    </Button>
  </div>
);

const Sidebar = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) => {
  const { notes } = useNotes();
  const [popularTags, setPopularTags] = useState<
    { tag: string; count: number }[]
  >([]);

  // 인기 태그 계산
  useEffect(() => {
    const tagCount: Record<string, number> = {};

    // 모든 노트의 태그를 순회하며 카운트
    notes.forEach((note) => {
      note.tags.forEach((tag) => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });

    // 태그를 사용 빈도 순으로 정렬
    const sortedTags = Object.entries(tagCount)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // 상위 5개만 표시

    setPopularTags(sortedTags);
  }, [notes]);

  return (
    <div className="w-56 border-r border-border bg-muted p-4 hidden md:block">
      <div className="flex flex-col gap-2">
        {/* 기본 네비게이션 아이템 */}
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={activeTab === item.id ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab(item.id)}
            >
              <Icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          );
        })}

        {/* 팀 스페이스 섹션 - 나중에 구현 */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            팀 스페이스
          </h3>
          <TeamSpaceList activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        {/* 인기 태그 섹션 */}
        {popularTags.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              인기 태그
            </h3>
            <div className="flex flex-col gap-1">
              {popularTags.map(({ tag, count }) => (
                <Button
                  key={tag}
                  variant="ghost"
                  size="sm"
                  className="justify-between text-xs"
                  onClick={() => {
                    // 태그 필터링 기능 구현
                    setActiveTab('notes');
                    // 태그로 필터링하는 상태 설정 (별도 구현 필요)
                  }}
                >
                  <span>#{tag}</span>
                  <span className="bg-muted-foreground/20 rounded-full px-2 py-0.5 text-xs">
                    {count}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MobileNavigation = ({
  activeTab,
  setActiveTab,
  handleCreateNote,
  handleCreatePlan,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  handleCreateNote: () => void;
  handleCreatePlan: () => void;
}) => (
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="ghost" size="icon">
        <Menu className="h-5 w-5" />
      </Button>
    </SheetTrigger>
    <SheetContent side="right" className="w-64 bg-background">
      <div className="flex flex-col gap-4 py-4">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleCreateNote}
        >
          <PlusCircle className="mr-2 h-4 w-4" />새 노트
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleCreatePlan}
        >
          <PlusCircle className="mr-2 h-4 w-4" />새 일정
        </Button>
        <Separator />
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.id}
              variant={activeTab === item.id ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab(item.id)}
            >
              <Icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          );
        })}
        <div className="mt-auto">
          <UserProfile />
        </div>
      </div>
    </SheetContent>
  </Sheet>
);

const DesktopActions = ({
  handleCreateNote,
  handleCreatePlan,
}: {
  handleCreateNote: () => void;
  handleCreatePlan: () => void;
}) => (
  <div className="flex items-center gap-2">
    <Button variant="outline" size="sm" onClick={handleCreateNote}>
      <PlusCircle className="mr-2 h-4 w-4" />새 노트
    </Button>
    <Button variant="outline" size="sm" onClick={handleCreatePlan}>
      <PlusCircle className="mr-2 h-4 w-4" />새 일정
    </Button>
    {/* 유저 프로필 */}
    <UserProfile />
  </div>
);

export default Dashboard;
