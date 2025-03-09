import React from 'react';
import { Monitor, Smartphone, Chrome } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Header } from '@/components/ui/_Header';

import logoImage from "@/stores/Logo.png";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const platforms = [
  { 
    id: 'Windows',
    label: '윈도우',
    icon: <Monitor className="w-5 h-5" />,
    description: '윈도우를 위한 웹앱'
  },
  { 
    id: 'Mobile',
    label: '모바일',
    icon: <Smartphone className="w-5 h-5" />,
    description: '모바일 기기를 위한 모바일 앱'
  },
  { 
    id: 'Chrome Browser Extension',
    label: '브라우저 확장 프로그램',
    icon: <Chrome className="w-5 h-5" />,
    description: '크롬을 위한 확장 프로그램'
  }
];

export const DownloadPage: React.FC = () => {
  const [selectedPlatform, setSelectedPlatform] = React.useState('Windows');

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12 mt-16">
        {/* Hero Section */}
        <motion.div 
          className="text-center mb-12"
          initial="initial"
          animate="animate"
          variants={fadeIn}
        >
          <motion.div 
            className="mb-8"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <img 
              src="https://placehold.co/900x380"
              alt="각 플랫폼별 미리보기 화면"
              className="mx-auto rounded-lg shadow-lg"
            />
          </motion.div>
          <h1 className="text-4xl font-bold mb-4">
            오늘을 기억하자, 내일을 기록하자 
          </h1>
          <Badge variant="secondary" className="mb-8 bg-red-100 text-red-600 hover:bg-red-200">
            모두의 리마인더
          </Badge>
        </motion.div>

        {/* Platform Selection */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs
            defaultValue='Windows'
            className="w-full"
            onValueChange={setSelectedPlatform}
          >
            <TabsList className="grid w-full grid-cols-3">
              {platforms.map((platform) => (
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
        </motion.div>

        {/* Platform Details */}
        <motion.div
          key={selectedPlatform}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
          <CardContent className="p-6">
  <div className="flex flex-col md:flex-row items-start gap-6">
    <div className="flex-1">
      <h3 className="text-xl font-semibold mb-2">
        {platforms.find(p => p.id === selectedPlatform)?.label}
      </h3>
      <p className="text-gray-600 mb-4">
        {platforms.find(p => p.id === selectedPlatform)?.description}
      </p>
      
      {/* Version and last update information */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Badge variant="outline" className="flex items-center gap-1">
          <span className="text-xs">최신 버전:</span> 
          <span className="font-medium">
            {selectedPlatform === 'Windows' ? 'v2.5.1' : 
             selectedPlatform === 'Mobile' ? 'v2.4.3' : 'v1.8.0'}
          </span>
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1">
          <span className="text-xs">최근 업데이트:</span> 
          <span className="font-medium">
            {selectedPlatform === 'Windows' ? '2025년 2월 10일' : 
             selectedPlatform === 'Mobile' ? '2025년 1월 25일' : '2025년 2월 15일'}
          </span>
        </Badge>
      </div>

      {/* Platform-specific details */}
      <div className="space-y-3 mb-5">
        {selectedPlatform === 'Windows' && (
          <>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#61C9A8] flex items-center justify-center">
                <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <span className="text-sm">Windows 10 이상 지원</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#61C9A8] flex items-center justify-center">
                <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <span className="text-sm">필요 디스크 공간: 150MB</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#61C9A8] flex items-center justify-center">
                <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <span className="text-sm">설치 후 바로 실행 가능</span>
            </div>
          </>
        )}
        
        {selectedPlatform === 'Mobile' && (
          <>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#61C9A8] flex items-center justify-center">
                <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <span className="text-sm">Android 8.0 이상 / iOS 14.0 이상</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#61C9A8] flex items-center justify-center">
                <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <span className="text-sm">앱 용량: 35MB (Android) / 42MB (iOS)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#61C9A8] flex items-center justify-center">
                <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <span className="text-sm">오프라인 모드 지원</span>
            </div>
          </>
        )}
        
        {selectedPlatform === 'Chrome Browser Extension' && (
          <>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#61C9A8] flex items-center justify-center">
                <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <span className="text-sm">Chrome 88 이상 지원</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#61C9A8] flex items-center justify-center">
                <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <span className="text-sm">확장 프로그램 크기: 5MB</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#61C9A8] flex items-center justify-center">
                <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <span className="text-sm">브라우저와 완벽 연동</span>
            </div>
          </>
        )}
      </div>

      {/* Download buttons with options */}
      <div className="space-y-3">
        <Button 
          size="lg"
          style={{ backgroundColor: '#61C9A8' }}
          className="w-full md:w-auto"
        >
          {selectedPlatform === 'Windows' ? '다운로드 (64비트)' : 
           selectedPlatform === 'Mobile' ? '앱 다운로드' : '크롬 스토어에서 설치'}
        </Button>
        
        {selectedPlatform === 'Windows' && (
          <div className="mt-2 flex items-center gap-2">
            <Button 
              variant="outline"
              size="sm"
              className="text-xs"
            >
              32비트 다운로드
            </Button>
            <Button 
              variant="outline"
              size="sm"
              className="text-xs"
            >
              포터블 버전
            </Button>
          </div>
        )}
        
        {selectedPlatform === 'Mobile' && (
          <div className="mt-2 flex items-center gap-2">
            <Button 
              variant="outline"
              size="sm"
              className="text-xs flex items-center gap-1"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12H19M12 5v14"/>
              </svg>
              Play 스토어
            </Button>
            <Button 
              variant="outline"
              size="sm"
              className="text-xs flex items-center gap-1"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"/>
              </svg>
              App Store
            </Button>
          </div>
        )}
      </div>
    </div>
    
    {/* QR code or screenshot for mobile/visual reference */}
    <div className="hidden md:block w-32 mt-4 md:mt-0">
      {selectedPlatform === 'Mobile' ? (
        <div className="border border-gray-200 p-2 rounded-md">
          <div className="bg-gray-100 w-full aspect-square flex items-center justify-center">
            <span className="text-xs text-gray-500">QR 코드</span>
          </div>
          <p className="text-xs text-center mt-2">모바일 다운로드</p>
        </div>
      ) : (
        <div className="rounded-md overflow-hidden border border-gray-200">
          <div className="bg-gray-100 w-full aspect-video flex items-center justify-center">
            <span className="text-xs text-gray-500">미리보기</span>
          </div>
        </div>
      )}
    </div>
  </div>
  
  {/* System requirements or additional information */}
  <div className="mt-6 pt-4 border-t border-gray-200">
    <h4 className="text-sm font-medium mb-2">추가 정보</h4>
    <div className="text-xs text-gray-500 space-y-1">
      {selectedPlatform === 'Windows' && (
        <>
          <p>• 최소 사양: Windows 10 이상, 2GB RAM, 150MB 디스크 공간</p>
          <p>• 설치 파일은 디지털 서명이 되어 있으며 바이러스 검사를 완료했습니다.</p>
          <p>• 설치 중 문제가 발생하면 <span className="text-[#61C9A8]">support@amnesia.kr</span>로 문의해 주세요.</p>
        </>
      )}
      {selectedPlatform === 'Mobile' && (
        <>
          <p>• Android: Android 8.0 이상, 100MB 여유 공간</p>
          <p>• iOS: iOS 14.0 이상, 호환 기기: iPhone 8 이상</p>
          <p>• 로그인하면 모든 기기에서 데이터가 동기화됩니다.</p>
        </>
      )}
      {selectedPlatform === 'Chrome Browser Extension' && (
        <>
          <p>• Chrome, Edge, Brave 등 Chromium 기반 브라우저 지원</p>
          <p>• 브라우저 권한: 탭 접근, 스토리지 접근</p>
          <p>• 설치 후 브라우저를 재시작하는 것을 권장합니다.</p>
        </>
      )}
    </div>
  </div>
</CardContent>
          </Card>
        </motion.div>

        {/* Features Section */}
        <motion.div 
          className="mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">주요 기능</h3>
              <div className="space-y-4">
                {[
                  "직관적인 사용자 인터페이스",
                  "크로스 플랫폼 동기화",
                  "강력한 보안 기능",
                  "오프라인 상태에서 사용"
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-5 h-5 rounded-full bg-[#61C9A8] flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span>{feature}</span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <footer className="bg-gray-50 mt-12 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} HyeonMin Kim. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};