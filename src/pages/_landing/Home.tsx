import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, cubicBezier } from 'framer-motion';
import {
  Feather,
  Rocket,
  Hash,
  AtSign,
  PenSquare,
  Users,
  BrainCircuit,
} from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

import landing1 from '@/assets/images/landing/landing1.png';
import landing2 from '@/assets/images/landing/landing2.png';
import landing3 from '@/assets/images/landing/landing3.png';
import landing4 from '@/assets/images/landing/landing4.png';
import landing5 from '@/assets/images/landing/landing5.png';

const features = [
  {
    icon: <Hash className="w-10 h-10 text-[#61C9A8]" />,
    title: '#태그로 완성하는 생각의 지도',
    description:
      '모든 노트에 #태그를 붙여 주제별로 손쉽게 분류하고 연결하세요. 흩어져 있던 아이디어가 한눈에 들어오는 지도가 펼쳐집니다.',
  },
  {
    icon: <AtSign className="w-10 h-10 text-[#61C9A8]" />,
    title: '@리마인더로 놓치지 않는 약속',
    description:
      '노트 작성 중 ‘@내일 3시’처럼 간단하게 리마인더를 설정하세요. 중요한 약속과 할 일을 정확한 시간에 알려드립니다.',
  },
  {
    icon: <PenSquare className="w-10 h-10 text-[#61C9A8]" />,
    title: '마크다운으로 쓰는 모든 것',
    description:
      '표준 마크다운을 지원하여, 작성한 콘텐츠를 블로그나 다른 문서 도구로 손쉽게 옮길 수 있습니다. 당신의 기록은 온전히 당신의 것입니다.',
  },
];

const userProfiles = [
  {
    icon: <BrainCircuit className="w-8 h-8 text-[#61C9A8]" />,
    title: '콘텐츠 크리에이터',
    description:
      '마크다운으로 초안을 작성하고 #주제별로 아이디어를 관리하세요. 작성한 내용은 바로 블로그나 다른 플랫폼으로 옮길 수 있습니다.',
  },
  {
    icon: <Users className="w-8 h-8 text-[#61C9A8]" />,
    title: '프로젝트 관리자',
    description:
      '회의록을 작성하며 #프로젝트 태그를 달고, ‘@담당자 내일까지’와 같이 바로 할 일을 리마인더로 지정하여 효율적으로 팀을 관리하세요.',
  },
  {
    icon: <Feather className="w-8 h-8 text-[#61C9A8]" />,
    title: '열정적인 학습자',
    description:
      '강의 내용을 #과목별로 정리하고, ‘@시험일’ 리마인더로 중요한 일정을 놓치지 마세요. 가볍고 빨라 어떤 환경에서도 학습에만 집중할 수 있습니다.',
  },
];

const faqItems = [
  {
    question: '무료로 이용할 수 있나요?',
    answer:
      '네, 현재 제공되는 모든 기능은 무료입니다. 개인적인 기록부터 업무 관리까지, 자유롭게 서비스를 이용해 보세요.',
  },
  {
    question: '데이터는 안전하게 보관되나요?',
    answer:
      '물론입니다. 모든 데이터는 안전한 클라우드 데이터베이스에 암호화되어 저장되며, 저장된 개인정보를 안전하게 보관합니다.',
  },
  {
    question: '저사양 PC에서도 잘 작동하나요?',
    answer:
      '네, 이 서비스는 개발자의 군 복무 경험을 바탕으로 탄생했습니다. 어떤 환경에서도 빠르고 가볍게 작동하도록 최적화에 많은 노력을 기울였습니다.',
  },
  {
    question: '어떤 목적으로 만들어진 서비스인가요?',
    answer:
      'Obsidian처럼 자유롭고 체계적이고, Velog보다 가볍고 쉽고 빠른 리마인더 기능을 결합하여 생산성을 극대화하는 것을 목표로 합니다.',
  },
  {
    question: 'TMI',
    answer:
      '군생활을 하며 세세한 모든 걸 기록하는 습관이 생겼어요, 부작용으로 기록하지 않으면 다 까먹는 것도 생겼답니다.',
  },
];

// ---- 애니메이션 variants ----
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: cubicBezier(0.42, 0, 0.58, 1) },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.1 },
  },
};

