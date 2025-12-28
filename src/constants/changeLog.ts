import { ChangelogEntry } from '@/types';

export const changelogData: ChangelogEntry[] = [
  {
    version: 'v1.0.1',
    date: '2025년 12월 28일',
    userChanges: [
      { category: '⚡ 성능', description: '앱의 핵심 연산 로직을 최적화하여 데이터 처리 속도를 획기적으로 개선했습니다.' },
      { category: '🔔 알림', description: '데스크톱과 웹 어디서든 놓치지 않고 정확한 타이밍에 알림을 받을 수 있습니다.' },
      { category: '📡 오프라인', description: '인터넷이 끊겨도 걱정 마세요. 작업한 내용은 로컬에 안전하게 저장됩니다.' },
      { category: '🔄 업데이트', description: '이제 새로운 기능이 나오면 앱이 알아서 알려주고 간편하게 설치할 수 있습니다.' },
    ],
    devChanges: [
      { category: '🛡️ 보안', description: 'Type Safety: 프로젝트 전체의 타입 안정성을 강화하여 잠재적인 오류를 제거했습니다.' },
      { category: '🧪 테스트', description: 'Unit Tests: 핵심 기능에 대한 테스트 코드를 작성하여 신뢰성을 확보했습니다.' },
      { category: '🔧 리팩토링', description: 'Local-First: SQLite와 IndexedDB를 활용한 이중 저장소 아키텍처를 구현했습니다.' },
    ],
  },
  {
    version: 'v1.0.0',
    date: '2025년 12월 23일',
    userChanges: [
      { category: '✨ 기능', description: 'Notia v1.0.0 GRAND OPEN! 웹과 데스크톱을 잇는 완벽한 노트 경험.' },
      { category: '✨ 기능', description: '데스크톱 앱 전용 로그인 페이지를 새롭게 단장하여 첫인상을 개선했습니다.' },
      { category: '💅 디자인', description: '앱 전반의 애니메이션과 레이아웃이 최종적으로 다듬어졌습니다.' },
    ],
    devChanges: [
      { category: '🔧 리팩토링', description: 'Router Strategy: Tauri(HashRouter)와 Web(BrowserRouter) 환경을 분리하여 404 이슈를 원천 차단했습니다.' },
      { category: '🚀 성능', description: 'Boot Optimization: 데스크톱 앱 초기 구동 시 불필요한 리소스 로딩을 제거하여 실행 속도를 높였습니다.' },
      { category: '🐛 버그 수정', description: 'Race Condition: 로그아웃 시 세션 정리와 페이지 이동 간의 타이밍 이슈를 해결했습니다.' },
    ],
  },
  {
    version: 'v0.9.3',
    date: '2025년 12월 21일',
    userChanges: [
      { category: '✨ 기능', description: '앱 아이콘과 실행 환경이 데스크톱(Windows/Mac)에 최적화되었습니다.' },
      { category: '🐛 버그 수정', description: '특정 상황에서 로그아웃 버튼이 반응하지 않던 문제를 고쳤습니다.' },
    ],
    devChanges: [
      { category: '🔧 리팩토링', description: 'Auth Flow: 데스크톱 환경에서의 OAuth 인증 후 리다이렉션 처리를 견고하게 개선했습니다.' },
      { category: '⚙️ 기타', description: 'Environment Separation: `VITE_IS_TAURI` 플래그를 통해 플랫폼별 로직 분기를 명확히 했습니다.' },
    ],
  },
  {
    version: 'v0.9.2',
    date: '2025년 12월 18일',
    userChanges: [
      { category: '🐛 버그 수정', description: '앱 사용 중 드물게 발생하던 흰색 화면 멈춤(White Screen) 현상을 해결했습니다.' },
      { category: '🚀 성능', description: '네트워크 상태가 좋지 않아도 앱이 꺼지지 않고 버티도록 개선했습니다.' },
    ],
    devChanges: [
      { category: '⚙️ 기타', description: 'Build Optimization: OOM(Out of Memory) 방지를 위해 Node.js 힙 메모리 설정을 조정했습니다.' },
      { category: '🔧 리팩토링', description: 'Asset Handling: Tauri 빌드 시 PWA 관련 파일(Service Worker)이 충돌하지 않도록 제외 처리했습니다.' },
    ],
  },
  {
    version: 'v0.9.1',
    date: '2025년 12월 08일',
    userChanges: [
      { category: '🐛 버그 수정', description: '윈도우에서 앱을 켰을 때 일부 이미지가 깨져 보이던 문제를 수정했습니다.' },
      { category: '⚙️ 기타', description: '앱의 내부 구조를 탄탄하게 다져서 오류 발생 가능성을 낮췄습니다.' },
    ],
    devChanges: [
      { category: '🔧 리팩토링', description: 'Dynamic Imports: 프로덕션 빌드에서 청크 로딩 에러(ChunkLoadError)를 방지하기 위해 정적 임포트로 전환했습니다.' },
      { category: '⚙️ 기타', description: 'Path Resolution: Vite의 base path 설정을 상대 경로(./)로 통일하여 배포 환경 호환성을 높였습니다.' },
    ],
  },
  {
    version: 'v0.9.0',
    date: '2025년 12월 01일',
    userChanges: [
      { category: '💅 디자인', description: '"Notia 3.0" 디자인 적용: 눈이 편안하고 모던한 UI로 완전히 새로워졌습니다.' },
      { category: '✨ 기능', description: '버튼 클릭, 화면 전환 등의 반응 속도가 눈에 띄게 빨라졌습니다.' },
    ],
    devChanges: [
      { category: '🚀 성능', description: 'Bundle Diet: 무거운 Lottie JSON을 dotlottie 포맷으로 변환하여 번들 사이즈를 30% 감량했습니다.' },
      { category: '🔧 리팩토링', description: 'React 19: 컴포넌트의 불필요한 리렌더링을 방지하기 위해 Side Effect를 엄격하게 제어했습니다.' },
    ],
  },
  {
    version: 'v0.8.5',
    date: '2025년 11월 29일',
    userChanges: [
      { category: '✨ 기능', description: '노트 미리보기: 클릭하지 않고도 마우스만 올려서 내용을 쓱 훑어볼 수 있어요.' },
      { category: '✨ 기능', description: '화면 분할: 목록과 내용을 동시에 띄워두고 시원하게 작업하세요.' },
    ],
    devChanges: [
      { category: '🔧 리팩토링', description: 'Preview Architecture: 마크다운 파싱 로직을 분리하여 미리보기 렌더링 부하를 최소화했습니다.' },
      { category: '🐛 버그 수정', description: 'Layout Shift: 리스트 렌더링 시 높이 계산 오류로 인한 화면 떨림 현상을 수정했습니다.' },
    ],
  },
  {
    version: 'v0.8.0',
    date: '2025년 11월 04일',
    userChanges: [
      { category: '✨ 기능', description: '모바일/태블릿 맞춤 화면: 어떤 기기에서 접속해도 딱 맞는 화면을 보여줍니다.' },
      { category: '⚙️ 기타', description: '구글 검색 결과에서 Notia가 더 정확하게 표시되도록 개선했어요.' },
    ],
    devChanges: [
      { category: '⚙️ 기타', description: 'SEO Solution: Prerender.io 미들웨어를 도입하여 SPA의 검색 엔진 노출 한계를 극복했습니다.' },
      { category: '🔧 리팩토링', description: 'Responsive Layout: Grid 및 Flex 시스템을 재정비하여 반응형 대응을 완료했습니다.' },
    ],
  },
  {
    version: 'v0.7.5',
    date: '2025년 10월 23일',
    userChanges: [
      { category: '✨ 기능', description: '글쓰기 엔진 업그레이드: 입력 반응이 훨씬 부드럽고 빨라졌습니다.' },
      { category: '✨ 기능', description: '스마트폰에서 키패드가 화면을 가리던 불편함을 해결했습니다.' },
    ],
    devChanges: [
      { category: '🔧 리팩토링', description: 'CodeMirror Modules: 에디터 확장 기능(하이라이팅, 키맵 등)을 독립 모듈로 분리했습니다.' },
      { category: '🚀 성능', description: 'Image Optimization: 모든 정적 이미지를 WebP 포맷으로 변환하여 로딩 속도를 개선했습니다.' },
    ],
  },
  {
    version: 'v0.7.0',
    date: '2025년 10월 05일',
    userChanges: [
      { category: '🚀 성능', description: '앱 로딩 속도가 획기적으로 빨라졌습니다. (Lighthouse 점수 90+ 달성)' },
      { category: '✨ 기능', description: '오프라인 상태에서도 기본적인 앱 실행이 가능해졌습니다.' },
    ],
    devChanges: [
      { category: '🚀 성능', description: 'Core Web Vitals: LCP(Largest Contentful Paint) 개선을 위해 리소스 우선순위를 조정했습니다.' },
      { category: '⚙️ 기타', description: 'PWA Manifest: 웹 앱 설치 및 오프라인 구동을 위한 매니페스트 설정을 완료했습니다.' },
    ],
  },
  {
    version: 'v0.6.5',
    date: '2025년 9월 13일',
    userChanges: [
      { category: '✨ 기능', description: '편집 툴바 개선: 자주 쓰는 서식 도구를 더 찾기 쉽게 배치했습니다.' },
      { category: '🐛 버그 수정', description: '노트 저장 시 간헐적으로 발생하던 동기화 오류를 수정했습니다.' },
    ],
    devChanges: [
      { category: '🔧 리팩토링', description: 'Supabase Client: 보안 강화를 위해 클라이언트 인스턴스 생성 방식을 싱글톤으로 변경했습니다.' },
      { category: '🐛 버그 수정', description: 'Toolbar Logic: 에디터 포커스 소실 시 툴바 상태가 초기화되는 문제를 해결했습니다.' },
    ],
  },
  {
    version: 'v0.6.0',
    date: '2025년 8월 17일',
    userChanges: [
      { category: '✨ 기능', description: '설치형 웹 앱(PWA): 브라우저 메뉴에서 앱을 설치해서 바탕화면에 추가해보세요.' },
      { category: '💅 디자인', description: 'Notia를 소개하는 새로운 랜딩 페이지가 오픈되었습니다.' },
    ],
    devChanges: [
      { category: '⚙️ 기타', description: 'CI/CD Pipeline: Github Actions로 빌드 및 배포 자동화 파이프라인을 구축했습니다.' },
      { category: '🔧 리팩토링', description: 'Multi-platform Build: Windows, macOS, Linux 타겟별 Tauri 빌드 스크립트를 작성했습니다.' },
    ],
  },
  {
    version: 'v0.5.0',
    date: '2025년 7월 08일',
    userChanges: [
      { category: '✨ 기능', description: '활동 그래프: 나의 기록 습관을 멋진 그래프로 확인해보세요.' },
      { category: '✨ 기능', description: '지금 보고 계신 업데이트 내역(Changelog) 페이지가 추가되었습니다.' },
    ],
    devChanges: [
      { category: '🔧 리팩토링', description: 'State Management: Context API에서 Zustand로 전역 상태 관리 라이브러리를 교체했습니다.' },
      { category: '🐛 버그 수정', description: 'Optimistic UI: 데이터 변경 시 화면 갱신이 지연되던 문제를 낙관적 업데이트로 해결했습니다.' },
    ],
  },
  {
    version: 'v0.4.0',
    date: '2025년 6월 03일',
    userChanges: [
      { category: '✨ 기능', description: '태그 시스템: #태그를 붙여서 노트를 깔끔하게 분류해보세요.' },
      { category: '✨ 기능', description: '토스트 알림: 작업이 완료되면 화면 아래에 친절한 메시지가 뜹니다.' },
    ],
    devChanges: [
      { category: '⚙️ 기타', description: 'Code Quality: ESLint, Prettier, Husky를 도입하여 코드 스타일을 표준화했습니다.' },
      { category: '🐛 버그 수정', description: 'UUID: 태그 ID 중복 생성을 방지하기 위해 UUID v4 생성 방식을 도입했습니다.' },
    ],
  },
  {
    version: 'v0.3.0',
    date: '2025년 5월 15일',
    userChanges: [
      { category: '✨ 기능', description: '다크 모드: 밤에는 눈이 편안한 어두운 테마로 바꿔보세요.' },
      { category: '✨ 기능', description: '프로필 설정: 나만의 닉네임과 프로필 사진을 꾸밀 수 있습니다.' },
    ],
    devChanges: [
      { category: '⚙️ 기타', description: 'Database: Supabase RLS(Row Level Security) 정책을 수립하여 데이터 보안을 강화했습니다.' },
      { category: '🔧 리팩토링', description: 'Component: Shadcn/UI 라이브러리를 기반으로 공통 컴포넌트 시스템을 구축했습니다.' },
    ],
  },
  {
    version: 'v0.2.0',
    date: '2025년 4월 20일',
    userChanges: [
      { category: '✨ 기능', description: '간편 로그인: 구글이나 깃허브 아이디로 1초 만에 가입하세요.' },
      { category: '✨ 기능', description: '게스트 모드: 회원가입 없이도 바로 메모를 작성해볼 수 있습니다.' },
    ],
    devChanges: [
      { category: '⚙️ 기타', description: 'Serverless: Supabase Edge Functions를 통해 서버리스 백엔드 로직을 구현했습니다.' },
      { category: '🐛 버그 수정', description: 'Session: 액세스 토큰 만료 시 로그인이 풀리는 현상을 수정했습니다.' },
    ],
  },
  {
    version: 'v0.1.0',
    date: '2025년 2월 15일',
    userChanges: [
      { category: '✨ 기능', description: 'Notia의 탄생: 웹에서 가장 쓰기 편한 마크다운 노트를 목표로 시작했습니다.' },
      { category: '✨ 기능', description: '기본 기능: 마크다운 작성, 저장, 삭제 등 핵심 기능이 구현되었습니다.' },
    ],
    devChanges: [
      { category: '⚙️ 기타', description: 'Scaffolding: Vite + React 19 + TypeScript 환경에서 프로젝트를 시작했습니다.' },
      { category: '⚙️ 기타', description: 'Markdown: react-markdown 라이브러리를 기반으로 렌더링 엔진을 구축했습니다.' },
    ],
  },
];
