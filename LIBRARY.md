# 기술 스택 및 라이브러리 구성

## 기본 개발 환경
- Vite
- TypeScript
- Tailwind CSS
- React 18+

## 상태 관리
- **Zustand** 고려중
  - 가볍고 직관적인 상태 관리
  - TypeScript 지원이 우수
  - 로컬 스토리지 미들웨어 지원
  ```bash
  npm install zustand
  ```

## 데이터 저장 및 동기화
- **Dexie.js** 도입 완료
  - IndexedDB를 위한 TypeScript 지원 라이브러리
  - 트랜잭션 지원
  ```bash
  npm install dexie dexie-react-hooks
  ```

## API 통신
- **TanStack Query (React Query)** 철회
  - 캐싱, 동기화, 업데이트 관리
  - 오프라인 지원
  ```bash
  npm install @tanstack/react-query
  ```

## 마크다운 지원
- **MDX** 철회
  - 마크다운 + JSX
- **@uiw/react-md-editor** 도입 완료
  - 마크다운 에디터 컴포넌트
  ```bash
  npm install @mdx-js/react @uiw/react-md-editor
  ```

## 성능 테스트 및 모니터링
- **Lighthouse** 테스트 예정
  - 웹 성능 측정
- **web-vitals** 추후 도입
  - 핵심 성능 지표 측정
  ```bash
  npm install web-vitals
  ```
- **@sentry/react** 추후 도입
  - 에러 트래킹
  ```bash
  npm install @sentry/react
  ```

## 보안
- **jose** 고려중
  - JWT 토큰 처리
  - 암호화/복호화
  ```bash
  npm install jose
  ```
- **crypto-js** 고려중
  - 데이터 암호화
  ```bash
  npm install crypto-js @types/crypto-js
  ```

## UI/UX
- **@headlessui/react** 대신 shadcn/ui 도입
  - 접근성 높은 UI 컴포넌트
  ```bash
  npm install @headlessui/react
  ```
- **Framer Motion** 도입
  - 애니메이션
  ```bash
  npm install framer-motion
  ```
- **react-hot-toast** 도입 고려중
  - 알림 토스트
  ```bash
  npm install react-hot-toast
  ```

## 테스트
- **Vitest** 도입 예정
  - Vite 기반 테스트 프레임워크
  ```bash
  npm install -D vitest
  ```
- **@testing-library/react** 고려중
  - React 컴포넌트 테스트
  ```bash
  npm install -D @testing-library/react @testing-library/jest-dom
  ```
- **Cypress** 고려중
  - E2E 테스트
  ```bash
  npm install -D cypress
  ```

## PWA 지원
- **vite-plugin-pwa** 도입 완료
  - PWA 설정
  ```bash
  npm install -D vite-plugin-pwa
  ```

## 유틸리티
- **date-fns** 도입 완료
  - 날짜 처리
  ```bash
  npm install date-fns
  ```
- **uuid** 철회
  - 고유 ID 생성
  ```bash
  npm install uuid @types/uuid
  ```
- **zod** 철회
  - 데이터 검증
  ```bash
  npm install zod
  ```

## 개발 도구
- **eslint** 도입 예정
  - 코드 품질 관리
  ```bash
  npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react-hooks
  ```
- **prettier** 도입 예정
  - 코드 포맷팅
  ```bash
  npm install -D prettier eslint-config-prettier
  ```
- **husky** 도입할 필요가 없음
  - Git hooks 관리
  ```bash
  npm install -D husky
  ```

## 참고사항
1. 각 라이브러리는 프로젝트 진행 상황에 따라 필요할 때 설치
2. 번들 사이즈 최적화를 위해 tree-shaking 지원 확인
3. TypeScript 타입 정의가 있는지 확인 후 설치