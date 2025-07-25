import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search,
  Keyboard,
  FileText,
  Info,
  Tag,
  Bell,
  Users,
  Calendar,
  History,
  Lightbulb,
  Zap,
  Star,
  Clock,
  Hash,
  HelpCircle,
  Heart,
  DatabaseBackup,
  BellRing,
  SkipForward,
} from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';

// Content from user's original file
const features = [
  {
    icon: FileText,
    title: '마크다운 노트 작성',
    description: '마크다운 지원과 쓰기 편한 부가 기능들로 순간을 기록하세요.',
    color: 'text-blue-300',
  },
  {
    icon: Tag,
    title: '자동 태그 인식',
    description: '#태그명으로 간편하게 노트를 분류하고 관리하세요.',
    color: 'text-teal-400',
  },
  {
    icon: Bell,
    title: '스마트 리마인더',
    description: '@시간 내용.으로 자동으로 일정을 생성하고 알림을 받으세요.',
    color: 'text-red-400',
  },
  {
    icon: SkipForward,
    title: '단축키',
    description: '사용자 친화적인 단축키들로 빠른 사용자 경험을 선사합니다.',
    color: 'text-lime-500',
  },
  {
    icon: BellRing,
    title: '리마인더',
    description: '한 눈에 보고, 관리하고, 알람을 설정하세요.',
    color: 'text-orange-400',
  },
  {
    icon: Calendar,
    title: '캘린더',
    description: '저장된 리마인더로 한 눈에 일정을 파악하고 관리하세요.',
    color: 'text-indigo-500',
  },
  {
    icon: History,
    title: '타임라인',
    description: '누가, 언제, 뭘 만들었는지 한 눈에 파악하세요.',
    color: 'text-blue-500',
  },
  {
    icon: DatabaseBackup,
    title: '노트 백업&복구',
    description:
      '노트와 리마인더의 백업, 복구로 언제 어떤 계정에서든 사용하세요.',
    color: 'text-yellow-500',
  },
  {
    icon: Users,
    title: '팀 협업',
    description: '그룹을 만들어 팀원들과 노트를 공유하고 함께 작업하세요.',
    color: 'text-green-300',
  },
];

const shortcuts = [
  { key: 'N', description: '노트 생성' },
  { key: 'Ctrl + S', description: '노트 저장' },
  { key: 'D or Del', description: '노트 삭제' },
  { key: 'Tab', description: '탭 전환' },
  { key: 'T', description: '테마 전환' },
  { key: 'B', description: '사이드바 토글' },
  { key: 'M', description: '마이페이지 열기' },
  { key: ', or <', description: '활동 열기' },
  { key: '. or >', description: '설정 열기' },
  { key: '/ or ?', description: '도움말 열기' },
  { key: 'ESC', description: '메인 화면' },
  { key: 'Alt + F4', description: '쌈@뽕한 종료' },
];

const markdownShortcuts = [
  { md: '# 제목', desc: '헤딩 1' },
  { md: '## 부제목', desc: '헤딩 2' },
  { md: '### 소제목', desc: '헤딩 3' },
  { md: '**굵게**', desc: '볼드' },
  { md: '*기울임*', desc: '이탤릭' },
  { md: '`코드`', desc: '인라인' },
  { md: '```코드블록```', desc: '블록' },
  { md: '- 목록', desc: '불릿' },
  { md: '1. 순서목록', desc: '번호' },
  { md: '- [ ] 체크박스', desc: '할 일' },
  { md: '[링크](url)', desc: '링크' },
  { md: '![이미지](url)', desc: '이미지' },
  { md: '> 인용', desc: '인용문' },
  { md: '---', desc: '구분선' },
];

const FAQ_DATA = [
  {
    q: '리마인더 알림은 어떻게 받나요?',
    a: '브라우저 알림 권한을 허용하시면 설정한 시간에 알림을 받을 수 있습니다. 설정에서 알림 옵션을 조정할 수 있습니다.',
  },
  {
    q: '다크 모드를 사용할 수 있나요?',
    a: '네, 설정에서 다크 모드와 딥 다크 모드를 선택할 수 있습니다. 시스템 설정을 따르도록 할 수도 있습니다.',
  },
  {
    q: '모바일에서도 사용할 수 있나요?',
    a: '네, 반응형 디자인으로 모바일, 태블릿, 데스크톱 모든 기기에서 최적화된 경험을 제공합니다.',
  },
  {
    q: '데이터는 안전하게 보관되나요?',
    a: '모든 데이터는 암호화되어 안전하게 저장되며, 정기적인 백업을 통해 데이터 손실을 방지합니다.',
  },
  // { TODO 주석들 그룹 기능 추가하면 풀기
  //   q: '그룹에서 노트를 공유하려면?',
  //   a: '그룹을 생성하거나 참여한 후, 노트 작성 시 해당 그룹을 선택하면 그룹 멤버들과 노트를 공유할 수 있습니다.',
  // },
];

