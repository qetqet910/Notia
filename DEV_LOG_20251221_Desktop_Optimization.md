# DEV_LOG - Desktop App Optimization & Web UX Fixes

**Date:** 2025-12-21
**Environment:** Windows 10 (Local), Tauri v2, React 19

## 1. Desktop App Architecture Refinement

### 전략적 전환: 가벼운 전용 로그인 화면
데스크탑 앱에서는 웹의 무거운 랜딩 페이지(Lottie 애니메이션 등)가 성능 저하와 CSP(WASM) 오류를 유발하므로, 이를 건너뛰고 전용 로그인 화면을 즉시 띄우도록 변경했습니다.

1.  **로그인 로직 모듈화**:
    *   `src/hooks/useAuthPageLogic.tsx` 커스텀 훅을 생성하여 로그인/회원가입 상태 관리 로직을 분리.
    *   `src/components/features/auth/AuthComponents.tsx`로 UI 컴포넌트(`LoginForm`, `SignupForm`) 분리 및 재사용성 확보.
2.  **전용 페이지 (`DesktopLogin.tsx`)**:
    *   루트 경로(`/`)에서 실행되는 심플한 중앙 정렬 레이아웃 구현.
    *   불필요한 '만들기(Signup)' 탭을 제거하여 사용자 경험 단순화.
3.  **라우팅 최적화**:
    *   `isTauri()` 유틸리티를 통한 환경 감지 강화.
    *   데스크탑 앱은 `HashRouter`, 웹은 `BrowserRouter`를 사용하도록 이원화하여 웹 UX 개선.
    *   `DesktopLogin`을 static import로 변경하여 초기 로딩 속도 극대화.

---

## 2. Critical Fixes & UI Improvements

### 리소스 로딩 및 인증 수정
1.  **폰트 로딩 에러 해결**: `global.css`에서 Google Font CSS URL을 `@font-face`로 직접 참조하던 오류를 `@import` 표준 방식으로 수정 (`OTS parsing error` 해결).
2.  **인증 리다이렉트 루프 해결**:
    *   Supabase 인증 후 돌아오는 `/?code=...` 파라미터를 `HashRouter`가 인식할 수 있도록 `/#/auth/callback?code=...`로 자동 변환하는 로직 추가.
    *   `detectSessionInUrl: false` 설정을 통해 수동 리다이렉트 로직과의 충돌 방지.
3.  **레이아웃 깨짐 수정**: `HelpPage`, `MyPage` 등 콘텐츠가 짧은 페이지에서 배경색이 잘리는 문제를 `min-h-screen` 적용으로 해결.

### UI 세밀 조정
*   **OTP 컴포넌트**: 데스크탑 로그인 화면에서 배경색/패딩을 제거하여 깔끔한 일체형 디자인 적용.
*   **로그아웃 리다이렉트**: 앱 로그아웃 시 `/login`이 아닌 루트(`/`)로 정확히 이동하여 `DesktopLogin`이 즉시 표시되도록 수정.

---

## 3. Development Environment Setup (Windows)

*   `package.json`의 `tauri:dev` 스크립트에서 리눅스 전용 `export` 명령을 제거하여 Windows 환경 호환성 확보.
*   `dev:tauri` 모드를 신설하여 개발 시에도 `VITE_IS_TAURI` 환경 변수가 정확히 주입되도록 개선.

---

## 4. Pending Tasks & Reminders
*   **Supabase Config**: 로컬 개발 환경(`http://localhost:5173`)을 Supabase Redirect URL 목록에 추가해야 정상적인 로그인이 가능함.
*   **Build Check**: 작업이 끝난 뒤 릴리즈 빌드(`npm run tauri:build`)를 통한 최종 검증 필요.
