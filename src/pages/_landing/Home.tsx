import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Hash from 'lucide-react/dist/esm/icons/hash';
import FileText from 'lucide-react/dist/esm/icons/file-text';

import { Toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { LandingEditor } from '@/components/features/landing/LandingEditor';
import { useAuthStore } from '@/stores/authStore';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { faqItems } from '@/constants/home';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import landingAnimation from '/lottie/landingAnimation.lottie';
import rocketAnimation from '/lottie/rocketAnimation.lottie';
import connectingAnimation from '/lottie/Connecting.lottie';

// --- Visual Components ---

const GridPattern = () => (
  <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]">
    <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_800px_at_100%_200px,#d5c5ff30,transparent)]"></div>
  </div>
);

// --- Main Component ---

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isMobile = useMediaQuery('(max-width: 767px)');

  // 1. Redirect Logic
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 font-['Orbit'] selection:bg-[#68C7C1]/30 selection:text-slate-900 overflow-x-hidden">
      <Toaster />
      <Header />
      <GridPattern />

      <main>
        {/* Hero Section */}
        <section className="relative h-screen flex items-center px-6 lg:px-12 overflow-hidden hero-section bg-white">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-transparent blur-3xl"></div>
          
          {isMobile && (
            <div className="absolute inset-0 z-0 flex items-center justify-center opacity-30 pointer-events-none" aria-hidden="true">
              <DotLottieReact
                src={connectingAnimation}
                loop
                autoplay
                className="w-full object-cover"
              />
            </div>
          )}
          <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center w-full h-full pt-16 md:pt-0">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-6 sm:space-y-8 md:space-y-10 text-center md:text-left flex flex-col justify-center"
            >
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.2] break-keep">
                <span>기억의 조각을</span>
                <br className="block"/>
                <span className="text-[#68C7C1] inline-flex items-center gap-2 ml-2 sm:ml-0 mt-1 sm:mt-2">
                   연결하세요
                </span>
              </h1>
              <p className="text-base md:text-lg lg:text-xl text-slate-600 max-w-lg mx-auto md:mx-0 leading-relaxed break-keep">
                #태그와 @리마인더를 통해 하나의 노트에서 <br className="block"/>
                체계적으로 정리하고, 스케줄을 관리하세요.
              </p>
              <div className="flex flex-wrap gap-3 sm:gap-4 justify-center md:justify-start pt-2 sm:pt-4">
                <Button
                  size="lg"
                  className="h-10 sm:h-12 md:h-14 px-5 sm:px-6 md:px-8 text-sm sm:text-base md:text-lg bg-[#68C7C1] hover:bg-[#5cb8b2] text-white rounded-full shadow-[0_8px_30px_rgb(104,199,193,0.4)] hover:shadow-xl transition-all hover:-translate-y-1"
                  onClick={() => navigate('/login')}
                >
                  지금 바로 시작하기 <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-10 sm:h-12 md:h-14 px-5 sm:px-6 md:px-8 text-sm sm:text-base md:text-lg rounded-full border-slate-200 hover:bg-white hover:text-[#68C7C1]"
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  더 알아보기
                </Button>
              </div>
            </motion.div>

            {/* Hero Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
              className="hidden md:flex items-center justify-center h-full w-full"
            >
              <div className="w-full h-auto md:w-[450px] md:h-[450px] lg:w-[600px] lg:h-[600px]">
                <DotLottieReact
                  src={landingAnimation}
                  loop
                  autoplay
                  className="w-full h-full"
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Feature Grid (Bento Box Style) */}
        <section id="features" className="py-20 sm:py-32 px-4 sm:px-6 bg-white relative z-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 sm:mb-24">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 sm:mb-8 leading-tight break-keep">
                단 하나의 앱으로 <br />
                <span className="text-[#68C7C1]">완벽한 워크플로우를 완성하세요</span>
              </h2>
            </div>

            <div className="grid sm:grid-cols-4 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
              {/* Feature 1: Editor */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="sm:col-span-2 md:col-span-2 bg-slate-50 rounded-[2rem] sm:rounded-[2.5rem] p-6 border border-slate-100 overflow-hidden relative group shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-2 ">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center">
                      <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-slate-700" />
                    </div>
                  <h3 className="text-xl sm:text-2xl mb-2 font-bold">강력한 마크다운 에디터</h3>
                </div>
                <p className="ml-4 text-slate-500 max-w-md text-base sm:text-s md:text-m lg:text-l leading-relaxed break-keep">
                  복잡한 설정 없이 바로 쓰세요. 코드 하이라이팅, 실시간 프리뷰<br/>
                  그리고 드래그 앤 드롭 이미지 업로드가 지원됩니다.
                </p>
                </div>
                <div className="absolute right-0 bottom-0 w-1/2 h-4/5 bg-white rounded-tl-[2rem] shadow-2xl border border-slate-100 p-4 sm:p-8 translate-x-8 translate-y-4 transition-transform group-hover:translate-x-4 group-hover:translate-y-4 hidden sm:block">
                   <div className="font-mono text-xs sm:text-sm text-slate-400 space-y-2">
                      <span className="text-purple-500 font-bold"># Notia</span> <br/>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-[#68C7C1] rounded flex items-center justify-center text-white text-[10px]">✓</div>
                        <span>MD 블로그 작성</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border border-slate-300 rounded"></div>
                        <span>실시간 동기화</span>
                      </div>
                                            <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border border-slate-300 rounded"></div>
                        <span>단축어 툴바 지원</span>
                      </div>
                   </div>
                </div>
              </motion.div>

              {/* Feature 2: Calendar */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="md:col-span-1 sm:col-span-2 bg-slate-900 text-white rounded-[2rem] sm:rounded-[2.5rem] p-6  border border-slate-800 overflow-hidden relative group shadow-lg"
              >
                 <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-2 ">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm mb-4">
                    <Calendar className="w-6 h-6 sm:w-7 sm:h-7 text-[#68C7C1]" />
                  </div>
                  <h3 className="text-xl sm:text-2xl mb-2 font-bold">자동 일정 관리</h3>

                  </div>
                  <p className="text-slate-400 text-base sm:text-s md:text-m lg:text-l leading-relaxed break-keep">
                    노트에 적은 날짜는<br/>자동으로 캘린더에 등록됩니다.
                  </p>
                </div>
                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-[#68C7C1]/20 rounded-full blur-3xl group-hover:bg-[#68C7C1]/30 transition-colors"></div>
              </motion.div>

              {/* Feature 3: Tags */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="md:col-span-1 sm:col-span-2 bg-gradient-to-br from-[#68C7C1]/5 to-indigo-50/50 rounded-[2rem] sm:rounded-[2.5rem] p-6  border border-[#68C7C1]/10 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center gap-4 mb-2 ">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4 text-[#68C7C1]">
                    <Hash className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <h3 className="text-xl sm:text-2xl mb-2 font-bold text-slate-800">스마트 태그</h3>
                  </div>
                  <p className="text-slate-600/80 mb-6 text-base sm:text-s md:text-m lg:text-l leading-relaxed break-keep">
                    폴더의 한계를 넘어서세요.<br/>
                    직관적인 태그 시스템으로 노트를 다차원적으로 연결합니다.
                  </p>
              </motion.div>

              {/* Feature 4: Performance */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="sm:col-span-2 md:col-span-2 bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 border border-slate-100 shadow-xl shadow-slate-200/40"
              >
                 <div className="flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-12">
                    <div className="flex-1">
                       <div className="flex items-center gap-4 mb-2 ">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center">
                            <DotLottieReact
                              src={rocketAnimation}
                              loop
                              autoplay
                              className="w-[200%] h-[200%]"
                            />
                          </div>
                          <h3 className="text-xl sm:text-2xl font-bold">압도적인 퍼포먼스</h3>
                       </div>
                      
                      <p className="text-slate-500 mb-4 text-base sm:text-s md:text-m lg:text-l leading-relaxed break-keep">
                        Electron이 아닌 Tauri 기반으로 제작되어, 상상 이상의 가벼움과 속도를 자랑합니다. <br/>
                        배터리 소모는 줄이고, 반응 속도는 높였습니다.
                      </p>
                      
                      {/* Performance Bar */}
                       <div className="space-y-5 w-full max-w-xl bg-slate-50 rounded-2xl p-4 border border-slate-100">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                               <span className="font-medium text-slate-700">Notia</span>
                               <span className="font-bold text-[#68C7C1]">0.5s Load</span>
                            </div>
                            <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                               <div className="h-full bg-[#68C7C1] w-[95%]"></div>
                            </div>
                          </div>
                          <div className="space-y-2 opacity-60">
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                               <span className="font-medium text-slate-600">Others</span>
                               <span className="font-bold text-slate-600">2.0s+</span>
                            </div>
                            <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                               <div className="h-full bg-slate-400 w-[30%]"></div>
                            </div>
                          </div>
                       </div>
                    </div>
                 </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Interactive Demo Section */}
        <section id="interactive-demo" className="py-20 sm:py-40 px-4 sm:px-6 dark-dot-pattern bg-background text-white relative overflow-hidden">
           {/* Before Gradient */}
          <div className="absolute top-0 left-0 right-0 h-20 sm:h-40 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
          
          <div className="max-w-7xl mx-auto relative z-20">
            <div className="text-center mb-12 sm:mb-20">
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-2  text-gray-900 break-keep">직접 경험해보세요</h2>
              <p className="text-muted-foreground text-base sm:text-lg break-keep">
                별도의 설치나 가입 없이, Notia의 핵심 기능을 지금 바로 웹에서 체험할 수 있습니다.
              </p>
            </div>
            
            <motion.div 
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="w-full"
            >
                  <LandingEditor />
            </motion.div>
          </div>

          {/* After Gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-40 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />
        </section>

        {/* FAQ Section */}
        <section className="py-20 sm:py-40 bg-white">
          <div className="max-w-4xl mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12 sm:mb-20"
            >
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 tracking-tight">FAQ</h2>
              <p className="text-slate-500 text-base sm:text-lg break-keep">자주 묻는 질문을 확인하세요.</p>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              className="space-y-4 sm:space-y-6"
            >
              <Accordion type="single" collapsible className="w-full space-y-4 sm:space-y-6">
                {faqItems.map((item, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="border border-slate-100 rounded-2xl px-6 sm:px-8 data-[state=open]:bg-slate-50 data-[state=open]:border-[#68C7C1]/30 transition-all duration-300"
                  >
                    <AccordionTrigger className="text-base sm:text-lg md:text-xl font-medium text-left hover:no-underline py-4 sm:py-6 break-keep">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm sm:text-base md:text-lg text-slate-600 pb-6 sm:pb-8 leading-relaxed break-keep">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 sm:py-40 px-4 sm:px-6 text-center relative overflow-hidden bg-white">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#68C7C1]/5 pointer-events-none"></div>
          <div className="max-w-4xl mx-auto relative z-10">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-8 sm:mb-10 tracking-tight text-slate-900 leading-tight break-keep">
              생산성의 새로운 기준,<br/>
              <span className="text-[#68C7C1]">Notia</span>와 함께하세요.
            </h2>
            <p className="text-base sm:text-lg md:text-2xl text-slate-500 mb-8 sm:mb-12 leading-relaxed break-keep">
              지금 시작하면 모든 기능을 평생 무료로 사용할 수 있습니다.<br className="hidden sm:block"/>
              더 이상 흩어진 도구들 사이에서 길을 잃지 마세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
              <Button 
                size="lg" 
                className="w-full sm:w-auto h-14 sm:h-16 px-8 sm:px-12 text-lg sm:text-xl rounded-full bg-[#68C7C1] hover:bg-[#5cb8b2] text-white shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
                onClick={() => navigate('/login')}
              >
                무료로 시작하기
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto h-14 sm:h-16 px-8 sm:px-12 text-lg sm:text-xl rounded-full border-slate-200 hover:bg-white hover:text-[#68C7C1]"
                onClick={() => navigate('/download')}
              >
                데스크탑 앱 다운로드
              </Button>
            </div>
            <p className="mt-6 sm:mt-8 text-sm sm:text-base text-slate-400 break-keep">
              macOS, Windows, Linux 지원 • 모바일 앱 출시 예정
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}