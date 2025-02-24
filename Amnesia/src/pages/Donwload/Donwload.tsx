import React from 'react';
import { Monitor, Smartphone, Chrome } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const platforms = [
  { 
    id: 'desktop',
    label: '데스크탑',
    icon: <Monitor className="w-5 h-5" />,
    description: '윈도우와 맥OS를 위한 네이티브 앱'
  },
  { 
    id: 'mobile',
    label: '모바일',
    icon: <Smartphone className="w-5 h-5" />,
    description: 'iOS와 안드로이드를 위한 모바일 앱'
  },
  { 
    id: 'browser',
    label: '브라우저 확장 프로그램',
    icon: <Chrome className="w-5 h-5" />,
    description: '크롬, 파이어폭스, 엣지를 위한 확장 프로그램'
  }
];

export const DownloadPage: React.FC = () => {
  const [selectedPlatform, setSelectedPlatform] = React.useState('desktop');

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-xl font-bold">Your Logo</div>
          <Button style={{ backgroundColor: '#61C9A8' }}>
            무료로 시작하기
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
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
              src="/api/placeholder/400/300"
              alt="Platform devices"
              className="mx-auto rounded-lg shadow-lg"
            />
          </motion.div>
          <h1 className="text-4xl font-bold mb-4">
            원도우용 Your App
          </h1>
          <Badge variant="secondary" className="mb-8 bg-red-100 text-red-600 hover:bg-red-200">
            원도우용 다운로드
          </Badge>
          <p className="text-gray-600 mb-8 text-lg">
            모든 기기를 위한 수상 받은 앱
          </p>
        </motion.div>

        {/* Platform Selection */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs
            defaultValue="desktop"
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
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">
                    {platforms.find(p => p.id === selectedPlatform)?.label}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {platforms.find(p => p.id === selectedPlatform)?.description}
                  </p>
                  <Button 
                    size="lg"
                    style={{ backgroundColor: '#61C9A8' }}
                    className="w-full md:w-auto"
                  >
                    다운로드
                  </Button>
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
                  "강력한 보안 기능"
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

      {/* Footer */}
      <footer className="bg-gray-50 mt-12 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-center text-gray-500 text-sm">
            © 2024 Your Company Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};