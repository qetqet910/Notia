import React from 'react';
import { Monitor, Smartphone, Chrome } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// ✨ qrcode.react에서 QRCodeSVG를 직접 import 합니다.
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/layout/header';
import { Footer } from '@/layout/footer';
import { Toaster } from '@/components/ui/toaster';

// 데이터는 이전과 동일합니다.
const platformData = [
  {
    id: 'Windows',
    label: 'Windows',
    icon: <Monitor className="w-5 h-5" />,
    image: 'https://placehold.co/900/61C9A8/ffffff?text=Windows+App',
    version: 'v1.2.0',
    lastUpdate: '2025년 7월 8일',
    description:
      'Windows 10/11에 최적화된 데스크톱 앱으로 가장 강력한 기능을 모두 사용해 보세요.',
    requirements: [
      'Windows 10 64-bit 이상',
      '4GB RAM 이상 권장',
      '150MB 디스크 공간',
    ],
    mainDownload: { label: '다운로드', link: '#' },
  },
  {
    id: 'macOS',
    label: 'macOS',
    icon: <Monitor className="w-5 h-5" />,
    image: 'https://placehold.co/900/333333/ffffff?text=macOS+App',
    version: 'v1.2.0',
    lastUpdate: '2025년 7월 8일',
    description:
      'Mac 환경에 완벽하게 통합된 데스크톱 앱으로 부드러운 사용성을 경험하세요.',
    requirements: [
      'macOS 12 Monterey 이상',
      'Apple Silicon / Intel 프로세서 지원',
      '120MB 디스크 공간',
    ],
    mainDownload: { label: 'Apple Silicon 다운로드', link: '#' },
  },
  {
    id: 'Mobile',
    label: '모바일 (PWA)',
    icon: <Smartphone className="w-5 h-5" />,
    image: 'https://placehold.co/900/4A90E2/ffffff?text=Mobile+PWA',
    version: 'v1.2.0',
    lastUpdate: '2025년 7월 8일',
    description:
      '앱처럼 설치하여 사용하는 PWA입니다. 모바일에서 가장 가볍고 빠른 노트 경험을 제공합니다.',
    requirements: [
      '최신 버전의 Chrome, Safari, 삼성 인터넷',
      '홈 화면에 추가하여 사용',
      '오프라인 사용 지원',
    ],
    mainDownload: { label: '홈 화면에 추가하기', action: 'pwa' },
    qrCode: 'https://your-app-url.com',
  },
  {
    id: 'Chrome',
    label: 'Chrome 확장',
    icon: <Chrome className="w-5 h-5" />,
    image: 'https://placehold.co/900/F2BD42/ffffff?text=Chrome+Extension',
    version: 'v1.2.0',
    lastUpdate: '2025년 7월 8일',
    description:
      '웹 서핑 중 발견한 아이디어나 정보를 클릭 한 번으로 빠르게 저장하세요.',
    requirements: [
      'Chrome 88 이상',
      'Chromium 기반 브라우저 지원 (Edge, Brave 등)',
      '브라우저와 완벽 연동',
    ],
    mainDownload: {
      label: 'Chrome 웹 스토어에서 추가',
      link: 'https://chrome.google.com/webstore',
    },
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
  const currentPlatform =
    platformData.find((p) => p.id === selectedId) || platformData[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Toaster />
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-12 mt-12">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* ✨ UI 움직임 방지를 위한 수정 */}
          <div className="w-full aspect-[21/9] bg-slate-200 dark:bg-slate-800 rounded-lg shadow-lg mb-8 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentPlatform.id}
                src={currentPlatform.image}
                alt={`${currentPlatform.label} 미리보기`}
                className="w-full h-full object-cover" // 이미지가 컨테이너를 꽉 채우도록
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              />
            </AnimatePresence>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            어떤 환경에서든 최고의 노트를.
          </h1>
          <p className="text-muted-foreground">
            당신의 모든 기기에서 생각을 기록하고, 관리하고, 성장시키세요.
          </p>
        </motion.div>

        {/* ...Tabs... */}
        <div className="mb-12">
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
                  <div className="flex items-center gap-2">
                    {platform.icon}
                    <span className="hidden md:inline">{platform.label}</span>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentPlatform.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-start gap-8">
                  <div className="flex-1">
                    {/* ... 플랫폼 정보, 버튼 등 ... */}
                    <h3 className="text-2xl font-semibold mb-2">
                      {currentPlatform.label}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {currentPlatform.description}
                    </p>

                    <div className="flex flex-wrap gap-3 mb-6">
                      <Badge variant="outline">
                        최신 버전: {currentPlatform.version}
                      </Badge>
                      <Badge variant="outline">
                        업데이트: {currentPlatform.lastUpdate}
                      </Badge>
                      <a
                        href="/changelog"
                        className="text-xs text-[#61C9A8] hover:underline self-center"
                      >
                        변경 사항 보기
                      </a>
                    </div>

                    <div className="space-y-2 mb-6">
                      {currentPlatform.requirements.map((req, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <Checkmark />
                          <span>{req}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <Button
                        size="lg"
                        className="bg-[#61C9A8] hover:bg-[#61C9A8]/90 w-full sm:w-auto"
                      >
                        {currentPlatform.mainDownload.label}
                      </Button>
                    </div>
                  </div>

                  <div className="w-full md:w-36 flex-shrink-0">
                    {currentPlatform.id === 'Mobile' ? (
                      <div className="border p-2 rounded-md bg-white">
                        {/* ✨ QRCode -> QRCodeSVG로 수정 */}
                        <QRCodeSVG
                          value={currentPlatform.qrCode || ''}
                          size={128}
                          className="w-full h-full"
                        />
                        <p className="text-xs text-center mt-2 text-muted-foreground">
                          스캔하여 바로 사용
                        </p>
                      </div>
                    ) : (
                      <div className="w-full aspect-video bg-slate-100 rounded-md border shadow-sm overflow-hidden">
                        <img
                          src={currentPlatform.image}
                          alt={`${currentPlatform.label} 미니 프리뷰`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ... footer ... */}
      <Footer />
    </div>
  );
};
