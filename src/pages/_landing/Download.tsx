import React from 'react';
import { FaWindows, FaApple } from 'react-icons/fa';
import { FcLinux } from 'react-icons/fc';
import { IoGlobeOutline } from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Toaster } from '@/components/ui/toaster';

// OS 아이콘 컴포넌트
const OsIcon = ({ name }: { name: string }) => {
  const iconProps = { className: 'w-10 h-10 mb-4 text-slate-500' };
  switch (name) {
    case 'Windows':
      return <FaWindows {...iconProps} />;
    case 'macOS':
      return <FaApple {...iconProps} />;
    case 'Linux':
      return <FcLinux {...iconProps} />;
    case 'PWA':
      return <IoGlobeOutline {...iconProps} />;
    default:
      return null;
  }
};

const platformData = [
  {
    id: 'Windows',
    label: 'Windows',
    version: 'v1.2.0',
    lastUpdate: '2025년 7월 8일',
    description:
      'Windows 10/11에 최적화된 데스크톱 앱으로 가장 강력한 기능을 모두 사용해 보세요.',
    requirements: [
      'Windows 10 64-bit 이상',
      '4GB RAM 이상 권장',
      '150MB 디스크 공간',
    ],
    download: { label: 'Download for Windows', link: '#' },
  },
  {
    id: 'macOS',
    label: 'macOS',
    version: 'v1.2.0',
    lastUpdate: '2025년 7월 8일',
    description:
      'Mac 환경에 완벽하게 통합된 데스크톱 앱으로 부드러운 사용성을 경험하세요.',
    requirements: [
      'macOS 12 Monterey 이상',
      'Apple Silicon / Intel 프로세서 지원',
      '120MB 디스크 공간',
    ],
    download: { label: 'Download for macOS', link: '#' },
  },
  {
    id: 'Linux',
    label: 'Linux',
    version: 'v1.2.0',
    lastUpdate: '2025년 7월 8일',
    description:
      '다양한 배포판을 지원하는 Linux용 데스크톱 앱입니다. AppImage 또는 .deb 패키지로 제공됩니다.',
    requirements: [
      'Ubuntu 20.04, Fedora 36, Arch 등',
      'glibc 2.31 이상',
      '150MB 디스크 공간',
    ],
    download: { label: 'Download for Linux (.AppImage)', link: '#' },
  },
  {
    id: 'PWA',
    label: 'PWA',
    version: 'v1.2.0',
    lastUpdate: '2025년 7월 8일',
    description:
      '설치 없이 웹에서 바로 사용하거나, 홈 화면에 추가하여 앱처럼 사용할 수 있습니다.',
    requirements: [
      '최신 버전의 Chrome, Safari, Edge',
      '홈 화면에 추가하여 사용',
      '오프라인 사용 지원',
    ],
    download: { label: '웹 앱 실행', link: '/login' },
  },
];

const installationSteps = [
  {
    step: 1,
    title: '다운로드',
    description: '사용 중인 운영체제에 맞는 파일을 다운로드하세요.',
  },
  {
    step: 2,
    title: '실행 및 설치',
    description: '다운로드한 파일을 열어 간단한 설치 과정을 진행하세요.',
  },
  {
    step: 3,
    title: '로그인',
    description: '계정에 로그인하면 모든 노트가 안전하게 동기화됩니다.',
  },
];

const Checkmark = () => (
  <div className="w-4 h-4 rounded-full bg-[#61C9A8] flex items-center justify-center flex-shrink-0">
    <svg
      className="w-2.5 h-2.5 text-white"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
        d="M5 13l4 4L19 7"
      />
    </svg>
  </div>
);

export const DownloadPage: React.FC = () => {
  const [selectedId, setSelectedId] = React.useState(platformData[0].id);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Toaster />
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-16 sm:py-24">
        {/* Installation Guide Section as the new header */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              간단한 설치 과정
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              단 3단계만으로 Notia를 바로 시작할 수 있습니다. 다운로드 후 파일을
              실행하고 로그인하면 모든 준비가 끝납니다.
            </p>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-700 -translate-y-1/2 hidden md:block" />
            {installationSteps.map((step) => (
              <div
                key={step.step}
                className="relative flex flex-col items-center text-center"
              >
                <div className="w-12 h-12 rounded-full bg-[#61C9A8] text-white flex items-center justify-center text-xl font-bold border-4 border-slate-50 dark:border-slate-900">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold mt-4 mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <Tabs
          value={selectedId}
          onValueChange={setSelectedId}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            {platformData.map((platform) => (
              <TabsTrigger
                key={platform.id}
                value={platform.id}
                className="data-[state=active]:bg-[#61C9A8] data-[state=active]:text-white"
              >
                {platform.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <AnimatePresence mode="wait">
            {platformData.map((platform) =>
              selectedId === platform.id ? (
                <motion.div
                  key={platform.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="mt-6"
                >
                  <Card>
                    <CardContent className="p-6 sm:p-8 text-center">
                      <div className="flex flex-col items-center">
                        <OsIcon name={platform.id} />
                        <h3 className="text-2xl font-semibold mb-2">
                          Notia for {platform.label}
                        </h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                          {platform.description}
                        </p>

                        <div className="flex flex-wrap justify-center gap-3 mb-6">
                          <Badge variant="outline">
                            최신 버전: {platform.version}
                          </Badge>
                          <Badge variant="outline">
                            업데이트: {platform.lastUpdate}
                          </Badge>
                          <a
                            href="/changelog"
                            className="text-xs text-[#61C9A8] hover:underline self-center"
                          >
                            변경 사항 보기
                          </a>
                        </div>

                        <div className="space-y-2 mb-8 text-left w-full max-w-xs mx-auto">
                          {platform.requirements.map((req, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-3 text-sm text-muted-foreground"
                            >
                              <Checkmark />
                              <span>{req}</span>
                            </div>
                          ))}
                        </div>

                        <Button
                          size="lg"
                          className="bg-[#61C9A8] hover:bg-[#61C9A8]/90 w-full max-w-xs"
                          asChild={platform.id === 'PWA'}
                        >
                          <a href={platform.download.link}>
                            {platform.download.label}
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : null,
            )}
          </AnimatePresence>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default DownloadPage;
