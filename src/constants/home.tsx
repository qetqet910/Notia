import React from 'react';
import Hash from 'lucide-react/dist/esm/icons/hash';
import AtSign from 'lucide-react/dist/esm/icons/at-sign';
import PenSquare from 'lucide-react/dist/esm/icons/pen-square';
import Users from 'lucide-react/dist/esm/icons/users';
import BrainCircuit from 'lucide-react/dist/esm/icons/brain-circuit';
import Feather from 'lucide-react/dist/esm/icons/feather';
import { cubicBezier } from 'framer-motion';

export const features = [
  {
    icon: <Hash className="w-8 h-8 text-white" />,
    title: '#태그로 완성하는 생각의 지도',
    description:
      '모든 노트에 #태그를 붙여 주제별로 손쉽게 분류하고 연결하세요. 흩어져 있던 아이디어가 한눈에 들어오는 지도가 펼쳐집니다.',
  },
  {
    icon: <AtSign className="w-8 h-8 text-white" />,
    title: '@리마인더로 놓치지 않는 약속',
    description:
      '노트 작성 중 ‘@내일 3시’처럼 간단하게 리마인더를 설정하세요. 중요한 약속과 할 일을 정확한 시간에 알려드립니다.',
  },
  {
    icon: <PenSquare className="w-8 h-8 text-white" />,
    title: '마크다운으로 쓰는 모든 것',
    description:
      '표준 마크다운을 지원하여, 작성한 콘텐츠를 블로그나 다른 문서 도구로 손쉽게 옮길 수 있습니다. 당신의 기록은 온전히 당신의 것입니다.',
  },
];

export const userProfiles = [
  {
    icon: <BrainCircuit className="w-10 h-10 text-[#61C9A8]" />,
    title: '콘텐츠 크리에이터',
    description:
      '마크다운으로 초안을 작성하고 #주제별로 아이디어를 관리하세요. 작성한 내용은 바로 블로그나 다른 플랫폼으로 옮길 수 있습니다.',
  },
  {
    icon: <Users className="w-10 h-10 text-[#61C9A8]" />,
    title: '프로젝트 관리자',
    description:
      '회의록을 작성하며 #프로젝트 태그를 달고, ‘@담당자 내일까지’와 같이 바로 할 일을 리마인더로 지정하여 효율적으로 팀을 관리하세요.',
  },
  {
    icon: <Feather className="w-10 h-10 text-[#61C9A8]" />,
    title: '열정적인 학습자',
    description:
      '강의 내용을 #과목별로 정리하고, ‘@시험일’ 리마인더로 중요한 일정을 놓치지 마세요. 가볍고 빨라 어떤 환경에서도 학습에만 집중할 수 있습니다.',
  },
];

export const faqItems = [
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
];

export const initialContent = `# 회의 정리본

## 새 기술 스택 도입 관련
#React #Vite #Tauri #Nest

> 데스크탑 앱 관련하여 Electron보다 Tauri가 이 프로젝트에 적합하다는 판단.
[Tauri Docs/Windows](https://v1.tauri.app/v1/guides/building/windows)

@모레 2시 3차 검증.
`;

// ---- Animation Variants ----
export const fadeIn = (delay = 0.2) => ({
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: cubicBezier(0.42, 0, 0.58, 1) },
  },
});

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.1 },
  },
};
