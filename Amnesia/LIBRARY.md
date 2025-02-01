# 기술 스택 및 라이브러리 구성

## 기본 개발 환경
- Vite
- TypeScript
- Tailwind CSS
- React 18+

## 상태 관리
- **Zustand**
  - 가볍고 직관적인 상태 관리
  - TypeScript 지원이 우수
  - 로컬 스토리지 미들웨어 지원
  ```bash
  npm install zustand
  ```

## 데이터 저장 및 동기화
- **Dexie.js**
  - IndexedDB를 위한 TypeScript 지원 라이브러리
  - 트랜잭션 지원
  ```bash
  npm install dexie dexie-react-hooks
  ```

## API 통신
- **TanStack Query (React Query)**
  - 캐싱, 동기화, 업데이트 관리
  - 오프라인 지원
  ```bash
  npm install @tanstack/react-query
  ```

## 마크다운 지원
- **MDX**
  - 마크다운 + JSX
- **@uiw/react-md-editor**
  - 마크다운 에디터 컴포넌트
  ```bash
  npm install @mdx-js/react @uiw/react-md-editor
  ```

## 성능 테스트 및 모니터링
- **Lighthouse**
  - 웹 성능 측정
- **web-vitals**
  - 핵심 성능 지표 측정
  ```bash
  npm install web-vitals
  ```
- **@sentry/react**
  - 에러 트래킹
  ```bash
  npm install @sentry/react
  ```

## 보안
- **jose**
  - JWT 토큰 처리
  - 암호화/복호화
  ```bash
  npm install jose
  ```
- **crypto-js**
  - 데이터 암호화
  ```bash
  npm install crypto-js @types/crypto-js
  ```

## UI/UX
- **@headlessui/react**
  - 접근성 높은 UI 컴포넌트
  ```bash
  npm install @headlessui/react
  ```
- **Framer Motion**
  - 애니메이션
  ```bash
  npm install framer-motion
  ```
- **react-hot-toast**
  - 알림 토스트
  ```bash
  npm install react-hot-toast
  ```

## 테스트
- **Vitest**
  - Vite 기반 테스트 프레임워크
  ```bash
  npm install -D vitest
  ```
- **@testing-library/react**
  - React 컴포넌트 테스트
  ```bash
  npm install -D @testing-library/react @testing-library/jest-dom
  ```
- **Cypress**
  - E2E 테스트
  ```bash
  npm install -D cypress
  ```

## PWA 지원
- **vite-plugin-pwa**
  - PWA 설정
  ```bash
  npm install -D vite-plugin-pwa
  ```

## 유틸리티
- **date-fns**
  - 날짜 처리
  ```bash
  npm install date-fns
  ```
- **uuid**
  - 고유 ID 생성
  ```bash
  npm install uuid @types/uuid
  ```
- **zod**
  - 데이터 검증
  ```bash
  npm install zod
  ```

## 개발 도구
- **eslint**
  - 코드 품질 관리
  ```bash
  npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react-hooks
  ```
- **prettier**
  - 코드 포맷팅
  ```bash
  npm install -D prettier eslint-config-prettier
  ```
- **husky**
  - Git hooks 관리
  ```bash
  npm install -D husky
  ```

## 전체 패키지 설치 명령어
```bash
# 프로덕션 의존성
npm install zustand dexie dexie-react-hooks @tanstack/react-query @mdx-js/react @uiw/react-md-editor web-vitals @sentry/react jose crypto-js @types/crypto-js @headlessui/react framer-motion react-hot-toast date-fns uuid @types/uuid zod

# 개발 의존성
npm install -D vitest @testing-library/react @testing-library/jest-dom cypress vite-plugin-pwa eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react-hooks prettier eslint-config-prettier husky
```

## 참고사항
1. 각 라이브러리는 프로젝트 진행 상황에 따라 필요할 때 설치
2. 번들 사이즈 최적화를 위해 tree-shaking 지원 확인
3. TypeScript 타입 정의가 있는지 확인 후 설치
4. 보안 취약점 주기적 점검 필요