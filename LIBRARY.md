## 상태 관리

- **Zustand**
  - 가볍고 직관적인 상태 관리
  - TypeScript 지원이 우수
  - 로컬 스토리지 미들웨어 지원
  ```bash
  npm install zustand
  ```

## 웹 PC앱 변환

- **Ionic**
- **Electron**

## 데이터 저장 및 동기화

- **Supabase**

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
- **Framer Motion** 도입
  - 애니메이션
  ```bash
  npm install framer-motion
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
