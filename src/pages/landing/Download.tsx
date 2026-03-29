import React, { useState, useEffect } from 'react';
import { FaWindows, FaApple } from 'react-icons/fa';
import { FcLinux } from 'react-icons/fc';
import { IoGlobeOutline, IoShareOutline } from 'react-icons/io5';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Header } from "@/components/layout/landing/Header";
import { Footer } from "@/components/layout/landing/Footer";
import { Toaster } from '@/components/ui/toaster';
import { usePwaStore } from '@/stores/pwaStore';
import { changelogData } from '@/constants/changeLog';
import { useAuthStore } from '@/stores/authStore';
import { Navigate } from 'react-router-dom';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';

// OS 아이콘 컴포넌트
const OsIcon = ({ name }: { name: string }) => {
  const iconProps = { className: 'w-10 h-10 mb-4 text-toss-gray' };
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

interface ReleaseAsset {
  name: string;
  browser_download_url: string;
}

interface GithubRelease {
  tag_name: string;
  published_at: string;
  assets: ReleaseAsset[];
}

const useLatestRelease = () => {
  const [release, setRelease] = useState<GithubRelease | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://api.github.com/repos/qetqet910/Notia/releases/latest')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch release');
        return res.json();
      })
      .then((data) => {
        setRelease(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch latest release:', err);
        setLoading(false);
      });
  }, []);

  return { release, loading };
};

