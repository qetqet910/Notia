import type React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '@/components/features/dashboard/userProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  ArrowLeft,
  FileText,
  Tag,
  Calendar,
  Users,
  Keyboard,
  Lightbulb,
  Zap,
  Heart,
  Star,
  Clock,
  Hash,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import logoImage from '@/assets/images/Logo.png';
import logoDarkImage from '@/assets/images/LogoDark.png';

export const HelpPage: React.FC = () => {
  const { isDarkMode, isDeepDarkMode } = useThemeStore();
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const [animationStep, setAnimationStep] = useState(0);

  const logoSrc = isDarkMode || isDeepDarkMode ? logoDarkImage : logoImage;
  const navigate = useNavigate();

  const handleBackUrl = () => {
    navigate('/dashboard');
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationStep((prev) => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: FileText,
      title: '스마트한 노트 작성',
      description: '마크다운 지원과 쓰기 편한 부가 기능들로 순간을 기록하세요.',
      color: 'text-blue-500',
    },
    {
      icon: Tag,
      title: '자동 태그 인식',
      description: '#태그명으로 간편하게 노트를 분류하고 관리하세요',
      color: 'text-green-500',
    },
    {
      icon: Calendar,
      title: '스마트 리마인더',
      description: '@시간 내용.으로 자동으로 일정을 생성하고 알림을 받으세요',
      color: 'text-purple-500',
    },
    {
      icon: Users,
      title: '팀 협업',
      description: '그룹을 만들어 팀원들과 노트를 공유하고 함께 작업하세요',
      color: 'text-orange-500',
    },
  ];

  const shortcuts = [
    { key: 'Ctrl + N', description: '새 노트 생성' },
    { key: 'Ctrl + S', description: '노트 저장' },
    { key: 'Ctrl + K', description: '검색' },
    { key: 'Ctrl + /', description: '도움말 열기' },
    { key: 'Ctrl + D', description: '다크 모드 토글' },
    { key: 'Ctrl + B', description: '사이드바 토글' },
  ];

  const examples = [
    {
      title: '일정 관리',
      content: `#회의 #중요

@내일 2시 팀 미팅 참석하기.
@1시간 프레젠테이션 준비하기.
@금요일 오후 프로젝트 마감.`,
      description: '태그와 리마인더를 활용한 일정 관리',
    },
    {
      title: '프로젝트 노트',
      content: `#프로젝트 #개발

## 할 일 목록
- [ ] API 설계
- [x] 데이터베이스 스키마 작성
- [ ] 프론트엔드 구현

@내일 10시 코드 리뷰하기.
@다음주 월요일 배포 준비하기.`,
      description: '체크리스트와 리마인더가 포함된 프로젝트 관리',
    },
  ];

  return (
    <div
      className={`flex flex-col h-screen theme-${
        isDarkMode ? (isDeepDarkMode ? 'deepdark' : 'dark') : 'light'
      }`}
    >
      <div className="flex flex-col h-full bg-background text-foreground">
        {/* 헤더 */}
        <header className="flex justify-between items-center px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackUrl}
              className="mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-primary">
              <img
                src={logoSrc || '/placeholder.svg'}
                className="max-w-40 cursor-pointer"
                alt="로고"
              />
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <UserProfile />
          </div>
        </header>

        {/* 메인 콘텐츠 */}
        <ScrollArea className="flex-1">
          <div className="container mx-auto p-6 max-w-4xl">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">개요</TabsTrigger>
                <TabsTrigger value="features">기능</TabsTrigger>
                <TabsTrigger value="guide">사용법</TabsTrigger>
                <TabsTrigger value="shortcuts">단축키</TabsTrigger>
                <TabsTrigger value="faq">FAQ</TabsTrigger>
              </TabsList>

              {/* 개요 탭 */}
              <TabsContent value="overview" className="space-y-6">
                {/* 히어로 섹션 */}
                <Card className="relative overflow-hidden">
                  <div className="absolute inset-0" />
                  <CardContent className="relative p-8 text-center">
                    <div className="mb-6">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                        <Heart className="h-8 w-8 text-primary" />
                      </div>
                      <h1 className="text-3xl font-bold mb-2">MOMENTOUS</h1>
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
                        <Star className="h-4 w-4 mr-1" />팀 협업
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* 주요 기능 미리보기 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {features.map((feature, index) => (
                    <Card
                      key={index}
                      className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                        activeFeature === index ? 'ring-2 ring-primary' : ''
                      }`}
                      onMouseEnter={() => setActiveFeature(index)}
                      onMouseLeave={() => setActiveFeature(null)}
                    >
                      <CardContent className="p-6">
                        <div
                          className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4`}
                        >
                          <feature.icon
                            className={`h-6 w-6 ${feature.color}`}
                          />
                        </div>
                        <h3 className="font-semibold mb-2">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* 통계 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Star className="h-5 w-5 mr-2 text-yellow-500" />왜 우리
                      앱을 선택해야 할까요?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-500 mb-2">
                          99%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          사용자 만족도
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-500 mb-2">
                          50%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          생산성 향상
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-500 mb-2">
                          24/7
                        </div>
                        <div className="text-sm text-muted-foreground">
                          언제든 접근 가능
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 기능 탭 */}
              <TabsContent value="features" className="space-y-6">
                <div className="space-y-6">
                  {features.map((feature, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <div
                            className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mr-3`}
                          >
                            <feature.icon
                              className={`h-5 w-5 ${feature.color}`}
                            />
                          </div>
                          {feature.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-4">
                          {feature.description}
                        </p>
                        {index === 1 && (
                          <div className="bg-muted/50 p-4 rounded-lg">
                            <p className="text-sm font-medium mb-2">예시:</p>
                            <code className="text-sm">
                              #프로젝트 #중요 #개발
                            </code>
                            <p className="text-xs text-muted-foreground mt-2">
                              해시태그(#)를 사용하여 자동으로 태그가 생성됩니다
                            </p>
                          </div>
                        )}
                        {index === 2 && (
                          <div className="bg-muted/50 p-4 rounded-lg">
                            <p className="text-sm font-medium mb-2">예시:</p>
                            <code className="text-sm">
                              @내일 2시 회의 참석하기.
                            </code>
                            <p className="text-xs text-muted-foreground mt-2">
                              @시간 내용. 형식으로 자동으로 리마인더가
                              생성됩니다
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* 사용법 가이드 탭 */}
              <TabsContent value="guide" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
                      빠른 시작 가이드
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        1
                      </div>
                      <div>
                        <h4 className="font-medium">새 노트 생성</h4>
                        <p className="text-sm text-muted-foreground">
                          + 버튼을 클릭하거나 Ctrl+N을 눌러 새 노트를 만드세요
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        2
                      </div>
                      <div>
                        <h4 className="font-medium">태그 추가</h4>
                        <p className="text-sm text-muted-foreground">
                          #태그명 형식으로 태그를 추가하세요
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        3
                      </div>
                      <div>
                        <h4 className="font-medium">리마인더 설정</h4>
                        <p className="text-sm text-muted-foreground">
                          @시간 할일내용. 형식으로 리마인더를 설정하세요
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        4
                      </div>
                      <div>
                        <h4 className="font-medium">저장 및 공유</h4>
                        <p className="text-sm text-muted-foreground">
                          Ctrl+S로 저장하고 그룹에 공유하세요
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 예시 노트들 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">예시 노트</h3>
                  {examples.map((example, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-base">
                          {example.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {example.description}
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-muted/50 p-4 rounded-lg font-mono text-sm whitespace-pre-line">
                          {example.content}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* 시간 형식 가이드 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-blue-500" />
                      리마인더 시간 형식
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-medium mb-2">상대적 시간</h4>
                        <ul className="space-y-1 text-muted-foreground">
                          <li>• @1시간 → 1시간 후</li>
                          <li>• @30분 → 30분 후</li>
                          <li>• @내일 2시 → 내일 오후 2시</li>
                          <li>• @모레 10시 → 모레 오전 10시</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">절대적 시간</h4>
                        <ul className="space-y-1 text-muted-foreground">
                          <li>• @3시 → 오후 3시 (15:00)</li>
                          <li>• @15시 → 오후 3시 (15:00)</li>
                          <li>• @2025-05-25 → 해당 날짜 09:00</li>
                          <li>• @12-25 → 12월 25일 09:00</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 단축키 탭 */}
              <TabsContent value="shortcuts" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Keyboard className="h-5 w-5 mr-2 text-purple-500" />
                      키보드 단축키
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {shortcuts.map((shortcut, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-3 bg-muted/50 rounded-lg"
                        >
                          <span className="text-sm">
                            {shortcut.description}
                          </span>
                          <Badge variant="outline" className="font-mono">
                            {shortcut.key}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Hash className="h-5 w-5 mr-2 text-green-500" />
                      마크다운 단축키
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span># 제목</span>
                        <span className="text-muted-foreground">헤딩 1</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>## 부제목</span>
                        <span className="text-muted-foreground">헤딩 2</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>**굵게**</span>
                        <span className="text-muted-foreground">
                          볼드 텍스트
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>*기울임*</span>
                        <span className="text-muted-foreground">
                          이탤릭 텍스트
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>- 목록</span>
                        <span className="text-muted-foreground">
                          불릿 리스트
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>- [ ] 체크박스</span>
                        <span className="text-muted-foreground">
                          할 일 목록
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* FAQ 탭 */}
              <TabsContent value="faq" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <HelpCircle className="h-5 w-5 mr-2 text-blue-500" />
                      자주 묻는 질문
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="item-1">
                        <AccordionTrigger>
                          노트가 자동으로 저장되나요?
                        </AccordionTrigger>
                        <AccordionContent>
                          네, 노트는 자동으로 저장됩니다. 하지만 수동으로
                          Ctrl+S를 눌러 즉시 저장할 수도 있습니다.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-2">
                        <AccordionTrigger>
                          리마인더 알림은 어떻게 받나요?
                        </AccordionTrigger>
                        <AccordionContent>
                          브라우저 알림 권한을 허용하시면 설정한 시간에 알림을
                          받을 수 있습니다. 설정에서 알림 옵션을 조정할 수
                          있습니다.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-3">
                        <AccordionTrigger>
                          그룹에서 노트를 공유하려면?
                        </AccordionTrigger>
                        <AccordionContent>
                          그룹을 생성하거나 참여한 후, 노트 작성 시 해당 그룹을
                          선택하면 그룹 멤버들과 노트를 공유할 수 있습니다.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-4">
                        <AccordionTrigger>
                          다크 모드를 사용할 수 있나요?
                        </AccordionTrigger>
                        <AccordionContent>
                          네, 설정에서 다크 모드와 딥 다크 모드를 선택할 수
                          있습니다. 시스템 설정을 따르도록 할 수도 있습니다.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-5">
                        <AccordionTrigger>
                          모바일에서도 사용할 수 있나요?
                        </AccordionTrigger>
                        <AccordionContent>
                          네, 반응형 디자인으로 모바일, 태블릿, 데스크톱 모든
                          기기에서 최적화된 경험을 제공합니다.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-6">
                        <AccordionTrigger>
                          데이터는 안전하게 보관되나요?
                        </AccordionTrigger>
                        <AccordionContent>
                          모든 데이터는 암호화되어 안전하게 저장되며, 정기적인
                          백업을 통해 데이터 손실을 방지합니다.
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>

                {/* 연락처 정보 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Heart className="h-5 w-5 mr-2 text-red-500" />더 궁금한
                      점이 있으신가요?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      언제든지 문의해 주세요. 빠른 시간 내에 답변드리겠습니다.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline">이메일 문의</Button>
                      <Button variant="outline">피드백 보내기</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