const HelpContentWrapper: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, children }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center">
        {icon}
        <span className="ml-2">{title}</span>
      </CardTitle>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { isDarkMode, isDeepDarkMode, setTheme } = useThemeStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeTab = searchParams.get('tab') || 'overview';

  const setActiveTab = useCallback(
    (newTab: string) => {
      setSearchParams({ tab: newTab });
    },
    [setSearchParams],
  );

  const handleKeyboardShortcuts = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      const pageShortcuts: { [key: string]: () => void } = {
        t: () => setTheme(isDarkMode || isDeepDarkMode ? 'light' : 'dark'),
        m: () => navigate('/dashboard/myPage?tab=profile'),
        ',': () => navigate('/dashboard/myPage?tab=activity'),
        '.': () => navigate('/dashboard/myPage?tab=settings'),
        '/': () => navigate('/dashboard/help?tab=overview'),
        '?': () => navigate('/dashboard/help?tab=overview'),
        escape: () => navigate('/dashboard'),
      };

      if (key === 'tab') {
        e.preventDefault();
        const tabs = ['overview', 'guide', 'shortcuts', 'faq'];
        const currentTabIndex = tabs.indexOf(activeTab);
        const nextTab = tabs[(currentTabIndex + 1) % tabs.length];
        setActiveTab(nextTab);
        return;
      }

      const handler = pageShortcuts[key];
      if (handler) {
        e.preventDefault();
        handler();
      }
    },
    [navigate, setTheme, isDarkMode, isDeepDarkMode, setActiveTab, activeTab],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () => {
      document.removeEventListener('keydown', handleKeyboardShortcuts);
    };
  }, [handleKeyboardShortcuts]);

  const filteredShortcuts = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase();
    if (!lowerCaseSearch) return shortcuts;
    return shortcuts.filter(
      (s) =>
        s.description.toLowerCase().includes(lowerCaseSearch) ||
        s.key.toLowerCase().includes(lowerCaseSearch),
    );
  }, [searchTerm]);

  const filteredMarkdownShortcuts = useMemo(() => {
    const lowerCaseSearch = searchTerm.toLowerCase();
    if (!lowerCaseSearch) return markdownShortcuts;
    return markdownShortcuts.filter(
      (s) =>
        s.desc.toLowerCase().includes(lowerCaseSearch) ||
        s.md.toLowerCase().includes(lowerCaseSearch),
    );
  }, [searchTerm]);

  return (
    <div
      className={`p-4 md:p-6 lg:p-8 bg-background text-foreground custom-scrollbar theme-${
        isDarkMode ? (isDeepDarkMode ? 'deepdark' : 'dark') : 'light'
      }`}
    >
      <Toaster />
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">도움말 센터</h1>
          <p className="text-muted-foreground mt-2">
            순간을 기록하는 것에 필요한 모든 것을 찾아보세요.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-1">
            <ul className="space-y-2 sticky top-8">
              {[
                { id: 'overview', label: '개요', icon: <Star /> },
                { id: 'guide', label: '사용법', icon: <FileText /> },
                { id: 'shortcuts', label: '단축키', icon: <Keyboard /> },
                { id: 'faq', label: 'FAQ', icon: <Info /> },
              ].map(({ id, label, icon }) => (
                <li key={id}>
                  <button
                    onClick={() => setActiveTab(id)}
                    className={`w-full flex items-center p-2 rounded-md text-sm transition-colors ${
                      activeTab === id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    {React.cloneElement(icon, { className: 'h-4 w-4 mr-2' })}
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-4 space-y-6 custom-scrollbar">
            {activeTab === 'overview' && (
              <>
                <Card className="relative overflow-hidden text-center">
                  <CardContent className="relative p-8">
                    <div className="mb-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                        <Bell className="h-8 w-8 text-primary" />
                      </div>
                      <h1 className="text-3xl font-bold mb-2">N O T I A</h1>
                      <p className="text-lg text-muted-foreground">
                        순간을 기록하고, 내일을 만드는 제일 현명한 방법.
                      </p>
                    </div>
                    <div className="flex justify-center gap-4">
                      <Badge variant="secondary" className="px-3 py-1">
                        <Zap className="h-4 w-4 mr-1" />
                        빠른 작성
                      </Badge>
                      <Badge variant="secondary" className="px-3 py-1">
                        <Lightbulb className="h-4 w-4 mr-1" />
                        사용자 친화적
                      </Badge>
                      <Badge variant="secondary" className="px-3 py-1">
                        <Star className="h-4 w-4 mr-1" />
                        리마인더
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {features.map((feature, index) => (
                    <Card key={index}>
                      <CardContent className="p-6">
                        <div className="inline-flex items-center justify-start w-full h-2 rounded-lg mb-4">
                          <feature.icon
                            className={`h-6 w-6 ${feature.color}`}
                          />
                          <h3 className="font-semibold ml-4">
                            {feature.title}
                            {index === 8 && (
                              <Badge className="ml-2 bg-green-100 text-green-800">
                                추가 예정
                              </Badge>
                            )}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
            {activeTab === 'guide' && (
              <>
                <HelpContentWrapper
                  title="빠른 시작 가이드"
                  icon={<Lightbulb className="h-5 w-5 text-yellow-500" />}
                >
                  <div className="space-y-4">
                    {[
                      {
                        title: '새 노트 생성',
                        desc: '새 노트 버튼을 클릭하거나 N을 눌러 새 노트를 만드세요',
                      },
                      {
                        title: '태그 추가',
                        desc: '#태그명 형식으로 태그를 추가하세요',
                      },
                      {
                        title: '리마인더 설정',
                        desc: '@시간 할일내용. 형식으로 리마인더를 설정하세요',
                      },
                      {
                        title: '하루를 기록',
                        desc: '기록하고 싶은 것 아무 거나, 기록하세요.',
                      },
                      {
                        title: '한 눈에 확인',
                        desc: '각 탭에서 쉽고 빠르게 관리하고 확인하세요.',
                      },
                    ].map((item, index) => (
                      <div
                        className="flex items-start space-x-3"
                        key={item.title}
                      >
                        <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </HelpContentWrapper>

                <HelpContentWrapper
                  title="리마인더 시간 형식"
                  icon={<Clock className="h-5 w-5 text-blue-500" />}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium mb-2">상대적 시간</h4>
                      <ul className="space-y-1 text-muted-foreground list-disc pl-5">
                        <li>@1시간 → 1시간 후</li>
                        <li>@30분 → 30분 후</li>
                        <li>@내일 2시 → 내일 오후 2시</li>
                        <li>@모레 10시 → 모레 오전 10시</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">절대적 시간</h4>
                      <ul className="space-y-1 text-muted-foreground list-disc pl-5">
                        <li>@3시 → 오후 3시 (15:00)</li>
                        <li>@15시 → 오후 3시 (15:00)</li>
                        <li>@2025-05-25 → 해당 날짜 09:00</li>
                        <li>@2025-05-26 1시 → 해당 날짜 13:00</li>
                      </ul>
                    </div>
                  </div>
                </HelpContentWrapper>
              </>
            )}
            {activeTab === 'shortcuts' && (
              <div
                className="space-y-6 custom-scrollbar"
                style={{
                  maxHeight: 'calc(100vh - 200px)',
                  paddingRight: '1rem',
                }}
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="단축키 검색..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <HelpContentWrapper
                  title="키보드 단축키"
                  icon={<Keyboard className="h-5 w-5" />}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredShortcuts.map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-muted/50 rounded-lg"
                      >
                        <span className="text-sm">{shortcut.description}</span>
                        <Badge variant="outline" className="font-mono">
                          {shortcut.key}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </HelpContentWrapper>
                <HelpContentWrapper
                  title="마크다운 단축키"
                  icon={<Hash className="h-5 w-5" />}
                >
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                    {filteredMarkdownShortcuts.map((item) => (
                      <div
                        className="flex justify-between items-center"
                        key={item.md}
                      >
                        <span>{item.md}</span>
                        <span className="text-muted-foreground">
                          {item.desc}
                        </span>
                      </div>
                    ))}
                  </div>
                </HelpContentWrapper>
              </div>
            )}
            {activeTab === 'faq' && (
              <>
                <HelpContentWrapper
                  title="자주 묻는 질문"
                  icon={<HelpCircle className="h-5 w-5" />}
                >
                  <Accordion type="single" collapsible>
                    {FAQ_DATA.map((faq, index) => (
                      <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger>{faq.q}</AccordionTrigger>
                        <AccordionContent>{faq.a}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </HelpContentWrapper>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Heart className="h-5 w-5 mr-2 text-red-500" />더 궁금한
                      점이 있으신가요?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      <span>haemmin48@gmail.com</span> 로 문의해 주세요. 빠른
                      시간 내에 답변드리겠습니다.
                    </p>
                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-2">☕ 개발자 응원하기</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        도움이 되셨다면 커피 한 잔으로 응원해 주세요!
                      </p>
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href="https://acoffee.shop/d/00be6d8a-5e3e-494e-a559-0c2f4bb1c25f"
                          target="_blank"
                          rel="noreferrer"
                        >
                          후원한잔으로 후원하기
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