// ---- ✨ 안정성을 위해 재작성된 이미지 컴포넌트 ----
const FloatingImage = ({ image, index }: { image: string; index: number }) => {
  // 각 이미지의 최종 위치와 회전값을 미리 계산합니다.
  const finalX = (index - 2) * 180; // 중앙 이미지(index:2)가 x:0 에 위치
  const finalY = (index % 2 === 0 ? -1 : 1) * 30;
  const finalRotate = (index - 2) * 6;

  return (
    <motion.div
      // ✨ variants를 직접 정의하여 타입 안정성을 높입니다.
      initial={{
        opacity: 0,
        scale: 0.5,
        x: 0,
        y: 80,
        rotate: 0,
      }}
      animate={{
        opacity: 1,
        scale: 1,
        x: finalX,
        y: finalY,
        rotate: finalRotate,
        transition: {
          type: 'spring',
          stiffness: 80,
          damping: 10,
          delay: index * 0.15,
        },
      }}
      // ✨ 별도의 transition을 사용하여 무한 반복 애니메이션을 정의합니다.
      transition={{
        duration: 3 + Math.random() * 2,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut',
      }}
      // 호버 애니메이션
      // whileHover={{
      //   y: finalY - 15,
      //   scale: 1.1,
      //   rotate: finalRotate > 0 ? finalRotate + 5 : finalRotate - 5,
      //   zIndex: 10,
      //   transition: { type: 'spring', stiffness: 300, damping: 10 },
      // }}
      className="absolute"
    >
      <img
        src={image}
        alt={`랜딩 이미지 ${index + 1}`}
        className="w-96 h-auto rounded-lg shadow-2xl pointer-events-none border"
      />
    </motion.div>
  );
};

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const landingImages = [landing1, landing2, landing3, landing4, landing5];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 overflow-hidden custom-scrollbar">
      <Toaster />
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-100/30 to-transparent dark:from-green-900/20 dark:to-transparent blur-3xl"></div>
        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center"
          >
            <motion.h1
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="text-5xl md:text-6xl font-bold leading-tight tracking-tight"
            >
              <motion.span variants={fadeIn} className="block">
                생각의 조각을 <span className="text-[#61C9A8]">#태그</span>로
                엮고,
              </motion.span>
              <motion.span variants={fadeIn} className="block">
                중요한 약속은 <span className="text-[#61C9A8]">@리마인더</span>
                로 깨우세요.
              </motion.span>
            </motion.h1>
            <motion.p
              variants={fadeIn}
              className="mt-6 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto"
            >
              마크다운으로 자유롭게 기록하고, 태그 하나로 생각을 정리하며, 일상
              속 중요한 약속까지 관리하세요. 당신의 생산성을 위한 가장 가볍고
              빠른 도구입니다.
            </motion.p>
            <motion.div variants={fadeIn} className="mt-8">
              <Button
                className="bg-[#61C9A8] hover:bg-[#61C9A8]/90 hover:scale-105 transition-all text-white shadow-lg shadow-[#61C9A8]/30"
                size="lg"
                onClick={() => navigate('/login')}
              >
                지금 바로 생각 정리하기
              </Button>
            </motion.div>
          </motion.div>

          {/* ✨ 수정된 이미지 렌더링 컨테이너 */}
          <div className="mt-24 relative h-80 flex justify-center items-center">
            {landingImages.map((image, index) => (
              <FloatingImage key={index} image={image} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div variants={fadeIn} key={index}>
                <Card className="text-center hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full p-6">
                  <div className="flex justify-center mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Built For Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">
              이런 분들을 위해 만들었습니다
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              다양한 역할 속에서 생산성을 높이고 싶은 모든 분들을 위한 최적의
              도구입니다.
            </p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {userProfiles.map((profile, index) => (
              <motion.div key={index} variants={fadeIn}>
                <Card className="text-center hover:shadow-lg transition-shadow duration-300 h-full">
                  <CardContent className="pt-8 pb-6">
                    <div className="flex justify-center mb-4">
                      {profile.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-3">
                      {profile.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {profile.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Performance Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="flex flex-col md:flex-row items-center gap-8 bg-slate-50 dark:bg-slate-900 p-10 rounded-2xl border border-dashed"
          >
            <div className="text-center md:text-left">
              <Rocket className="w-12 h-12 text-[#61C9A8] mb-4 mx-auto md:mx-0" />
              <h2 className="text-3xl font-bold mb-4">
                성능에 타협은 없습니다
              </h2>
              <p className="text-lg text-muted-foreground">
                어떤 환경에서도 즉각적인 반응 속도를 경험하세요. 불필요한 기능은
                덜어내고, 오직 핵심에만 집중하여 놀랍도록 가볍고 빠르게
                만들었습니다.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">자주 묻는 질문</h2>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
          >
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <motion.div key={index} variants={fadeIn}>
                  <AccordionItem value={`item-${index}`}>
                    <AccordionTrigger className="text-lg font-medium text-left hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-base text-muted-foreground pt-2">
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
