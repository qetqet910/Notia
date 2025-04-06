import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/services/supabase';
import { useNavigate } from 'react-router-dom';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

import { NoteList } from '@/components/features/NoteList';
import { Editor } from '@/components/features/Editor';
import { Calendar } from '@/components/features/Calendar';
import { PlanManager } from '@/components/features/PlanManager';
import { TimelineView } from '@/components/features/Timeline/TimelineView';
import { Search } from '@/components/features/Search/Search';
import { UserProfile } from '@/components/features/UserProfile/userProfile';

import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/hooks/useAuth';
import { useNotes } from '@/hooks/useNotes';
import { usePlans } from '@/hooks/usePlans';
import { useSearch } from '@/hooks/useSearch';

import {
  PlusCircle,
  Calendar as CalendarIcon,
  Clock,
  List,
  Search as SearchIcon,
  Menu,
  LogOut,
  User,
} from 'lucide-react';
import logoImage from '@/stores/images/Logo.png';

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

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('notes');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { notes, addNote, updateNote, deleteNote } = useNotes();
  const { plans, addPlan, updatePlan, deletePlan } = usePlans();
  const { searchResults, setSearchQuery } = useSearch();
  const { signOut } = useAuth();

  const { isAuthenticated, isLoading, userProfile, user, checkSession } =
    useAuthStore();
  const navigate = useNavigate();
  const [isClient, setIsClient] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);
  const sessionChecked = useRef(false);

  useEffect(() => {
    setIsClient(true);
    const checkAuthStatus = async () => {
      try {
        const isAuth = await checkSession();
        if (!isAuth) {
          navigate("/login");
        }
      } catch (err) {
        navigate("/login");
      } finally {
        setLocalLoading(false);
      }
    };
    checkAuthStatus();
  }, [navigate, checkSession]);

  // 서버 사이드 렌더링 시 아무것도 표시하지 않음
  if (!isClient) return null

  // 로딩 중이면 로딩 표시
  if (isLoading || localLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#61C9A8]"></div>
      </div>
    )
  }

  // 인증되지 않았으면 로그인 페이지로 리다이렉트 (추가 안전장치)
  if (!isAuthenticated) {
    console.log("Dashboard - 인증 안됨, 로그인 페이지로 리다이렉트")
    navigate("/login")
    return null
  }

  // Create a new note
  const handleCreateNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: '새로운 노트',
      content: '',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addNote(newNote);
    setSelectedNote(newNote);
    setActiveTab('notes');
  };

  // Create a new plan
  const handleCreatePlan = () => {
    const newPlan: Plan = {
      id: Date.now().toString(),
      title: '새로운 일정',
      description: '',
      startDate: new Date(),
      endDate: new Date(Date.now() + 3600000), // 1 hour later
      completed: false,
      priority: 'medium',
      tags: [],
    };

    addPlan(newPlan);
    setActiveTab('plans');
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex justify-between items-center px-4 py-3 border-b">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-[#61C9A8]">
            <img src={logoImage} className="max-w-40 cursor-pointer" alt="" />
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

          {isMobile ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
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
                  <Button
                    variant={activeTab === 'notes' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab('notes')}
                  >
                    <List className="mr-2 h-4 w-4" />
                    노트
                  </Button>
                  <Button
                    variant={activeTab === 'plans' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab('plans')}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    일정
                  </Button>
                  <Button
                    variant={activeTab === 'calendar' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab('calendar')}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    캘린더
                  </Button>
                  <Button
                    variant={activeTab === 'timeline' ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setActiveTab('timeline')}
                  >
                    <List className="mr-2 h-4 w-4" />
                    타임라인
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCreateNote}>
                <PlusCircle className="mr-2 h-4 w-4" />새 노트
              </Button>
              <Button variant="outline" size="sm" onClick={handleCreatePlan}>
                <PlusCircle className="mr-2 h-4 w-4" />새 일정
              </Button>
              {/* 유저 프로필 */}
              <div className="flex items-center gap-4">
                {userProfile && (
                  <div className="flex items-center gap-2">
                    {userProfile.avatar_url ? (
                      <img
                        src={userProfile.avatar_url || '/placeholder.svg'}
                        alt="프로필"
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <User className="w-6 h-6 text-gray-500" />
                    )}
                    <span className="text-sm font-medium">
                      {userProfile.display_name ||
                        userProfile.email ||
                        '사용자'}
                    </span>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={signOut}
                  className="flex items-center gap-1"
                >
                  <LogOut className="w-4 h-4" />
                  로그아웃
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Desktop only */}
        {!isMobile && (
          <div className="w-56 border-r bg-muted/10 p-4 hidden md:block">
            <div className="flex flex-col gap-2">
              <Button
                variant={activeTab === 'notes' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('notes')}
              >
                <List className="mr-2 h-4 w-4" />
                노트
              </Button>
              <Button
                variant={activeTab === 'plans' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('plans')}
              >
                <Clock className="mr-2 h-4 w-4" />
                일정
              </Button>
              <Button
                variant={activeTab === 'calendar' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('calendar')}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                캘린더
              </Button>
              <Button
                variant={activeTab === 'timeline' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('timeline')}
              >
                <List className="mr-2 h-4 w-4" />
                타임라인
              </Button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'notes' && (
            <div className="flex h-full">
              <div className="w-1/3 border-r h-full">
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
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <p>노트를 선택하거나 새로운 노트를 작성하세요</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={handleCreateNote}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />새 노트
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'plans' && (
            <PlanManager
              plans={plans}
              onAddPlan={addPlan}
              onUpdatePlan={updatePlan}
              onDeletePlan={deletePlan}
            />
          )}

          {activeTab === 'calendar' && (
            <Calendar
              plans={plans}
              onSelectDate={setSelectedDate}
              selectedDate={selectedDate}
            />
          )}

          {activeTab === 'timeline' && (
            <TimelineView plans={plans} notes={notes} />
          )}

          {activeTab === 'search' && (
            <Search
              onSearch={setSearchQuery}
              results={searchResults}
              onSelectNote={(note) => {
                setSelectedNote(note);
                setActiveTab('notes');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