export const DownloadPage: React.FC = () => {
  const [selectedId, setSelectedId] = React.useState('Windows');
  const { deferredPrompt, setDeferredPrompt } = usePwaStore();
  const [isIOS, setIsIOS] = React.useState(false);
  const { user } = useAuthStore();
  const { release, loading } = useLatestRelease();

  React.useEffect(() => {
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
  }, []);

  const handlePwaInstall = async () => {
    if (deferredPrompt) {
      const promptEvent = deferredPrompt as unknown as BeforeInstallPromptEvent;
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const getDownloadLink = (os: string) => {
    const defaultLinks = {
      Windows: 'https://github.com/qetqet910/Notia/releases/latest/download/Notia_x64-setup.exe',
      macOS: 'https://github.com/qetqet910/Notia/releases/latest/download/Notia_universal.app.tar.gz',
      Linux: 'https://github.com/qetqet910/Notia/releases/latest/download/Notia_amd64.AppImage',
    };

    if (!release) return defaultLinks[os as keyof typeof defaultLinks] || '#';

    const assets = release.assets;
    let asset;

    if (os === 'Windows') {
      asset = assets.find(a => a.name.endsWith('.exe') && !a.name.includes('sig'));
    } else if (os === 'macOS') {
      asset = assets.find(a => (a.name.endsWith('.dmg') || a.name.endsWith('.app.tar.gz')) && !a.name.includes('sig'));
    } else if (os === 'Linux') {
      asset = assets.find(a => a.name.endsWith('.AppImage') && !a.name.includes('sig'));
    }

    return asset ? asset.browser_download_url : defaultLinks[os as keyof typeof defaultLinks];
  };

  const platformData = [
    {
      id: 'Windows',
      label: 'Windows',
      description: 'Windows 10/11에 최적화된 데스크톱 앱으로 가장 강력한 기능을 모두 사용해 보세요.',
      downloadLabel: 'Download for Windows',
    },
    {
      id: 'macOS',
      label: 'macOS',
      description: 'Mac 환경에 완벽하게 통합된 데스크톱 앱으로 부드러운 사용성을 경험하세요.',
      downloadLabel: 'Download for macOS',
    },
    {
      id: 'Linux',
      label: 'Linux',
      description: '다양한 배포판을 지원하는 Linux용 데스크톱 앱입니다. .AppImage 패키지로 제공됩니다.',
      downloadLabel: 'Download for Linux (.AppImage)',
    },
    {
      id: 'Mobile / Desktop',
      label: 'Mobile / Desktop',
      description: '설치 없이 웹에서 바로 사용하거나, 홈 화면에 추가하여 앱처럼 사용할 수 있습니다.',
      downloadLabel: '앱 설치',
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

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-white">
      <Toaster />
      <Header />

      <main className="max-w-4xl mx-auto px-4 pt-32 pb-16 sm:pt-40 sm:pb-24">
        {/* Installation Guide Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-toss-dark">
              간단한 설치 과정
            </h1>
            <p className="text-lg text-toss-gray max-w-2xl mx-auto">
              단 3단계만으로 Notia를 바로 시작할 수 있습니다. 다운로드 후 파일을
              실행하고 로그인하면 모든 준비가 끝납니다.
            </p>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="absolute top-[56%] left-0 w-full h-0.5 bg-toss-border -translate-y-1/2 hidden md:block" />
            {installationSteps.map((step) => (
              <div
                key={step.step}
                className="relative flex flex-col items-center text-center"
              >
                <div className="w-12 h-12 rounded-full bg-notia-primary text-white flex items-center justify-center text-xl font-bold border-4 border-white shadow-toss">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold mt-4 mb-2 text-toss-dark">
                  {step.title}
                </h3>
                <p className="text-toss-gray text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <Tabs
          value={selectedId}
          onValueChange={setSelectedId}
          className="w-full"
        >
          <TabsList className="flex flex-wrap justify-around w-full bg-toss-lightGray/50 p-1 rounded-toss-lg">
            {platformData.map((platform) => (
              <TabsTrigger
                key={platform.id}
                value={platform.id}
                className="data-[state=active]:bg-notia-primary data-[state=active]:text-white rounded-toss transition-all duration-300"
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
                  <Card className="border-none shadow-toss-lg bg-white rounded-toss-xl">
                    <CardContent className="p-8 sm:p-12 text-center">
                      <div className="flex flex-col items-center">
                        <OsIcon name={platform.id} />
                        <h3 className="text-2xl sm:text-3xl font-bold mb-2 text-toss-dark">
                          Notia for {platform.label}
                        </h3>
                        <p className="text-toss-gray mb-8 max-w-md mx-auto leading-relaxed">
                          {platform.description}
                        </p>

                        <div className="flex flex-wrap justify-center gap-3 mb-12">
                          <Badge variant="secondary" className="px-3 py-1 bg-toss-lightGray text-toss-dark border-none">
                            최신 버전: {release ? release.tag_name : (loading ? 'Loading...' : changelogData[0].version)}
                          </Badge>
                          <Badge variant="secondary" className="px-3 py-1 bg-toss-lightGray text-toss-dark border-none">
                            최근 업데이트: {release ? new Date(release.published_at).toLocaleDateString() : (loading ? 'Loading...' : changelogData[0].date)}
                          </Badge>
                          <a
                            href="/changelog"
                            className="text-xs text-notia-primary font-semibold hover:underline self-center"
                          >
                            변경 사항 보기
                          </a>
                        </div>

                        {platform.id === 'Mobile / Desktop' ? (
                          isIOS ? (
                            <div className="w-full max-w-xs text-center p-6 bg-notia-primary/10 rounded-toss-lg border border-notia-primary/20">
                              <h4 className="font-bold mb-2 text-notia-primary">
                                iOS에서 설치하는 방법
                              </h4>
                              <p className="text-sm text-toss-gray">
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
                                className="bg-notia-primary hover:bg-notia-hover w-full max-w-xs h-12 text-base rounded-toss-lg shadow-toss hover:shadow-toss-lg transition-all duration-300 hover:-translate-y-0.5"
                                onClick={handlePwaInstall}
                                disabled={!deferredPrompt}
                              >
                                {platform.downloadLabel}
                              </Button>
                              {!deferredPrompt && (
                                <p className="text-xs text-toss-light mt-4 font-medium">
                                  이미 설치되었거나 메뉴를 통해 설치할 수 있습니다.
                                </p>
                              )}
                            </>
                          )
                        ) : (
                          <Button
                            size="lg"
                            className="bg-notia-primary hover:bg-notia-hover w-full max-w-xs h-12 text-base rounded-toss-lg shadow-toss hover:shadow-toss-lg transition-all duration-300 hover:-translate-y-0.5"
                            asChild
                            disabled={loading}
                          >
                            <a href={getDownloadLink(platform.id)} target="_blank" rel="noopener noreferrer">
                              {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : (
                                platform.downloadLabel
                              )}
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
