import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Calendar, Bell, KeyRound, Users, Clock } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/layout/header';

import logoImage from '@/assets/images/Logo.png';
import PlaceHolder from '@/assets/images/Placeholder.png';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const userProfiles = [
    {
      icon: <Users className="w-8 h-8 text-[#61C9A8] mb-2" />,
      title: '바쁜 직장인',
      description: '바쁜 업무중, 빠르게 기록하세요. 기억은 대신 해드립니다.',
    },
    {
      icon: <Clock className="w-8 h-8 text-[#61C9A8] mb-2" />,
      title: '군인',
      description:
        '느려터진 컴퓨터에서도 빠르게 동작합니다. 더이상 스트레스 받지 마십시오.',
    },
    {
      icon: <Star className="w-8 h-8 text-[#61C9A8] mb-2" />,
      title: '학생',
      description:
        '연필보다 키보드가 익숙하신 여러분들을 위해 준비했습니다, 책보다 모니터를 더 많이 보잖아요~',
    },
  ];

  const faqItems = [
    {
      question: '무료로 이용할 수 있나요?',
      answer:
        '네. 무료로 이용 가능합니다, 유료 페이지처럼 만들어놨지만 유료 기능은 없습니다.',
    },
    {
      question: '모바일에서도 사용할 수 있나요?',
      answer:
        '네, React-Native로 만드려다가 포기(증발)했습니다. 하지만 PWA로 모바일에서도 사용 가능합니다.',
    },
    {
      question: '데이터는 안전하게 보관되나요?',
      answer:
        '네, 데이터는 안전하게 보관됩니다. 데이터는 암호화되어 저장되며, 외부로 유출되지 않습니다.',
    },
    {
      question: '다른 앱과 연동이 가능한가요?',
      answer:
        '아직은 불가능합니다. 하지만 추후에 가능하도록 업데이트 할 예정입니다.',
    },
    {
      question: '무슨 목적으로 만들어진 서비스인가요?',
      answer:
        '제가 쓰려고 만들었는데, 포폴로도 사용할 수 있으면 좋을 것 같아서 해봤습니다, 근데 요즘 시대에 이런 것도 포폴로 쳐주나요..?',
    },
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      <Toaster />
      {/* Navigation Bar */}
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="flex-1 space-y-6"
            >
              <h1 className="text-5xl font-bold leading-tight">
                오늘을 기억하고,
                <br /> 내일을 만들어보세요.
              </h1>
              <p className="text-xl text-muted-foreground">
                내일의 자신이 더 나은 일을 할 수 있도록 도와줍니다.
              </p>
              <div className="space-x-4">
                <Button
                  className="bg-[#61C9A8] hover:bg-[#61C9A8] hover:scale-105 transition-all text-white"
                  size="lg"
                  onClick={() => navigate('/login')}
                >
                  시작하기
                </Button>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex-1"
            >
              <Card className="overflow-hidden shadow-lg">
                <CardContent className="p-0">
                  <img
                    src={PlaceHolder}
                    alt="제품 미리보기 사진"
                    className="w-full h-auto"
                  />
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            <motion.div variants={fadeIn}>
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="pt-6">
                  <KeyRound className="w-12 h-12 text-[#61C9A8] mb-4" />
                  <h3 className="text-xl font-semibold mb-2">쉬운 접근성</h3>
                  <p className="text-muted-foreground">
                    어디서든 접근할 수 있는 웹 앱으로 편리하게
                    <br />
                    <b>사용하세요.</b>
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={fadeIn}>
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="pt-6">
                  <Calendar className="w-12 h-12 text-[#61C9A8] mb-4" />
                  <h3 className="text-xl font-semibold mb-2">간편한 인증</h3>
                  <p className="text-muted-foreground">
                    키코드와 통합 로그인으로 <b>쉽고 빠른</b> 서비스를
                    <br />
                    제공합니다.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={fadeIn}>
              <Card className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="pt-6">
                  <Bell className="w-12 h-12 text-[#61C9A8] mb-4" />
                  <h3 className="text-xl font-semibold mb-2">간결한 UX</h3>
                  <p className="text-muted-foreground">
                    간결한 디자인과 가벼운 성능으로 빠르고 간편하게
                    <br />
                    <b>기록하세요.</b>
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Perfect For Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">
              이런 분들에게 추천합니다
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              다양한 사용자가 각자의 목적에 맞게 활용할 수 있는 유연한
              서비스입니다.
            </p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8"
          >
            {userProfiles.map((profile, index) => (
              <motion.div key={index} variants={fadeIn}>
                <Card className="text-center hover:shadow-lg transition-shadow duration-300">
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

      {/* Improved CTA Section */}
      <section className="py-24 bg-[#61C9A8]/10">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-12 text-center max-w-4xl mx-auto relative overflow-hidden"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <h2 className="text-4xl font-bold mb-6">
                지금 기억해야할 게 있나요?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                내일의 나를 믿지 못 하는 여러분!
              </p>
              <div className="space-y-4 md:space-y-0 md:space-x-4 flex flex-col md:flex-row justify-center">
                <Button
                  className="bg-[#61C9A8] hover:bg-[#61C9A8]/90 text-white md:px-8 hover:scale-105 transition-transform"
                  size="lg"
                  onClick={() => navigate('/login')}
                >
                  맛만 보기
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-6">
                내일은 까먹지 않게, 다음 번엔 혼나지 않게, 바로 시작하세요.
              </p>
            </motion.div>
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-[#61C9A8]/10 rounded-br-full"></div>
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-[#61C9A8]/10 rounded-tl-full"></div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">자주 묻는 질문</h2>
            <p className="text-lg text-muted-foreground">
              서비스에 대해 궁금한 점을 확인해보세요.
            </p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
          >
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <motion.div key={index} variants={fadeIn}>
                  <AccordionItem value={`item-${index}`}>
                    <AccordionTrigger className="text-lg font-medium">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

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

export default Home;
