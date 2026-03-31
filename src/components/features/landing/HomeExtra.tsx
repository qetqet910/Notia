import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { faqItems } from '@/constants/home';

// --- Toss Style Animation Constants ---
const TOSS_EASE = [0.16, 1, 0.3, 1] as any;

const tossFadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: TOSS_EASE }
  }
};

const tossStagger = {
  visible: {
    transition: { staggerChildren: 0.1 }
  }
};

export const HomeExtra = () => {
    const navigate = useNavigate();

    return (
        <>
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
        </>
    );
};
