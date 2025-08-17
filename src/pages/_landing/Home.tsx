import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import landingAnimation from '/lottie/landingAnimation.lottie';
import rocketAnimation from '/lottie/rocketAnimation.lottie';
import bottomArrow from '/lottie/bottomArrow.lottie';
import '@/styles/LandingTextAnimation.css';
import { LandingEditor } from '@/components/features/landing/LandingEditor';
import {
  features,
  userProfiles,
  faqItems,
  fadeIn,
  staggerContainer,
} from '@/constants/home.tsx';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault();
    const targetId = e.currentTarget.href.split('#')[1];
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 overflow-hidden">
      <Toaster />
      <Header />

      {/* Hero Section */}
      <section className="relative h-screen flex items-center px-6 lg:px-12 overflow-hidden hero-section">
        <div className="absolute inset-0 bg-gradient-to-br from-green-100 via-white to-transparent blur-3xl"></div>
        <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center md:text-left"
          >
            <motion.h1
              variants={fadeIn(0)}
              className="text-5xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight"
            >
              <span className="block mb-2">생각의 조각을</span>
              <span className="block text-shadows">#태그와 @리마인더로</span>
              <span className="block mt-3">완성하세요</span>
            </motion.h1>
            <motion.p
              variants={fadeIn(0.2)}
              className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto md:mx-0"
            >
              마크다운으로 자유롭게 기록하고, 태그 하나로 생각을 정리하며,
              <br />
              일상속 중요한 약속까지 관리하세요. <br />
              당신의 생산성을 위한 가장 가볍고 빠른 도구입니다.
            </motion.p>
            <motion.div variants={fadeIn(0.4)} className="mt-8">
              <Button
                className="bg-[#61C9A8] hover:bg-[#61C9A8]/90 text-white font-bold shadow-lg shadow-[#61C9A8]/30 transform hover:scale-105 transition-all duration-300"
                size="lg"
                onClick={() => navigate('/login')}
              >
                지금 바로 시작하기 <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
            className="hidden md:flex items-center justify-center"
          >
            <div className="w-[600px] h-[600px]">
              <DotLottieReact
                src={landingAnimation}
                loop
                autoplay
                className="w-full h-full"
              />
            </div>
          </motion.div>
        </div>
        <motion.a
          href="#interactive-demo"
          onClick={handleScroll}
          className="absolute bottom-10 left-0 right-0 mx-auto w-12 h-12 cursor-pointer z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          whileHover={{ scale: 1.1 }}
        >
          <DotLottieReact
            src={bottomArrow}
            loop
            autoplay
            className="w-full h-full"
          />
        </motion.a>
      </section>

      {/* Features Section */}
      <section className="py-24 dark-dot-pattern text-white features-section">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div variants={fadeIn(index * 0.1)} key={index}>
                <div className="p-8 rounded-2xl h-full border border-gray-700/50 hover:border-[#61C9A8]/50 hover:bg-white transition-all duration-300">
                  <div className="flex flex-col items-center">
                    <div className="bg-[#61C9A8] w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-lg">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-black">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Built For & Performance Section */}
      <section className="py-24 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-extrabold mb-4 tracking-tight">
              당신의 생산성을 위한 모든 것
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              콘텐츠 크리에이터부터 학습자까지, Notia는 다양한 역할에 최적화된<br/>
              기능을 제공하며 어떤 환경에서도 최고의 성능을 보장합니다.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={staggerContainer}
              className="space-y-8"
            >
              {userProfiles.map((profile, index) => (
                <motion.div key={index} variants={fadeIn(index * 0.1)}>
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">{profile.icon}</div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">
                        {profile.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {profile.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            >
              <div className="p-10 rounded-2xl text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-36 h-36">
                    <DotLottieReact
                      src={rocketAnimation}
                      loop
                      autoplay
                      className="w-full h-full"
                    />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-4">
                  성능에 타협은 없습니다
                </h3>
                <p className="text-lg text-muted-foreground">
                  어떤 환경에서도 즉각적인 반응 속도를 경험하세요. 불필요한
                  기능은 덜어내고, 오직 핵심에만 집중하여 놀랍도록 가볍고 빠르게
                  만들었습니다.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section
        id="interactive-demo"
        className="py-24 px-6 lg:px-12 dark-dot-pattern"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-extrabold mb-4 tracking-tight text-gray-900">
              미리보기
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              아래 편집기에서 직접 #태그와 @리마인더 기능을 사용해보세요.
              <br />
              입력하는 대로 실시간으로 분석하고 똑똑하게 정리합니다.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <LandingEditor />
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-extrabold mb-4 tracking-tight">FAQ</h2>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
          >
            <Accordion type="single" collapsible className="w-full space-y-2">
              {faqItems.map((item, index) => (
                <motion.div key={index} variants={fadeIn(index * 0.1)}>
                  <AccordionItem
                    value={`item-${index}`}
                    className="shadow border-b-0 rounded-xl px-6"
                  >
                    <AccordionTrigger className="text-lg font-medium text-left hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-base text-muted-foreground pt-2 pb-4">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;