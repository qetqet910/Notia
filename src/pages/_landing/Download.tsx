import React from 'react';
import { FaWindows, FaApple } from 'react-icons/fa';
import { FcLinux } from 'react-icons/fc';
import { IoGlobeOutline, IoShareOutline } from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Toaster } from '@/components/ui/toaster';
import { usePwaStore } from '@/stores/pwaStore';
import { changelogData } from '@/constants/changeLog';
import { useAuthStore } from '@/stores/authStore';
import { Navigate } from 'react-router-dom';

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
    case 'Mobile / Desktop':
      return <IoGlobeOutline {...iconProps} />;
    default:
      return null;
  }
};

const platformData = [
  {
    id: 'Windows',
    label: 'Windows',
    description:
      'Windows 10/11에 최적화된 데스크톱 앱으로 가장 강력한 기능을 모두 사용해 보세요.',
    download: {
      label: 'Download for Windows',
      link: 'https://github.com/qetqet910/Notia/releases/download/v1.0.0/Notia_1.0.0_x64-setup.exe',
    },
  },
  {
    id: 'macOS',
    label: 'macOS',
    description:
      'Mac 환경에 완벽하게 통합된 데스크톱 앱으로 부드러운 사용성을 경험하세요.',
    download: {
      label: 'Download for macOS',
      link: 'https://github.com/qetqet910/Notia/releases/download/v1.0.0/Notia_universal.app.tar.gz',
    },
  },
  {
    id: 'Linux',
    label: 'Linux',
    description:
      '다양한 배포판을 지원하는 Linux용 데스크톱 앱입니다. .AppImage 또는 .deb 패키지로 제공됩니다.',
    download: {
      label: 'Download for Linux (.AppImage)',
      link: 'https://github.com/qetqet910/Notia/releases/download/v1.0.0/Notia_1.0.0_amd64.AppImage',
    },
  },
  {
    id: 'Mobile / Desktop',
    label: 'Mobile / Desktop',
    description:
      '설치 없이 웹에서 바로 사용하거나, 홈 화면에 추가하여 앱처럼 사용할 수 있습니다.',
    download: {
      label: '앱 설치',
      link: '#',
    },
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

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const DownloadPage: React.FC = () => {
  const [selectedId, setSelectedId] = React.useState(platformData[0].id);
  const { deferredPrompt, setDeferredPrompt } = usePwaStore();
  const [isIOS, setIsIOS] = React.useState(false);
  const { user } = useAuthStore();

  React.useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
  }, []);

  const handlePwaInstall = async () => {
    if (deferredPrompt) {
      const promptEvent = deferredPrompt as BeforeInstallPromptEvent;
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  // 1. Redirect Logic
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-['Orbit']">
      <Toaster />
      <Header />

      <main className="max-w-4xl mx-auto px-4 pt-24 pb-16 sm:pt-32 sm:pb-24">
        {/* Installation Guide Section */}
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
            <div className="absolute top-[56%] left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-700 -translate-y-1/2 hidden md:block" />
            {installationSteps.map((step) => (
              <div
                key={step.step}
                className="relative flex flex-col items-center text-center"
              >
                <div className="w-12 h-12 rounded-full bg-[#61C9A8] text-white flex items-center justify-center text-xl font-bold border-4 border-slate-50 dark:border-slate-900 shadow-sm">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold mt-4 mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <Tabs
          value={selectedId}
          onValueChange={setSelectedId}
          className="w-full"
        >
          <TabsList className="flex flex-wrap justify-around w-full bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl">
            {platformData.map((platform) => (
              <TabsTrigger
                key={platform.id}
                value={platform.id}
                className="data-[state=active]:bg-[#61C9A8] data-[state=active]:text-white rounded-lg transition-all duration-300"
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
                  <Card className="border-none shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-3xl">
                    <CardContent className="p-8 sm:p-12 text-center">
                      <div className="flex flex-col items-center">
                        <OsIcon name={platform.id} />
                        <h3 className="text-2xl sm:text-3xl font-bold mb-2">
                          Notia for {platform.label}
                        </h3>
                        <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
                          {platform.description}
                        </p>

                        <div className="flex flex-wrap justify-center gap-3 mb-12">
                          <Badge variant="secondary" className="px-3 py-1">
                            최신 버전: {changelogData[0].version}
                          </Badge>
                          <Badge variant="secondary" className="px-3 py-1">
                            최근 업데이트: {changelogData[0].date}
                          </Badge>
                          <a
                            href="/changelog"
                            className="text-xs text-[#61C9A8] font-semibold hover:underline self-center"
                          >
                            변경 사항 보기
                          </a>
                        </div>

                        {platform.id === 'Mobile / Desktop' ? (
                          isIOS ? (
                            <div className="w-full max-w-xs text-center p-6 bg-[#61C9A8]/10 rounded-2xl border border-[#61C9A8]/20">
                              <h4 className="font-bold mb-2 text-[#61C9A8]">
                                iOS에서 설치하는 방법
                              </h4>
                              <p className="text-sm text-slate-600 dark:text-slate-300">
                                Safari 브라우저의 하단 공유 버튼
                                <br />
                                ( <IoShareOutline className="inline h-4 w-4 mx-1" />)
                                을 탭한 후,
                                <br />
                                <strong>`홈 화면에 추가`</strong>를 선택하세요.
                              </p>
                            </div>
                          ) : (
                            <>
                              <Button
                                size="lg"
                                className="bg-[#61C9A8] hover:bg-[#52a38a] w-full max-w-xs h-14 text-lg rounded-2xl shadow-lg shadow-[#61C9A8]/30 transition-all hover:-translate-y-1"
                                onClick={handlePwaInstall}
                                disabled={!deferredPrompt}
                              >
                                {platform.download.label}
                              </Button>
                              {!deferredPrompt && (
                                <p className="text-xs text-muted-foreground mt-4 font-medium">
                                  이미 설치되었거나 메뉴를 통해 설치할 수 있습니다.
                                </p>
                              )}
                            </>
                          )
                        ) : (
                          <Button
                            size="lg"
                            className="bg-[#61C9A8] hover:bg-[#52a38a] w-full max-w-xs h-14 text-lg rounded-2xl shadow-lg shadow-[#61C9A8]/30 transition-all hover:-translate-y-1"
                            asChild
                          >
                            <a href={platform.download.link} target="_blank" rel="noopener noreferrer">
                              {platform.download.label}
                            </a>
                          </Button>
                        )}
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