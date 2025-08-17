import { ChangelogEntry } from '@/types';

export const changelogData: ChangelogEntry[] = [
  {
    version: 'v1.3.0',
    date: '2025년 8월 14일',
    changes: [
      { category: '✨ 기능', description: 'PWA 기능 강화: 다운로드 페이지에 설치 버튼을 추가하고, 매니페스트를 개선하여 설치 경험을 향상시켰습니다.' },
      { category: '💅 디자인', description: '랜딩 페이지, 다운로드 페이지 등 전체적인 UI/UX를 현대적으로 개선했습니다.' },
      { category: '🚀 성능', description: '스켈레톤 로더를 도입하고 콘텐츠 로딩 방식을 최적화하여 초기 로딩 속도를 크게 향상시켰습니다.' },
      { category: '✨ 기능', description: '대시보드 단축키 기능을 개선하고, 사용법을 확인할 수 있는 도움말을 추가했습니다.' },
      { category: '✨ 기능', description: '사용자 프로필에 아바타 기능을 추가하고, 마이페이지를 개선했습니다.' },
      { category: '✨ 기능', description: '리마인더 완료 시 사용자에게 알려주는 알림(Toast) 기능을 추가했습니다.' },
      { category: '🔧 리팩토링', description: '유지보수성 향상을 위해 전체 코드 구조를 리팩토링하고, 빌드 용량을 최적화했습니다.' },
      { category: '🐛 버그 수정', description: '리마인더 시간 관련 오류, 데이터 동기화(낙관적 업데이트) 오류 등 다수의 버그를 수정했습니다.' },
      { category: '⚙️ 기타', description: '검색 엔진 최적화(SEO)를 위한 `robots.txt`를 추가했습니다.' },
    ],
  },
  {
    version: 'v1.2.0',
    date: '2025년 7월 8일',
    changes: [
      { category: '✨ 기능', description: '태그 클릭 시 해당 태그를 포함하는 노트들을 필터링하는 기능을 추가했습니다.' },
      { category: '✨ 기능', description: '마크다운 에디터 기능을 보강하고, 단축키 지원을 추가했습니다.' },
      { category: '🐛 버그 수정', description: '리마인더의 시간대(Timezone) 관련 오류를 해결하여 정확성을 높였습니다.' },
      { category: '🐛 버그 수정', description: '태그 ID 중복으로 인해 발생하던 문제를 해결했습니다.' },
      { category: '💅 디자인', description: '전체적인 폰트를 개선하고, UI/UX 일관성을 높였습니다.' },
      { category: '⚙️ 기타', description: 'ESLint 설정을 추가하여 코드 품질을 관리하기 시작했습니다.' },
    ],
  },
  {
    version: 'v1.1.0',
    date: '2025년 6월 3일',
    changes: [
      { category: '✨ 기능', description: '이메일 및 소셜(Github, Google) 로그인을 포함한 사용자 인증 시스템을 도입했습니다.' },
      { category: '✨ 기능', description: '노트 생성, 수정, 삭제 및 실시간 동기화 기능을 구현했습니다.' },
      { category: '✨ 기능', description: '다크 모드, 딥다크 모드 등 다양한 테마를 지원하기 시작했습니다.' },
      { category: '✨ 기능', description: 'Shadcn/ui를 도입하여 기본적인 UI 컴포넌트들을 구축했습니다.' },
      { category: '🔧 리팩토링', description: 'Zustand를 도입하여 상태 관리 로직을 개선하고, 전체적인 코드 구조를 리팩토링했습니다.' },
      { category: '🐛 버그 수정', description: '초기 OAuth 세션 처리 오류 및 익명 로그인 관련 버그를 수정했습니다.' },
      { category: '🚀 성능', description: 'Lottie 파일을 dotlottie로 변환하여 애니메이션 로딩 성능을 개선했습니다.' },
      { category: '📝 문서', description: '프로젝트 계획, 커밋 규칙 등 초기 개발 문서를 작성했습니다.' },
    ],
  },
  {
    version: 'v1.0.0',
    date: '2025년 5월 15일',
    changes: [
      { category: '⚙️ 기타', description: '프로젝트 초기 설정 및 개발 환경(Vite, React, TS)을 구축했습니다.' },
      { category: '✨ 기능', description: 'UI 구현을 위한 Shadcn/ui, Tailwind CSS 등 핵심 라이브러리를 도입했습니다.' },
      { category: '✨ 기능', description: '익명 및 이메일 기반의 초기 사용자 인증 로직을 구현했습니다.' },
      { category: '📝 문서', description: '프로젝트의 초기 기획과 방향을 설정하고 README 파일을 작성했습니다.' },
      { category: '⚙️ 기타', description: 'Dependabot을 이용한 의존성 관리 자동화를 설정했습니다.' },
    ],
  },
];