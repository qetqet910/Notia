import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Check from 'lucide-react/dist/esm/icons/check';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Zap from 'lucide-react/dist/esm/icons/zap';
import Shield from 'lucide-react/dist/esm/icons/shield';

import { Toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/landing/Header';
import { Footer } from '@/components/layout/landing/Footer';

// LandingEditor는 뷰포트 진입 시 lazy-load됨
const LazyLandingEditor = React.lazy(() => 
  import('@/components/features/landing/LandingEditor').then(m => ({ default: m.LandingEditor }))
);

import { useAuthStore } from '@/stores/authStore';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { faqItems } from '@/constants/home';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import landingAnimation from '/lottie/landingAnimation.lottie';

// --- Toss Style Animation Variants ---
const tossFadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  }
};

const tossStagger = {
  visible: {
    transition: { staggerChildren: 0.1 }
  }
};

// --- Main Component ---

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [showEditor, setShowEditor] = useState(false);

  // 1. Redirect Logic
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-white text-toss-dark selection:bg-notia-primary/20 selection:text-toss-dark overflow-x-hidden">
      <Toaster />
      <Header />

      <main>
        {/* Hero Section - Toss Style */}
        <section className="relative min-h-screen flex items-center px-6 lg:px-12 overflow-hidden bg-white">
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#F9FAFB_1px,transparent_1px),linear-gradient(to_bottom,#F9FAFB_1px,transparent_1px)] bg-[size:4rem_4rem]" />
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-notia-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-toss-blue/5 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center w-full py-20 md:py-0">
            {/* Hero Text */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={tossStagger}
              className="space-y-8 text-center md:text-left"
            >
              <motion.div variants={tossFadeIn} className="space-y-4">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-notia-primary/10 text-notia-primary text-sm font-medium">
                  <Sparkles className="w-4 h-4" />
                  새로운 생산성의 시작
                </span>
              </motion.div>

              <motion.h1 
                variants={tossFadeIn}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.3] break-keep text-toss-dark"
              >
                기억의 조각을<br/>
                <span className="text-notia-primary">연결하세요</span>
              </motion.h1>

              <motion.p 
                variants={tossFadeIn}
                className="text-lg md:text-xl text-toss-gray max-w-lg mx-auto md:mx-0 leading-relaxed break-keep"
              >
                #태그와 @리마인더로 하나의 노트에서<br className="hidden sm:block"/>
                체계적으로 정리하고, 스케줄을 관리하세요.
              </motion.p>

              <motion.div 
                variants={tossFadeIn}
                className="flex flex-wrap gap-4 justify-center md:justify-start"
              >
                <Button
                  size="lg"
                  className="h-14 px-8 text-base font-medium bg-notia-primary hover:bg-notia-hover text-white rounded-toss-lg shadow-toss hover:shadow-toss-lg transition-all duration-300 hover:-translate-y-0.5"
                  onClick={() => navigate('/login')}
                >
                  지금 바로 시작하기
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-8 text-base font-medium rounded-toss-lg border-toss-border text-toss-dark hover:bg-toss-lightGray hover:border-toss-gray transition-all duration-300"
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  더 알아보기
                </Button>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div 
                variants={tossFadeIn}
                className="flex flex-wrap items-center gap-6 justify-center md:justify-start pt-4"
              >
                <div className="flex items-center gap-2 text-sm text-toss-light">
                  <Check className="w-4 h-4 text-notia-primary" />
                  평생 무료
                </div>
                <div className="flex items-center gap-2 text-sm text-toss-light">
                  <Check className="w-4 h-4 text-notia-primary" />
                  데이터 암호화
                </div>
                <div className="flex items-center gap-2 text-sm text-toss-light">
                  <Check className="w-4 h-4 text-notia-primary" />
                  모든 기기 동기화
                </div>
              </motion.div>
            </motion.div>

            {/* Hero Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="hidden md:flex items-center justify-center"
            >
              <div className="relative w-full max-w-[500px] aspect-square">
                <DotLottieReact
                  src={landingAnimation}
                  loop
                  autoplay
                  className="w-full h-full"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section - Toss Style */}
        <section id="features" className="py-24 sm:py-32 px-6 bg-toss-lightGray">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={tossStagger}
              className="text-center mb-16"
            >
              <motion.h2 
                variants={tossFadeIn}
                className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 text-toss-dark"
              >
                단 하나의 앱으로
              </motion.h2>
              <motion.p 
                variants={tossFadeIn}
                className="text-lg text-toss-gray max-w-2xl mx-auto"
              >
                완벽한 워크플로우를 완성하세요
              </motion.p>
            </motion.div>

            {/* Feature Cards - Toss Style */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={tossStagger}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {/* Feature 1 */}
              <motion.div
                variants={tossFadeIn}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-white rounded-toss-xl p-8 shadow-toss hover:shadow-toss-lg transition-all duration-300 border border-toss-border/50"
              >
                <div className="w-12 h-12 bg-notia-primary/10 rounded-toss flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6 text-notia-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-toss-dark">강력한 마크다운 에디터</h3>
                <p className="text-toss-gray leading-relaxed">
                  복잡한 설정 없이 바로 쓰세요. 코드 하이라이팅, 실시간 프리뷰, 드래그 앤 드롭 이미지 업로드까지.
                </p>
              </motion.div>

              {/* Feature 2 */}
              <motion.div
                variants={tossFadeIn}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-toss-dark rounded-toss-xl p-8 shadow-toss-lg text-white"
              >
                <div className="w-12 h-12 bg-white/10 rounded-toss flex items-center justify-center mb-6">
                  <Sparkles className="w-6 h-6 text-notia-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">자동 일정 관리</h3>
                <p className="text-white/70 leading-relaxed">
                  노트에 적은 날짜는 자동으로 캘린더에 등록됩니다. 놓치는 일정이 없습니다.
                </p>
              </motion.div>

              {/* Feature 3 */}
              <motion.div
                variants={tossFadeIn}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-white rounded-toss-xl p-8 shadow-toss hover:shadow-toss-lg transition-all duration-300 border border-toss-border/50"
              >
                <div className="w-12 h-12 bg-toss-blue/10 rounded-toss flex items-center justify-center mb-6">
                  <Shield className="w-6 h-6 text-toss-blue" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-toss-dark">스마트 태그</h3>
                <p className="text-toss-gray leading-relaxed">
                  폴더의 한계를 넘어서세요. 직관적인 태그 시스템으로 노트를 다차원적으로 연결합니다.
                </p>
              </motion.div>
            </motion.div>

            {/* Performance Comparison - Toss Style */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={tossFadeIn}
              className="mt-12 bg-white rounded-toss-xl p-8 shadow-toss border border-toss-border/50"
            >
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-3 text-toss-dark">압도적인 퍼포먼스</h3>
                  <p className="text-toss-gray leading-relaxed">
                    Tauri 기반으로 제작되어, 상상 이상의 가벼움과 속도를 자랑합니다.
                  </p>
                </div>
                <div className="flex-1 w-full max-w-md space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-toss-dark">Notia</span>
                      <span className="text-notia-primary">0.5s</span>
                    </div>
                    <div className="h-3 bg-toss-lightGray rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: '95%' }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full bg-notia-primary rounded-full"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 opacity-50">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-toss-gray">다른 앱들</span>
                      <span className="text-toss-light">2.0s+</span>
                    </div>
                    <div className="h-3 bg-toss-lightGray rounded-full overflow-hidden">
                      <div className="h-full bg-toss-gray/30 rounded-full w-[30%]" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Interactive Demo Section - Toss Style */}
        <section id="interactive-demo" className="py-24 sm:py-32 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={tossStagger}
              className="text-center mb-12"
            >
              <motion.h2 
                variants={tossFadeIn}
                className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 text-toss-dark"
              >
                직접 경험해보세요
              </motion.h2>
              <motion.p 
                variants={tossFadeIn}
                className="text-lg text-toss-gray max-w-2xl mx-auto"
              >
                별도의 설치나 가입 없이, Notia의 핵심 기능을 지금 바로 웹에서 체험할 수 있습니다.
              </motion.p>
            </motion.div>

            <motion.div
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              onViewportEnter={() => setShowEditor(true)}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              {!showEditor ? (
                <div 
                  data-testid="landing-editor-skeleton"
                  className="w-full max-w-4xl mx-auto h-[420px] bg-toss-lightGray rounded-toss-xl animate-pulse flex items-center justify-center"
                >
                  <div className="text-toss-light text-lg">에디터 로딩 중...</div>
                </div>
              ) : (
                <React.Suspense 
                  fallback={
                    <div 
                      data-testid="landing-editor-skeleton"
                      className="w-full max-w-4xl mx-auto h-[420px] bg-toss-lightGray rounded-toss-xl animate-pulse flex items-center justify-center"
                    >
                      <div className="text-toss-light text-lg">에디터 로딩 중...</div>
                    </div>
                  }
                >
                  <LazyLandingEditor />
                </React.Suspense>
              )}
            </motion.div>
          </div>
        </section>

        {/* FAQ Section - Toss Style */}
        <section className="py-24 sm:py-32 px-6 bg-toss-lightGray">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={tossStagger}
              className="text-center mb-12"
            >
              <motion.h2 
                variants={tossFadeIn}
                className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-toss-dark"
              >
                자주 묻는 질문
              </motion.h2>
              <motion.p 
                variants={tossFadeIn}
                className="text-toss-gray"
              >
                궁금한 점을 해결해 드려요
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={tossFadeIn}
            >
              <Accordion type="single" collapsible className="w-full space-y-3">
                {faqItems.map((item, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="bg-white rounded-toss-lg px-6 border-none shadow-toss data-[state=open]:shadow-toss-lg transition-all duration-300"
                  >
                    <AccordionTrigger className="text-base font-medium text-left hover:no-underline py-5 text-toss-dark hover:text-notia-primary">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-toss-gray pb-5 leading-relaxed">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </div>
        </section>

        {/* CTA Section - Toss Style */}
        <section className="py-24 sm:py-32 px-6 bg-white">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={tossStagger}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.h2 
              variants={tossFadeIn}
              className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6 text-toss-dark leading-tight"
            >
              생산성의 새로운 기준,<br/>
              <span className="text-notia-primary">Notia</span>와 함께하세요.
            </motion.h2>
            <motion.p 
              variants={tossFadeIn}
              className="text-lg text-toss-gray mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              지금 시작하면 모든 기능을 평생 무료로 사용할 수 있습니다.<br className="hidden sm:block"/>
              더 이상 흩어진 도구들 사이에서 길을 잃지 마세요.
            </motion.p>
            <motion.div 
              variants={tossFadeIn}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button 
                size="lg" 
                className="h-14 px-10 text-base font-medium rounded-toss-lg bg-notia-primary hover:bg-notia-hover text-white shadow-toss-lg hover:shadow-toss-xl transition-all duration-300 hover:-translate-y-0.5"
                onClick={() => navigate('/login')}
              >
                무료로 시작하기
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="h-14 px-10 text-base font-medium rounded-toss-lg border-toss-border text-toss-dark hover:bg-toss-lightGray transition-all duration-300"
                onClick={() => navigate('/download')}
              >
                데스크탑 앱 다운로드
              </Button>
            </motion.div>
            <motion.p 
              variants={tossFadeIn}
              className="mt-8 text-sm text-toss-light"
            >
              macOS, Windows, Linux 지원 • 모바일 앱 출시 예정
            </motion.p>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
